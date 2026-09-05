from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models.mongo_models import PyObjectId


class Question(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    topic: str
    subtopic: Optional[str] = None
    gs_paper: str = "GS1"
    difficulty: str = "medium"
    question_text: str
    options: List[str]                    # ["A text", "B text", "C text", "D text"]
    correct_answer: int                   # 0-3 index
    explanation: Optional[str] = None
    source_ref: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class QuizSession(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    topic: str
    score: float = 0.0
    total_questions: int = 0
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class QuizAttempt(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    session_id: str
    question_id: str
    user_answer: Optional[int] = None
    is_correct: bool = False
    time_spent: int = 0

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
