"""
MongoDB connection manager for the FastAPI backend.
Uses Motor (async MongoDB driver) and connects to the same Atlas cluster
as the Next.js/Mongoose frontend — sharing all collections.
"""
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from backend.config import settings

_client: AsyncIOMotorClient = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI", settings.MONGODB_URI)
        _client = AsyncIOMotorClient(
            uri,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where(),
        )
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """Return the shared database instance."""
    client = get_mongo_client()
    # Extract DB name from URI (e.g. .../upsc_prep?...) or default
    uri = os.environ.get("MONGODB_URI", settings.MONGODB_URI)
    db_name = uri.split("/")[-1].split("?")[0] or "upsc_prep"
    return client[db_name]


async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — yields the Motor database."""
    yield get_database()


async def close_mongo():
    global _client
    if _client:
        _client.close()
        _client = None
