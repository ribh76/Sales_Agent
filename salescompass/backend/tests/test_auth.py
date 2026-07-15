from datetime import timedelta

from fastapi.testclient import TestClient

from app.core.security import create_access_token, decode_access_token
from app.main import app


def register_user(
    client: TestClient,
    *,
    email: str = "auth-user@example.com",
    username: str = "auth-user",
    password: str = "password123",
):
    return client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )


def test_health_check() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_rejects_duplicate_email_with_409() -> None:
    client = TestClient(app)
    response = register_user(client, email="duplicate-email@example.com", username="dup-email")
    assert response.status_code == 200

    duplicate = register_user(
        client,
        email="duplicate-email@example.com",
        username="dup-email-2",
    )

    assert duplicate.status_code == 409


def test_register_rejects_duplicate_username_with_409() -> None:
    client = TestClient(app)
    response = register_user(client, email="duplicate-username@example.com", username="dup-name")
    assert response.status_code == 200

    duplicate = register_user(
        client,
        email="duplicate-username-2@example.com",
        username="dup-name",
    )

    assert duplicate.status_code == 409


def test_auth_responses_never_return_password_hashes() -> None:
    client = TestClient(app)
    email = "no-hash@example.com"
    password = "password123"

    register_response = register_user(client, email=email, username="no-hash", password=password)
    assert register_response.status_code == 200
    assert "hashed_password" not in register_response.json()
    assert "password" not in register_response.json()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    assert "hashed_password" not in login_response.json()["user"]
    assert "password" not in login_response.json()["user"]

    token = login_response.json()["access_token"]
    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert "hashed_password" not in me_response.json()
    assert "password" not in me_response.json()


def test_register_validates_password_length() -> None:
    client = TestClient(app)

    response = register_user(
        client,
        email="short-password@example.com",
        username="short-password",
        password="short",
    )

    assert response.status_code == 422


def test_register_validates_email_format() -> None:
    client = TestClient(app)

    response = register_user(
        client,
        email="not-an-email",
        username="invalid-email",
    )

    assert response.status_code == 422


def test_bad_token_returns_401() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401


def test_expired_token_returns_401() -> None:
    client = TestClient(app)
    email = "expired-token@example.com"
    response = register_user(client, email=email, username="expired-token")
    assert response.status_code == 200

    expired_token = create_access_token(email, expires_delta=timedelta(minutes=-1))

    assert decode_access_token(expired_token) is None
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
