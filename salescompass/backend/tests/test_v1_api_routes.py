from fastapi.testclient import TestClient

from app.api.v1 import analyses as analyses_api
from app.db.session import SessionLocal
from app.main import app
from app.models.icp_run import ICPRun
from app.services.analysis_pipeline import AgentOutputValidationError


def test_v1_api_routes_match_product_contract() -> None:
    with TestClient(app) as client:
        _assert_v1_api_routes_match_product_contract(client)


def _assert_v1_api_routes_match_product_contract(client: TestClient) -> None:

    email = "v1-contract@example.com"
    password = "password123"
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": "rishi", "password": password},
    )
    assert register_response.status_code == 200

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["token_type"] == "bearer"
    assert login_payload["user"]["email"] == email
    headers = {"Authorization": f"Bearer {login_payload['access_token']}"}

    company_response = client.post(
        "/api/v1/companies",
        headers=headers,
        json={
            "name": "Acme Ops Consulting",
            "mode": "history",
            "industry": "Manufacturing consulting",
            "description": "Helps manufacturers reduce downtime across plants and lines.",
            "average_ticket": "$25,000",
            "margin": "60%",
            "conversion_rate": "18%",
            "average_sales_cycle": "45 days",
            "past_clients": "mid-market manufacturers, logistics operators",
            "past_lost_deals": "enterprise aerospace firm",
            "loss_reasons": "too expensive, long procurement cycle",
            "current_markets": "manufacturing, logistics",
        },
    )
    assert company_response.status_code == 200
    company = company_response.json()
    company_id = company["id"]
    assert company["average_ticket"] == 25000

    update_response = client.put(
        f"/api/v1/companies/{company_id}",
        headers=headers,
        json={"description": "Helps manufacturers reduce downtime with focused operating reviews."},
    )
    assert update_response.status_code == 200

    analysis_response = client.post(
        "/api/v1/analyses",
        headers=headers,
        json={
            "company_id": company_id,
            "mode": "history",
            "input": {
                "name": "Acme Ops Consulting",
                "industry": "Manufacturing consulting",
                "description": "Helps manufacturers reduce downtime across plants and lines.",
                "average_ticket": "$25,000",
                "margin": "60%",
                "conversion_rate": "18%",
                "average_sales_cycle": "45 days",
                "past_clients": "mid-market manufacturers, logistics operators",
                "past_lost_deals": "enterprise aerospace firm",
                "loss_reasons": "too expensive, long procurement cycle",
                "current_markets": "manufacturing, logistics",
            },
        },
    )
    assert analysis_response.status_code == 200
    run = analysis_response.json()
    assert {"run_id", "status", "agent_output", "baseline_output"}.issubset(run)
    run_id = run["run_id"]
    assert run["status"] == "completed"
    assert run["agent_output"]
    assert run["baseline_output"]

    company_runs_response = client.get(f"/api/v1/companies/{company_id}/analyses", headers=headers)
    assert company_runs_response.status_code == 200
    assert company_runs_response.json()[0]["run_id"] == run_id

    refine_response = client.post(
        f"/api/v1/analyses/{run_id}/refine",
        headers=headers,
        json={"notes": "Focus the recommendation on logistics operators first."},
    )
    assert refine_response.status_code == 200
    assert refine_response.json()["refinement_notes"]
    assert refine_response.json()["review_status"] == "needs_review"

    approve_response = client.post(f"/api/v1/analyses/{run_id}/approve", headers=headers)
    assert approve_response.status_code == 200
    assert approve_response.json()["review_status"] == "approved"

    action_plan_response = client.post(f"/api/v1/analyses/{run_id}/action-plan", headers=headers)
    assert action_plan_response.status_code == 200
    assert action_plan_response.json()["run_id"] == run_id
    assert action_plan_response.json()["action_plan"]

    feedback_response = client.post(
        "/api/v1/feedback",
        headers=headers,
        json={
            "icp_run_id": run_id,
            "outcome": "lost",
            "reason": "Budget was too low and buyer was not senior enough",
        },
    )
    assert feedback_response.status_code == 200
    assert feedback_response.json()["outcome"] == "lost"

    feedback_list_response = client.get(f"/api/v1/analyses/{run_id}/feedback", headers=headers)
    assert feedback_list_response.status_code == 200
    assert feedback_list_response.json()[0]["icp_run_id"] == run_id

    evaluation_response = client.post("/api/v1/evaluation/run/northstar-enablement")
    assert evaluation_response.status_code == 200
    evaluation_id = evaluation_response.json()["id"]

    rating_response = client.post(
        f"/api/v1/evaluation/results/{evaluation_id}/rate",
        json={"human_preference": "agent", "notes": "Agent is more actionable."},
    )
    assert rating_response.status_code == 200
    assert rating_response.json()["human_preference"] == "agent"

    summary_response = client.get("/api/v1/evaluation/summary")
    assert summary_response.status_code == 200
    assert summary_response.json()["total_results"] >= 1

    delete_response = client.delete(f"/api/v1/companies/{company_id}", headers=headers)
    assert delete_response.status_code == 204


def test_create_analysis_returns_controlled_error_for_invalid_agent_output(monkeypatch) -> None:
    def broken_analysis(company_input, mode):
        raise AgentOutputValidationError("markets must contain at most three items")

    monkeypatch.setattr(analyses_api, "run_full_analysis", broken_analysis)
    with TestClient(app) as client:
        email = "invalid-agent-output@example.com"
        password = "password123"
        register_response = client.post(
            "/api/v1/auth/register",
            json={"email": email, "username": "invalid-agent-output", "password": password},
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

        response = client.post(
            "/api/v1/analyses",
            headers=headers,
            json={
                "company": {
                    "name": "Malformed JSON Co",
                    "mode": "history",
                    "industry": "Manufacturing consulting",
                    "description": "Helps manufacturers reduce downtime.",
                    "average_ticket": 25000,
                    "past_clients": "mid-market manufacturers",
                }
            },
        )

        assert response.status_code == 502
        assert response.json()["detail"] == "Analysis output failed validation"

        with SessionLocal() as db:
            run = db.query(ICPRun).order_by(ICPRun.id.desc()).first()
            run_id = run.id
            assert run.status == "failed"
            assert run.agent_output == {}
            assert "markets must contain" in run.error_message

        failed_run_response = client.get(f"/api/v1/analyses/{run_id}", headers=headers)
        assert failed_run_response.status_code == 200
        failed_run = failed_run_response.json()
        assert failed_run["status"] == "failed"
        assert failed_run["agent_output"] == {}
        assert failed_run["result"] == {}
        assert "markets must contain" in failed_run["error_message"]


def test_refine_analysis_failure_keeps_existing_result(monkeypatch) -> None:
    def broken_refinement(company_input, previous_output, adjustment):
        raise AgentOutputValidationError("refinement output was not usable")

    monkeypatch.setattr(analyses_api, "refine_ai_analysis", broken_refinement)
    with TestClient(app) as client:
        email = "broken-refinement@example.com"
        password = "password123"
        register_response = client.post(
            "/api/v1/auth/register",
            json={"email": email, "username": "broken-refinement", "password": password},
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

        create_response = client.post(
            "/api/v1/analyses",
            headers=headers,
            json={
                "company": {
                    "name": "Stable Result Co",
                    "mode": "history",
                    "industry": "Manufacturing consulting",
                    "description": "Helps manufacturers reduce downtime.",
                    "average_ticket": 25000,
                    "past_clients": "mid-market manufacturers",
                }
            },
        )
        assert create_response.status_code == 200
        created_run = create_response.json()
        run_id = created_run["run_id"]

        refine_response = client.post(
            f"/api/v1/analyses/{run_id}/refine",
            headers=headers,
            json={"notes": "Focus on healthcare instead."},
        )

    assert refine_response.status_code == 502
    with SessionLocal() as db:
        run = db.query(ICPRun).filter(ICPRun.id == run_id).first()
        assert run.status == "completed"
        assert run.agent_output == created_run["agent_output"]
        assert run.review_status == "needs_review"
        assert "refinement output" in run.error_message


def test_action_plan_failure_keeps_existing_result(monkeypatch) -> None:
    def broken_action_plan(company_input, agent_output):
        raise RuntimeError("planner timed out")

    monkeypatch.setattr(analyses_api, "generate_ai_action_plan", broken_action_plan)
    with TestClient(app) as client:
        email = "broken-action-plan@example.com"
        password = "password123"
        register_response = client.post(
            "/api/v1/auth/register",
            json={"email": email, "username": "broken-action-plan", "password": password},
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

        create_response = client.post(
            "/api/v1/analyses",
            headers=headers,
            json={
                "company": {
                    "name": "Action Plan Safe Co",
                    "mode": "history",
                    "industry": "Manufacturing consulting",
                    "description": "Helps manufacturers reduce downtime.",
                    "average_ticket": 25000,
                    "past_clients": "mid-market manufacturers",
                }
            },
        )
        assert create_response.status_code == 200
        created_run = create_response.json()
        run_id = created_run["run_id"]

        action_plan_response = client.post(
            f"/api/v1/analyses/{run_id}/action-plan",
            headers=headers,
        )

    assert action_plan_response.status_code == 500
    assert action_plan_response.json()["detail"] == (
        "Action plan failed. Your approved recommendation is unchanged."
    )
    with SessionLocal() as db:
        run = db.query(ICPRun).filter(ICPRun.id == run_id).first()
        assert run.status == "completed"
        assert run.agent_output == created_run["agent_output"]
        assert run.action_plan == created_run["action_plan"]
        assert "planner timed out" in run.error_message
