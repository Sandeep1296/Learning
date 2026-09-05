from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models.mongo_models import PyObjectId


class MistakeLog(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    question_text: str
    topic: str
    subtopic: Optional[str] = None
    user_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    review_count: int = 0
    interval_days: int = 1
    ease_factor: float = 2.5              # SM-2 ease factor
    review_due_date: Optional[str] = None # ISO date string "YYYY-MM-DD"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class GapReport(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    missing_topics: List[str] = []
    generated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
