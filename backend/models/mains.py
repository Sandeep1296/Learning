from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models.mongo_models import PyObjectId


class MainsSubmission(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: str
    promptId: Optional[PyObjectId] = None
    question: Optional[str] = None
    content: str                          # user's answer text
    marks: Optional[int] = 15
    wordCount: Optional[int] = None
    submittedAt: Optional[datetime] = None
    # AI evaluation fields
    ai_score: Optional[float] = None
    ai_max_marks: Optional[int] = None
    ai_percentage: Optional[float] = None
    ai_breakdown: Optional[Dict[str, Any]] = None
    ai_strengths: Optional[List[str]] = None
    ai_improvements: Optional[List[str]] = None
    ai_model_points: Optional[List[str]] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
