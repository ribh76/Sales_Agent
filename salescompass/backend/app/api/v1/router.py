from fastapi import APIRouter

from app.api.v1 import analyses, auth, companies, evaluation, feedback, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["analyses"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])

