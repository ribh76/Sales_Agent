from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal
from app.main import app
from app.models.evaluation import EvaluationProfile, EvaluationResult
from app.models.icp_run import ICPRun
from app.seed.seed_eval_profiles import seed_evaluation_profiles
from app.services.demo_market_data import DEMO_PROFILES


def test_clean_database_starts_and_seed_evaluation_profiles_exist() -> None:
    with SessionLocal() as db:
        profiles = db.query(EvaluationProfile).order_by(EvaluationProfile.name).all()

    assert {profile.name for profile in profiles} == set(DEMO_PROFILES)
    assert all(profile.profile_input for profile in profiles)


def test_seed_evaluation_profiles_is_idempotent_on_clean_database(tmp_path) -> None:
    sqlite_path = tmp_path / "seeded.db"
    engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    try:
        with TestingSessionLocal() as db:
            seed_evaluation_profiles(db)
            seed_evaluation_profiles(db)
            profiles = db.query(EvaluationProfile).all()

        assert len(profiles) == len(DEMO_PROFILES)
        assert {profile.name for profile in profiles} == set(DEMO_PROFILES)
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_migrations_apply_to_clean_database(tmp_path, monkeypatch) -> None:
    sqlite_path = tmp_path / "migrated.db"
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{sqlite_path}")
    config = Config(str(_backend_dir() / "alembic.ini"))

    command.upgrade(config, "head")

    engine = create_engine(f"sqlite:///{sqlite_path}")
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        assert {
            "users",
            "companies",
            "icp_runs",
            "feedback",
            "evaluation_profiles",
            "evaluation_results",
            "alembic_version",
        }.issubset(tables)

        icp_columns = {column["name"] for column in inspector.get_columns("icp_runs")}
        assert {"agent_output", "baseline_output", "review_status"}.issubset(icp_columns)
        feedback_columns = {column["name"] for column in inspector.get_columns("feedback")}
        assert {"outcome", "reason"}.issubset(feedback_columns)
    finally:
        engine.dispose()


def test_icp_runs_save_agent_and_baseline_outputs() -> None:
    with TestClient(app) as client:
        headers = _register_and_login(client, "persist-run@example.com", "persist-run")
        response = client.post(
            "/api/v1/analyses",
            headers=headers,
            json={"company": _company_payload("Persisted ICP Co")},
        )
        assert response.status_code == 200, response.text
        run_id = response.json()["run_id"]

    with SessionLocal() as db:
        run = db.query(ICPRun).filter(ICPRun.id == run_id).one()
        assert run.agent_output["icp"]["profile"]
        assert run.baseline_output["segment"]


def test_evaluation_results_save_human_preference() -> None:
    with TestClient(app) as client:
        evaluation = client.post(
            "/api/v1/evaluation/run",
            json={"profile_key": "northstar-enablement"},
        )
        assert evaluation.status_code == 200, evaluation.text
        result_id = evaluation.json()["id"]

        rating = client.post(
            f"/api/v1/evaluation/results/{result_id}/rate",
            json={"human_preference": "agent", "notes": "Agent was more actionable."},
        )
        assert rating.status_code == 200, rating.text

    with SessionLocal() as db:
        result = db.query(EvaluationResult).filter(EvaluationResult.id == result_id).one()
        assert result.human_preference == "agent"
        assert result.notes == "Agent was more actionable."


def _register_and_login(client: TestClient, email: str, username: str) -> dict[str, str]:
    password = "password123"
    register = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert register.status_code == 200
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _company_payload(name: str) -> dict[str, Any]:
    return {
        "name": name,
        "mode": "history",
        "industry": "Manufacturing consulting",
        "description": "Helps manufacturers reduce downtime across distributed production teams.",
        "average_ticket": 25000,
        "past_clients": "mid-market manufacturers and logistics operators",
    }


def _backend_dir() -> Path:
    return Path(__file__).resolve().parents[1]
