from typing import Any

from fastapi.testclient import TestClient

from app.main import app


def test_all_swagger_routes_support_frontend_contract() -> None:
    exercised_routes: set[tuple[str, str]] = set()

    with TestClient(app) as client:
        _request(client, exercised_routes, "get", "/api/v1/health", expected_status=200)

        email = "swagger-routes@example.com"
        password = "password123"
        _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/auth/register",
            json={"email": email, "username": "swagger-routes", "password": password},
            expected_status=200,
        )
        login = _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/auth/login",
            json={"email": email, "password": password},
            expected_status=200,
        ).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}
        _request(client, exercised_routes, "get", "/api/v1/auth/me", headers=headers, expected_status=200)

        company = _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/companies",
            headers=headers,
            json=_company_payload("Swagger Coverage Co"),
            expected_status=200,
        ).json()
        company_id = company["id"]
        _request(client, exercised_routes, "get", "/api/v1/companies", headers=headers, expected_status=200)
        _request(
            client,
            exercised_routes,
            "get",
            f"/api/v1/companies/{company_id}",
            route_template="/api/v1/companies/{company_id}",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "put",
            f"/api/v1/companies/{company_id}",
            route_template="/api/v1/companies/{company_id}",
            headers=headers,
            json={"description": "Helps manufacturers prioritize uptime improvements with focused reviews."},
            expected_status=200,
        )

        run = _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/analyses",
            headers=headers,
            json={
                "company_id": company_id,
                "mode": "history",
                "input": _company_payload("Swagger Coverage Co"),
            },
            expected_status=200,
        ).json()
        run_id = run["run_id"]
        _request(client, exercised_routes, "get", "/api/v1/analyses", headers=headers, expected_status=200)
        _request(
            client,
            exercised_routes,
            "get",
            f"/api/v1/analyses/{run_id}",
            route_template="/api/v1/analyses/{run_id}",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "get",
            f"/api/v1/companies/{company_id}/analyses",
            route_template="/api/v1/companies/{company_id}/analyses",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "post",
            f"/api/v1/analyses/{run_id}/approve",
            route_template="/api/v1/analyses/{run_id}/approve",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "post",
            f"/api/v1/analyses/{run_id}/action-plan",
            route_template="/api/v1/analyses/{run_id}/action-plan",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "post",
            f"/api/v1/analyses/{run_id}/refine",
            route_template="/api/v1/analyses/{run_id}/refine",
            headers=headers,
            json={"notes": "Focus the recommendation on logistics operators."},
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/feedback",
            headers=headers,
            json={"icp_run_id": run_id, "outcome": "lost", "reason": "Budget was too low."},
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "get",
            f"/api/v1/analyses/{run_id}/feedback",
            route_template="/api/v1/analyses/{run_id}/feedback",
            headers=headers,
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "get",
            f"/api/v1/feedback/{run_id}",
            route_template="/api/v1/feedback/{run_id}",
            headers=headers,
            expected_status=200,
        )

        _request(client, exercised_routes, "get", "/api/v1/evaluation/profiles", expected_status=200)
        evaluation = _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/evaluation/run",
            json={"profile_key": "northstar-enablement"},
            expected_status=200,
        ).json()
        _request(
            client,
            exercised_routes,
            "post",
            "/api/v1/evaluation/run/northstar-enablement",
            route_template="/api/v1/evaluation/run/{profile_id}",
            expected_status=200,
        )
        _request(
            client,
            exercised_routes,
            "post",
            f"/api/v1/evaluation/results/{evaluation['id']}/rate",
            route_template="/api/v1/evaluation/results/{result_id}/rate",
            json={"human_preference": "agent", "notes": "Agent is more actionable."},
            expected_status=200,
        )
        _request(client, exercised_routes, "get", "/api/v1/evaluation/summary", expected_status=200)

        _request(
            client,
            exercised_routes,
            "delete",
            f"/api/v1/companies/{company_id}",
            route_template="/api/v1/companies/{company_id}",
            headers=headers,
            expected_status=204,
        )

    assert exercised_routes == _openapi_routes()


def test_user_cannot_access_or_mutate_another_users_companies_and_analyses() -> None:
    with TestClient(app) as client:
        headers_a = _register_and_login(client, "owner-a@example.com", "owner-a")
        headers_b = _register_and_login(client, "owner-b@example.com", "owner-b")

        company_a = _create_company(client, headers_a, "Owner A Company")
        run_a = _create_analysis(client, headers_a, company_a["id"])
        company_b = _create_company(client, headers_b, "Owner B Company")
        run_b = _create_analysis(client, headers_b, company_b["id"])

        companies_for_a = client.get("/api/v1/companies", headers=headers_a)
        assert companies_for_a.status_code == 200
        company_ids_for_a = {company["id"] for company in companies_for_a.json()}
        assert company_a["id"] in company_ids_for_a
        assert company_b["id"] not in company_ids_for_a

        get_b_company_as_a = client.get(f"/api/v1/companies/{company_b['id']}", headers=headers_a)
        assert get_b_company_as_a.status_code == 404

        analyses_for_a = client.get("/api/v1/analyses", headers=headers_a)
        assert analyses_for_a.status_code == 200
        run_ids_for_a = {run["run_id"] for run in analyses_for_a.json()}
        assert run_a["run_id"] in run_ids_for_a
        assert run_b["run_id"] not in run_ids_for_a

        get_b_run_as_a = client.get(f"/api/v1/analyses/{run_b['run_id']}", headers=headers_a)
        assert get_b_run_as_a.status_code == 404

        b_company_runs_as_a = client.get(
            f"/api/v1/companies/{company_b['id']}/analyses",
            headers=headers_a,
        )
        assert b_company_runs_as_a.status_code == 404

        refine_b_run_as_a = client.post(
            f"/api/v1/analyses/{run_b['run_id']}/refine",
            headers=headers_a,
            json={"notes": "Try to refine someone else's result."},
        )
        assert refine_b_run_as_a.status_code == 404

        feedback_b_run_as_a = client.post(
            "/api/v1/feedback",
            headers=headers_a,
            json={
                "icp_run_id": run_b["run_id"],
                "outcome": "won",
                "reason": "Attempted cross-account feedback.",
            },
        )
        assert feedback_b_run_as_a.status_code == 404

        list_b_feedback_as_a = client.get(
            f"/api/v1/analyses/{run_b['run_id']}/feedback",
            headers=headers_a,
        )
        assert list_b_feedback_as_a.status_code == 404


def _request(
    client: TestClient,
    exercised_routes: set[tuple[str, str]],
    method: str,
    path: str,
    *,
    route_template: str | None = None,
    expected_status: int,
    headers: dict[str, str] | None = None,
    json: dict[str, Any] | None = None,
):
    response = client.request(method.upper(), path, headers=headers, json=json)
    assert response.status_code == expected_status, response.text
    exercised_routes.add((route_template or path, method))
    return response


def _openapi_routes() -> set[tuple[str, str]]:
    return {
        (path, method)
        for path, methods in app.openapi()["paths"].items()
        for method in methods
    }


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


def _create_company(client: TestClient, headers: dict[str, str], name: str) -> dict[str, Any]:
    response = client.post("/api/v1/companies", headers=headers, json=_company_payload(name))
    assert response.status_code == 200
    return response.json()


def _create_analysis(
    client: TestClient,
    headers: dict[str, str],
    company_id: int,
) -> dict[str, Any]:
    response = client.post(
        "/api/v1/analyses",
        headers=headers,
        json={"company_id": company_id, "input": _company_payload("Analysis Input Co")},
    )
    assert response.status_code == 200
    return response.json()


def _company_payload(name: str) -> dict[str, Any]:
    return {
        "name": name,
        "mode": "history",
        "industry": "Manufacturing consulting",
        "description": "Helps manufacturers reduce downtime across distributed production teams.",
        "average_ticket": 25000,
        "margin": "60%",
        "conversion_rate": "18%",
        "average_sales_cycle": "45 days",
        "past_clients": "mid-market manufacturers and logistics operators",
        "past_lost_deals": "enterprise aerospace firms",
        "loss_reasons": "too expensive and long procurement cycles",
        "current_markets": "manufacturing and logistics",
    }
