from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.services import analysis_pipeline
from app.main import app


def _raising_claude(exc: Exception) -> Callable[[str, bool], dict[str, Any]]:
    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        raise exc

    return fake_call


@pytest.mark.parametrize(
    ("case_name", "api_key", "fake_claude", "expected_warning"),
    [
        (
            "missing Anthropic key",
            None,
            lambda prompt, use_web_search=False: {},
            analysis_pipeline.MISSING_ANTHROPIC_KEY_WARNING,
        ),
        (
            "invalid Anthropic key",
            "invalid-key",
            lambda prompt, use_web_search=False: {},
            analysis_pipeline.UNAVAILABLE_CLAUDE_WARNING,
        ),
        (
            "Anthropic timeout",
            "configured-key",
            _raising_claude(TimeoutError("Claude request timed out")),
            analysis_pipeline.UNAVAILABLE_CLAUDE_WARNING,
        ),
        (
            "Anthropic rate limit",
            "configured-key",
            _raising_claude(RuntimeError("rate limit exceeded")),
            analysis_pipeline.UNAVAILABLE_CLAUDE_WARNING,
        ),
        (
            "malformed Claude JSON",
            "configured-key",
            lambda prompt, use_web_search=False: {"unexpected": "shape"},
            analysis_pipeline.MALFORMED_CLAUDE_JSON_WARNING,
        ),
        (
            "empty model response",
            "configured-key",
            lambda prompt, use_web_search=False: {},
            analysis_pipeline.UNAVAILABLE_CLAUDE_WARNING,
        ),
    ],
)
def test_create_analysis_survives_llm_provider_failures_with_frontend_warning(
    monkeypatch,
    case_name: str,
    api_key: str | None,
    fake_claude: Callable[[str, bool], dict[str, Any]],
    expected_warning: str,
) -> None:
    monkeypatch.setattr(analysis_pipeline.settings, "anthropic_api_key", api_key)
    monkeypatch.setattr(analysis_pipeline, "call_claude_json", fake_claude)

    with TestClient(app) as client:
        headers = _register_and_login(client, case_name)
        response = client.post(
            "/api/v1/analyses",
            headers=headers,
            json={"company": _company_payload(case_name)},
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["agent_output"]["icp"]["profile"]
    assert payload["baseline_output"]["segment"]
    assert payload["error_message"] == expected_warning


def _register_and_login(client: TestClient, label: str) -> dict[str, str]:
    slug = (
        label.lower()
        .replace(" ", "-")
        .replace("/", "-")
        .replace("_", "-")
    )
    email = f"{slug}@example.com"
    password = "password123"
    register = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": slug, "password": password},
    )
    assert register.status_code == 200
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _company_payload(name: str) -> dict[str, Any]:
    return {
        "name": name.title(),
        "mode": "no_history",
        "industry": "Manufacturing consulting",
        "description": "Helps manufacturers reduce downtime before customer history exists.",
        "problem_solved": "Downtime reduction",
        "target_user_guess": "Plant operations leaders",
        "hypothetical_ticket": 12000,
    }
