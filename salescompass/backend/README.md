# SalesCompass Backend

FastAPI service for authentication, company profiles, ICP analysis runs, feedback, and evaluation.

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Key Environment Variables

- `DATABASE_URL`: SQLAlchemy database URL. Local Postgres example: `postgresql+psycopg://Sales_Compass_admin:ADMIN@localhost:5432/SalesCompass`.
- `REDIS_URL`: Redis URL used for cached ICP analysis outputs.
- `CACHE_TTL_SECONDS`: Redis cache TTL for analysis outputs. Defaults to 86400.
- `SECRET_KEY`: JWT signing secret.
- `ANTHROPIC_API_KEY`: Optional. If absent, the deterministic analysis pipeline is used.
- `CORS_ORIGINS`: Comma-separated origins for the frontend.
