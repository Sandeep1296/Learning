from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.db.database import get_db
from backend.agents.evaluator_agent import evaluate_mains_answer

router = APIRouter(prefix="/mains", tags=["Mains"])


class MainsEvalRequest(BaseModel):
    question: str
    user_answer: str
    marks: Optional[int] = 15
    user_id: Optional[str] = "default_user"
    prompt_id: Optional[str] = None  # MongoDB AnswerPrompt _id (from frontend)


@router.post("/evaluate")
async def evaluate(req: MainsEvalRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Evaluate a UPSC Mains answer using AI (LM Studio → Ollama → Gemini fallback).
    Persists the evaluation result to the 'answersubmissions' collection,
    matching the frontend AnswerSubmission Mongoose schema.
    """
    result = evaluate_mains_answer(
        question=req.question,
        user_answer=req.user_answer,
        marks=req.marks,
        user_id=req.user_id,
    )

    now = datetime.utcnow()

    # Build submission document matching frontend AnswerSubmissionSchema
    submission_doc = {
        "userId": req.user_id,
        "content": req.user_answer,
        "wordCount": len(req.user_answer.split()),
        "submittedAt": now,
        # AI evaluation fields
        "ai_score": result.get("score"),
        "ai_max_marks": result.get("max_marks", req.marks),
        "ai_percentage": result.get("percentage"),
        "ai_breakdown": result.get("breakdown", {}),
        "ai_strengths": result.get("strengths", []),
        "ai_improvements": result.get("improvements", []),
        "ai_model_points": result.get("model_points", []),
    }

    # Link to AnswerPrompt if prompt_id provided
    if req.prompt_id and ObjectId.is_valid(req.prompt_id):
        submission_doc["promptId"] = ObjectId(req.prompt_id)
    else:
        # Store raw question text for backend-originated evaluations
        submission_doc["question"] = req.question
        submission_doc["marks"] = req.marks

    insert_result = await db["answersubmissions"].insert_one(submission_doc)

    return {
        **result,
        "submission_id": str(insert_result.inserted_id),
    }


@router.get("/submissions")
async def get_submissions(user_id: str = "default_user", db: AsyncIOMotorDatabase = Depends(get_db)):
    """Return recent answer submissions with AI scores for a user."""
    docs = await db["answersubmissions"].find(
        {"userId": user_id},
        {"_id": 1, "question": 1, "ai_score": 1, "ai_max_marks": 1, "ai_percentage": 1, "submittedAt": 1}
    ).sort("submittedAt", -1).limit(20).to_list(length=20)

    for d in docs:
        d["_id"] = str(d["_id"])

    return {"submissions": docs}
