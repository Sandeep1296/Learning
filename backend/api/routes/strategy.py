from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.db.database import get_db
from backend.agents.strategy_agent import generate_personalized_strategy

router = APIRouter(prefix="/strategy", tags=["Strategy"])


@router.get("/plan")
async def get_strategy_plan(user_id: str = "default_user", db: AsyncIOMotorDatabase = Depends(get_db)):
    return await generate_personalized_strategy(db, user_id=user_id)
