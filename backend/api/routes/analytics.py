from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta, datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from backend.db.database import get_db
from backend.agents.analytics_agent import calculate_sm2

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class ReviewRequest(BaseModel):
    mistake_id: str
    quality: int  # 0 to 5 (SM-2 rating)


@router.get("/summary")
async def get_summary(user_id: str = "default_user", db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Returns weak topic heatmap and due-today spaced repetition queue from MongoDB.
    """
    today = date.today().isoformat()

    all_mistakes = await db["mistake_logs"].find(
        {"user_id": user_id}
    ).to_list(length=1000)

    due_today = [m for m in all_mistakes if m.get("review_due_date", "9999-99-99") <= today]

    topic_counts = {}
    for m in all_mistakes:
        t = m.get("topic", "Unknown")
        topic_counts[t] = topic_counts.get(t, 0) + 1

    heatmap = [{"topic": t, "mistake_count": c} for t, c in topic_counts.items()]

    return {
        "due_revisions_count": len(due_today),
        "total_mistakes_logged": len(all_mistakes),
        "weak_topic_heatmap": heatmap,
        "due_today": [
            {
                "id": str(m["_id"]),
                "question": m.get("question_text", ""),
                "topic": m.get("topic", ""),
                "due_date": m.get("review_due_date", ""),
            }
            for m in due_today[:10]
        ],
    }


@router.post("/review")
async def process_review(req: ReviewRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Update a mistake_log entry using the SM-2 spaced repetition algorithm.
    """
    if not ObjectId.is_valid(req.mistake_id):
        raise HTTPException(status_code=400, detail="Invalid mistake_id format")

    mistake = await db["mistake_logs"].find_one({"_id": ObjectId(req.mistake_id)})
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake log entry not found")

    prev_rep = mistake.get("review_count", 0)
    prev_interval = mistake.get("interval_days", 1)
    prev_ease = float(mistake.get("ease_factor", 2.5))

    new_rep, new_interval, new_ease = calculate_sm2(req.quality, prev_rep, prev_interval, prev_ease)
    next_due = (date.today() + timedelta(days=new_interval)).isoformat()

    await db["mistake_logs"].update_one(
        {"_id": ObjectId(req.mistake_id)},
        {"$set": {
            "review_count": new_rep,
            "interval_days": new_interval,
            "ease_factor": round(new_ease, 2),
            "review_due_date": next_due,
            "last_reviewed_at": datetime.utcnow(),
        }}
    )

    return {
        "id": req.mistake_id,
        "review_count": new_rep,
        "next_due_date": next_due,
        "ease_factor": round(new_ease, 2),
    }


@router.get("/quiz-history")
async def get_quiz_history(user_id: str = "default_user", db: AsyncIOMotorDatabase = Depends(get_db)):
    """Return aggregated quiz score history for progress tracking."""
    sessions = await db["quiz_sessions"].find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(30).to_list(length=30)

    for s in sessions:
        s["_id"] = str(s["_id"])
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()

    return {"quiz_sessions": sessions}
