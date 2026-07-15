# API Routes

Base path: `/api/v1`

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/auth/register` | Create a user |
| `POST` | `/auth/login` | Issue an access token and return the authenticated user |
| `GET` | `/auth/me` | Return the current user |
| `POST` | `/companies` | Create a company profile |
| `GET` | `/companies` | List company profiles |
| `GET` | `/companies/{company_id}` | Retrieve a company profile |
| `PUT` | `/companies/{company_id}` | Update a company profile |
| `DELETE` | `/companies/{company_id}` | Delete a company profile |
| `GET` | `/companies/{company_id}/analyses` | List analysis runs for a company |
| `POST` | `/analyses` | Run an ICP analysis |
| `GET` | `/analyses` | List analysis runs |
| `GET` | `/analyses/{run_id}` | Retrieve one analysis |
| `POST` | `/analyses/{run_id}/refine` | Refine and rerun an analysis |
| `POST` | `/analyses/{run_id}/action-plan` | Return or materialize an action plan for a run |
| `GET` | `/analyses/{run_id}/feedback` | List feedback for a run |
| `POST` | `/feedback` | Submit human feedback |
| `GET` | `/feedback/{run_id}` | List feedback for a run, legacy alias |
| `GET` | `/evaluation/profiles` | Return demo evaluation profiles |
| `POST` | `/evaluation/run` | Compare baseline and agent outputs, legacy body-based route |
| `POST` | `/evaluation/run/{profile_id}` | Run an evaluation profile |
| `POST` | `/evaluation/results/{result_id}/rate` | Store a human evaluation rating |
| `GET` | `/evaluation/summary` | Summarize evaluation results |
