import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.db.database import get_mongo_client, close_mongo
from backend.rag.watcher import RepositoryWatcher

from backend.api.routes.chat import router as chat_router
from backend.api.routes.quiz import router as quiz_router
from backend.api.routes.mains import router as mains_router
from backend.api.routes.analytics import router as analytics_router
from backend.api.routes.strategy import router as strategy_router
from backend.api.routes.upload import router as upload_router

watcher_instance = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global watcher_instance
    print(f"🚀 Starting {settings.APP_NAME} Backend...")

    # Connect to MongoDB Atlas (shared with Next.js frontend)
    try:
        client = get_mongo_client()
        await client.admin.command("ping")
        print("✅ MongoDB Atlas connected successfully.")
    except Exception as e:
        print(f"⚠️ MongoDB connection warning: {e}")

    # Start Repository Folder Watcher
    try:
        watcher_instance = RepositoryWatcher()
        watcher_instance.start()
        print("📁 Repository watcher started.")
    except Exception as e:
        print(f"⚠️ Watcher warning: {e}")

    yield

    # Shutdown
    if watcher_instance:
        watcher_instance.stop()
    await close_mongo()
    print("👋 Shutting down backend services.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic AI RAG Research Assistant for UPSC CSE — MongoDB Atlas Backend",
    version="2.1.0",
    lifespan=lifespan,
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(chat_router)
app.include_router(quiz_router)
app.include_router(mains_router)
app.include_router(analytics_router)
app.include_router(strategy_router)
app.include_router(upload_router)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "2.1.0",
        "database": "MongoDB Atlas",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    mongo_status = "unknown"
    try:
        client = get_mongo_client()
        await client.admin.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {e}"

    return {
        "status": "healthy",
        "mongodb": mongo_status,
        "ollama_base": settings.OLLAMA_BASE_URL,
        "ollama_model": settings.OLLAMA_MODEL,
        "lmstudio_base": settings.LMSTUDIO_BASE_URL,
        "chroma_dir": settings.CHROMA_PERSIST_DIR,
    }


if __name__ == "__main__":
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
