from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.company import Company
from app.models.user import User


def test_database_dependency_injection_uses_temporary_sqlite_database(tmp_path) -> None:
    sqlite_path = tmp_path / "salescompass_test.db"
    test_engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as client:
            register_response = client.post(
                "/api/v1/auth/register",
                json={
                    "email": "injection-test@example.com",
                    "username": "Injection Test",
                    "password": "super-secret-password",
                },
            )
            assert register_response.status_code == 200

            login_response = client.post(
                "/api/v1/auth/login",
                data={
                    "username": "injection-test@example.com",
                    "password": "super-secret-password",
                },
            )
            assert login_response.status_code == 200
            token = login_response.json()["access_token"]

            company_response = client.post(
                "/api/v1/companies",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": "Temporary SQLite Co",
                    "mode": "no_history",
                    "industry": "B2B SaaS",
                    "description": "A test company used to validate database dependency injection.",
                    "problem_solved": "Manual qualification workflows",
                    "target_user_guess": "Sales operations leaders",
                    "hypothetical_ticket": 12000,
                    "known_competitors": ["Manual spreadsheets"],
                    "early_leads": ["RevOps teams"],
                },
            )
            assert company_response.status_code == 200

        with TestingSessionLocal() as db:
            user = db.query(User).filter(User.email == "injection-test@example.com").one()
            company = db.query(Company).filter(Company.user_id == user.id).one()

            assert user.username == "Injection Test"
            assert company.name == "Temporary SQLite Co"
            assert company.mode == "no_history"
            assert company.hypothetical_ticket == 12000
            assert sqlite_path.exists()
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()
        sqlite_path.unlink(missing_ok=True)

    assert not sqlite_path.exists()
