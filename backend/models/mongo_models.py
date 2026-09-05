"""
Pydantic v2 MongoDB models for the FastAPI backend.
These mirror the Mongoose schemas in src/models/ exactly so that
the Python backend reads and writes to the same MongoDB collections
as the Next.js frontend.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema


# ---------------------------------------------------------------------------
# ObjectId helper — allows _id to be serialized as a string
# ---------------------------------------------------------------------------
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError(f"Invalid ObjectId: {v}")


# ---------------------------------------------------------------------------
# Users  (mirrors src/models/User.ts)
# ---------------------------------------------------------------------------
class UserDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    role: str = "student"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Quiz  (mirrors src/models/Quiz.ts)
# ---------------------------------------------------------------------------
class QuestionEmbed(BaseModel):
    question: str
    options: List[str]
    correctIndex: int
    explanation: Optional[str] = ""
    tags: List[str] = []


class QuizDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    date: str                         # "YYYY-MM-DD" — unique
    questions: List[QuestionEmbed] = []
    isPublished: bool = False
    createdAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class QuizAttemptDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: PyObjectId
    quizId: PyObjectId
    answers: List[int] = []           # selected option index per question
    score: Optional[float] = None
    timeTaken: Optional[int] = None   # seconds
    completedAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Answer Writing  (mirrors src/models/AnswerWriting.ts)
# ---------------------------------------------------------------------------
class AnswerPromptDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    question: str
    date: str                         # "YYYY-MM-DD" — unique
    paper: str = "GS1"
    tags: List[str] = []
    wordLimit: int = 250
    idealPoints: List[str] = []
    isPublished: bool = False
    createdAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class AnswerSubmissionDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: PyObjectId
    promptId: PyObjectId
    content: str
    wordCount: Optional[int] = None
    selfScore: Optional[int] = None
    selfNote: Optional[str] = None
    timeTaken: Optional[int] = None
    submittedAt: Optional[datetime] = None

    # AI evaluation results — stored alongside the submission
    ai_score: Optional[float] = None
    ai_max_marks: Optional[int] = None
    ai_percentage: Optional[float] = None
    ai_breakdown: Optional[dict] = None
    ai_strengths: Optional[List[str]] = None
    ai_improvements: Optional[List[str]] = None
    ai_model_points: Optional[List[str]] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Study Resources  (mirrors src/models/Study.ts)
# ---------------------------------------------------------------------------
class FlashcardDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    front: str
    back: str
    tags: List[str] = []
    createdAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class StudyNoteDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    content: str
    tags: List[str] = []
    paper: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class PYQDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    question: str
    year: int
    paper: str
    type: str = "prelims"
    options: List[str] = []
    correctIndex: Optional[int] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    tags: List[str] = []
    createdAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Articles  (mirrors src/models/Article.ts)
# ---------------------------------------------------------------------------
class ArticleDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    content: str
    source: Optional[str] = None
    sourceUrl: Optional[str] = None
    type: str = "news"
    tags: List[str] = []
    summary: Optional[str] = None
    publishedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Backend-only collections (spaced repetition, quiz session history)
# ---------------------------------------------------------------------------
class MistakeLogDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    question_text: str
    topic: str
    user_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    review_count: int = 0
    interval_days: int = 1
    ease_factor: float = 2.5
    review_due_date: Optional[str] = None   # ISO date string "YYYY-MM-DD"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class QuizSessionDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    topic: str
    score: float
    total_questions: int
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
