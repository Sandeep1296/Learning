from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.db.database import get_db
from backend.agents.quiz_agent import generate_quiz_questions

router = APIRouter(prefix="/quiz", tags=["Quiz"])


class QuizGenRequest(BaseModel):
    topic: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"
    paper: Optional[str] = "GS1"
    user_id: Optional[str] = "default_user"
    active_sources: Optional[List[str]] = None


class QuizSubmitRequest(BaseModel):
    user_id: Optional[str] = "default_user"
    topic: str
    answers: List[dict]  # [{"question_text": "...", "user_answer": 0, "correct_answer": 0, "topic": "..."}]


@router.post("/generate")
def generate_quiz(req: QuizGenRequest):
    """Generate UPSC Prelims MCQs on a topic using RAG + AI."""
    questions = generate_quiz_questions(
        topic=req.topic,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
        paper=req.paper,
        user_id=req.user_id,
        active_sources=req.active_sources,
    )
    return {"questions": questions}


@router.post("/submit")
async def submit_quiz(req: QuizSubmitRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Score a quiz attempt, log mistakes to MongoDB for spaced repetition,
    and persist a quiz session record.
    """
    correct_count = 0
    total = len(req.answers)
    now = datetime.utcnow()
    today_str = date.today().isoformat()

    for item in req.answers:
        user_ans = item.get("user_answer")
        corr_ans = item.get("correct_answer")
        is_correct = (user_ans == corr_ans)

        if is_correct:
            correct_count += 1
        else:
            # Log mistake for SM-2 spaced repetition
            await db["mistake_logs"].insert_one({
                "user_id": req.user_id,
                "question_text": item.get("question_text", "UPSC Question"),
                "topic": item.get("topic", req.topic),
                "user_answer": str(user_ans),
                "correct_answer": str(corr_ans),
                "review_count": 0,
                "interval_days": 1,
                "ease_factor": 2.5,
                "review_due_date": today_str,
                "created_at": now,
            })

    score = round((correct_count / max(1, total)) * 100, 1)

    # Persist session record
    result = await db["quiz_sessions"].insert_one({
        "user_id": req.user_id,
        "topic": req.topic,
        "score": score,
        "total_questions": total,
        "created_at": now,
    })

    return {
        "session_id": str(result.inserted_id),
        "score": score,
        "correct_count": correct_count,
        "total_questions": total,
        "message": f"Quiz submitted. {total - correct_count} mistakes added to review queue.",
    }


@router.get("/sessions")
async def get_quiz_sessions(user_id: str = "default_user", db: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch recent quiz session history for a user."""
    sessions = await db["quiz_sessions"].find(
        {"user_id": user_id},
        {"_id": 1, "topic": 1, "score": 1, "total_questions": 1, "created_at": 1}
    ).sort("created_at", -1).limit(20).to_list(length=20)

    for s in sessions:
        s["_id"] = str(s["_id"])

    return {"sessions": sessions}
