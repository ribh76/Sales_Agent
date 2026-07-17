from datetime import timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, decode_access_token
from app.main import app


PROTECTED_COMPANY_PAYLOAD: dict[str, Any] = {
    "name": "Protected Route Co",
    "mode": "history",
    "industry": "Manufacturing consulting",
    "description": "Helps manufacturers reduce downtime across distributed production teams.",
    "average_ticket": 25000,
    "past_clients": "mid-market manufacturers",
}


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
    assert duplicate.json() == {"detail": "A user with this email already exists"}


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
    assert duplicate.json() == {"detail": "A user with this username already exists"}


def test_bad_login_fails_cleanly_with_401() -> None:
    client = TestClient(app)
    response = register_user(
        client,
        email="bad-login@example.com",
        username="bad-login",
        password="password123",
    )
    assert response.status_code == 200

    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "bad-login@example.com", "password": "wrong-password"},
    )

    assert bad_login.status_code == 401
    assert bad_login.json() == {"detail": "Incorrect email or password"}


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

    for payload in (register_response.json(), login_response.json(), me_response.json()):
        assert not _contains_secret_field(payload)


def test_auth_me_works_after_login() -> None:
    client = TestClient(app)
    email = "me-after-login@example.com"
    username = "me-after-login"
    password = "password123"
    response = register_user(client, email=email, username=username, password=password)
    assert response.status_code == 200

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == email
    assert me_response.json()["username"] == username


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


@pytest.mark.parametrize(
    ("method", "path", "json"),
    [
        ("get", "/api/v1/auth/me", None),
        ("get", "/api/v1/companies", None),
        ("post", "/api/v1/companies", PROTECTED_COMPANY_PAYLOAD),
        ("get", "/api/v1/companies/1", None),
        ("put", "/api/v1/companies/1", {"description": "Updated description long enough."}),
        ("delete", "/api/v1/companies/1", None),
        ("get", "/api/v1/companies/1/analyses", None),
        ("get", "/api/v1/analyses", None),
        ("post", "/api/v1/analyses", {"company": PROTECTED_COMPANY_PAYLOAD}),
        ("get", "/api/v1/analyses/1", None),
        ("post", "/api/v1/analyses/1/approve", None),
        ("post", "/api/v1/analyses/1/refine", {"notes": "Focus the recommendation."}),
        ("post", "/api/v1/analyses/1/action-plan", None),
        ("get", "/api/v1/analyses/1/feedback", None),
        ("post", "/api/v1/feedback", {"icp_run_id": 1, "outcome": "won"}),
        ("get", "/api/v1/feedback/1", None),
    ],
)
def test_protected_routes_reject_missing_token(
    method: str,
    path: str,
    json: dict[str, Any] | None,
) -> None:
    client = TestClient(app)

    response = client.request(method.upper(), path, json=json)

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def _contains_secret_field(value: Any) -> bool:
    if isinstance(value, dict):
        for key, item in value.items():
            normalized_key = str(key).lower()
            if "password" in normalized_key or "hash" in normalized_key:
                return True
            if _contains_secret_field(item):
                return True
    if isinstance(value, list):
        return any(_contains_secret_field(item) for item in value)
    return False
