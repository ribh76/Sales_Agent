# SalesCompass

SalesCompass is an ICP AI agent for early B2B teams. It turns company context, customer history, and market signals into a clear ideal customer profile, segment scores, positioning guidance, and outbound message angles.

The project is split into:

- `backend/`: FastAPI API, persistence models, analysis pipeline, evaluation harness, and demo data.
- `frontend/`: Next.js app for onboarding, ICP analysis, results review, feedback, and evaluation demos.
- `docs/`: Product scope, data model, API routes, and demo/evaluation notes.
- `reference/`: Small standalone examples that document the original demo direction.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Backend: `http://localhost:8000`

Frontend: `http://localhost:3000`

Docker Compose also starts Postgres on `localhost:5433` with database `SalesCompass` and Redis on `localhost:6379`.

## Local Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Path

1. Register or sign in.
2. Open Analyze.
3. Choose whether the company has historical customer data.
4. Submit the form and review the generated ICP report.
5. Use Evaluation to compare the agent output against the baseline.
