import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # App config
    APP_NAME: str = "UPSC Personal Research Assistant"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # MongoDB (shared with Next.js frontend)
    MONGODB_URI: str = "mongodb+srv://Sandeep:circle-hype@cluster0.t5san.mongodb.net/upsc_prep?appName=Cluster0"

    # LLM Settings
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    USE_OLLAMA: bool = True
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # Gemini Fallback Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # LM Studio Local Execution Settings (OpenAI-compatible)
    LMSTUDIO_BASE_URL: str = "http://localhost:1234/v1"
    LMSTUDIO_MODEL: str = "local-model"

    # ChromaDB Vector Storage
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # Storage
    REPOSITORY_BASE_PATH: str = "./repository"

    # Auth
    JWT_SECRET: str = "dev_secret_jwt_key_change_in_production_12345"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
