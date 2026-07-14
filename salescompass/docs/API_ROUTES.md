# API Routes

Base path: `/api/v1`

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/auth/register` | Create a user |
| `POST` | `/auth/login` | Issue an access token |
| `GET` | `/auth/me` | Return the current user |
| `POST` | `/companies` | Create a company profile |
| `GET` | `/companies` | List company profiles |
| `GET` | `/companies/{company_id}` | Retrieve a company profile |
| `POST` | `/analyses` | Run an ICP analysis |
| `GET` | `/analyses` | List analysis runs |
| `GET` | `/analyses/{run_id}` | Retrieve one analysis |
| `POST` | `/feedback` | Submit human feedback |
| `GET` | `/feedback/{run_id}` | List feedback for a run |
| `GET` | `/evaluation/profiles` | Return demo evaluation profiles |
| `POST` | `/evaluation/run` | Compare baseline and agent outputs |

