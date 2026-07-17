from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.seed.seed_eval_profiles import seed_evaluation_profiles
from app import models  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_evaluation_profiles(db)
