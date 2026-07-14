from sqlalchemy.orm import Session

from app.models.feedback import Feedback


def summarize_feedback(db: Session, run_id: int) -> dict[str, object]:
    rows = db.query(Feedback).filter(Feedback.run_id == run_id).all()
    if not rows:
        return {"count": 0, "average_rating": None, "average_confidence": None}

    return {
        "count": len(rows),
        "average_rating": round(sum(row.rating for row in rows) / len(rows), 2),
        "average_confidence": round(sum(row.confidence for row in rows) / len(rows), 2),
    }

