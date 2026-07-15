from fastapi.testclient import TestClient

from app.main import app


def test_v1_api_routes_match_product_contract() -> None:
    client = TestClient(app)

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
