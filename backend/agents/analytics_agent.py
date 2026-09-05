from datetime import date
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


def calculate_sm2(quality: int, repetition_count: int, previous_interval: int, previous_ease: float):
    """
    SM-2 Spaced Repetition Algorithm.
    quality: rating 0-5 (0=blackout, 3=pass with effort, 5=perfect)
    returns: (next_repetition_count, next_interval_days, next_ease_factor)
    """
    quality = max(0, min(5, quality))

    new_ease = previous_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ease = max(1.3, new_ease)

    if quality < 3:
        new_repetition = 0
        new_interval = 1
    else:
        new_repetition = repetition_count + 1
        if new_repetition == 1:
            new_interval = 1
        elif new_repetition == 2:
            new_interval = 6
        else:
            new_interval = int(round(previous_interval * new_ease))

    return new_repetition, new_interval, new_ease


async def get_user_analytics_summary(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
    """
    Generates weak topic heatmap data and due revisions queue from MongoDB.
    """
    today = date.today().isoformat()

    all_mistakes = await db["mistake_logs"].find(
        {"user_id": user_id}
    ).to_list(length=1000)

    due_today = [m for m in all_mistakes if m.get("review_due_date", "9999-99-99") <= today]

    topic_counts = {}
    for m in all_mistakes:
        topic_counts[m.get("topic", "Unknown")] = topic_counts.get(m.get("topic", "Unknown"), 0) + 1

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
