from datetime import date
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


async def generate_personalized_strategy(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
    """
    Generates personalized UPSC study strategy by reading user profile from MongoDB.
    """
    # Look up user in shared 'users' collection (same as Next.js frontend)
    user = await db["users"].find_one({"_id": user_id}) or \
           await db["users"].find_one({"email": user_id})

    exam_target = "UPSC CSE 2026"
    target_date = date(2026, 5, 24)
    daily_hours = 4
    weak_topics = ["Economy - Monetary Policy", "Environment - Biodiversity"]

    if user:
        exam_target = user.get("exam_target", exam_target)
        if user.get("exam_date"):
            try:
                target_date = date.fromisoformat(str(user["exam_date"])[:10])
            except ValueError:
                pass
        daily_hours = user.get("daily_hours", daily_hours)
        weak_topics = user.get("weak_topics", weak_topics)

    # Pull weak topics from recent mistake logs if user profile doesn't set them
    if not user or not user.get("weak_topics"):
        cursor = db["mistake_logs"].find({"user_id": user_id}, {"topic": 1}).limit(50)
        mistake_docs = await cursor.to_list(length=50)
        topic_counts: Dict[str, int] = {}
        for m in mistake_docs:
            t = m.get("topic", "Unknown")
            topic_counts[t] = topic_counts.get(t, 0) + 1
        if topic_counts:
            weak_topics = sorted(topic_counts, key=lambda k: -topic_counts[k])[:5]

    days_remaining = max(1, (target_date - date.today()).days)
    total_hours = days_remaining * daily_hours

    daily_targets = [
        {"time": "08:00 - 10:00", "activity": f"Core Subject Revision ({weak_topics[0]})", "focus": "Weak Area Blitz"},
        {"time": "10:30 - 12:00", "activity": "Current Affairs & Editorial Reading", "focus": "The Hindu / PIB"},
        {"time": "14:00 - 16:00", "activity": "Mains Answer Writing & AI Evaluation", "focus": "2 GS Questions"},
        {"time": "17:00 - 18:30", "activity": "Spaced Repetition Quiz & Flashcard Review", "focus": "Error log"},
    ]

    weekly_milestones = [
        {"week": 1, "target": f"Master foundation concepts in {weak_topics[0]}", "status": "In Progress"},
        {"week": 2, "target": "Solve 100 PYQs on Environment & Geography", "status": "Pending"},
        {"week": 3, "target": "Complete 10 Mains GS2 answer submissions", "status": "Pending"},
        {"week": 4, "target": "Full Prelims Mock Test & AI mistake breakdown", "status": "Pending"},
    ]

    return {
        "exam_target": exam_target,
        "days_remaining": days_remaining,
        "daily_study_hours": daily_hours,
        "total_estimated_study_hours": total_hours,
        "weak_topics": weak_topics,
        "daily_routine": daily_targets,
        "weekly_milestones": weekly_milestones,
    }
