import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from backend.config import settings
from backend.agents.research_agent import run_research_agent

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default_user"
    active_sources: Optional[List[str]] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = None

@router.post("")
async def chat_endpoint(req: ChatRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    generator = run_research_agent(
        query=req.query,
        user_id=req.user_id,
        active_sources=req.active_sources,
        provider=req.provider,
        model=req.model,
        stream=True
    )
    
    return StreamingResponse(generator, media_type="text/event-stream")

@router.get("/models")
def get_available_models():
    """
    Returns dynamically available LLM providers and models.
    """
    providers = [
        {
            "id": "auto",
            "name": "Auto-Fallback",
            "models": ["default"],
            "description": "Tries Local Ollama -> OpenAI -> Google Gemini in order"
        },
        {
            "id": "ollama",
            "name": "Local Ollama",
            "models": [settings.OLLAMA_MODEL, "llama3.2", "llama3", "mistral", "qwen2.5"],
            "description": "Privacy-first local model execution via Ollama"
        },
        {
            "id": "lmstudio",
            "name": "LM Studio Local",
            "models": [settings.LMSTUDIO_MODEL, "local-model"],
            "description": "LM Studio OpenAI-compatible local server"
        },
        {
            "id": "gemini",
            "name": "Google Gemini",
            "models": ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
            "description": "Google DeepMind Multimodal & High-Speed LLM"
        },
        {
            "id": "openai",
            "name": "OpenAI",
            "models": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
            "description": "OpenAI flagship models"
        }
    ]

    # Dynamically fetch installed Ollama tags if local daemon is active
    try:
        res = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2.0)
        if res.status_code == 200:
            ollama_tags = [m["name"] for m in res.json().get("models", [])]
            if ollama_tags:
                providers[1]["models"] = ollama_tags
    except Exception:
        pass

    # Dynamically fetch loaded LM Studio models if local server is active
    try:
        lm_url = settings.LMSTUDIO_BASE_URL.rstrip("/v1").rstrip("/")
        res = httpx.get(f"{lm_url}/v1/models", timeout=2.0)
        if res.status_code == 200:
            lm_models = [m["id"] for m in res.json().get("data", [])]
            if lm_models:
                providers[2]["models"] = lm_models
    except Exception:
        pass


    return {"providers": providers}

