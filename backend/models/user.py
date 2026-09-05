from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models.mongo_models import PyObjectId


class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    role: str = "student"
    exam_target: str = "UPSC CSE 2026"
    optional_subject: Optional[str] = None
    exam_date: Optional[str] = None       # ISO date string "YYYY-MM-DD"
    daily_hours: int = 4
    learning_style: str = "balanced"
    weak_topics: List[str] = []
    strong_topics: List[str] = []
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class UserSourcePreference(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    source_name: str
    is_active: bool = True

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
