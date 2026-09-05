import os
import json
import httpx
from typing import List, Dict, Any, Generator
from backend.config import settings
from backend.rag import get_scoped_documents


def run_research_agent(
    query: str,
    user_id: str = "default_user",
    active_sources: List[str] = None,
    provider: str = "auto",
    model: str = None,
    stream: bool = True
) -> Generator[str, None, None]:
    """
    RAG-grounded research agent supporting dynamic LLM provider & model selection.
    Providers: 'auto', 'ollama', 'openai', 'gemini'
    """
    # 1. Retrieve grounded context
    docs = get_scoped_documents(query=query, user_id=user_id, active_sources=active_sources, k=4)
    
    context_text = ""
    citations = []
    
    for i, d in enumerate(docs):
        src = d.metadata.get("source", "Unknown Document")
        col = d.metadata.get("collection", "vault")
        page = d.metadata.get("page", "")
        page_str = f" (p. {page})" if page else ""
        
        context_text += f"\n--- Reference [{i+1}] Source: {src}{page_str} ({col}) ---\n{d.page_content}\n"
        citations.append({
            "id": i + 1,
            "source": src,
            "collection": col,
            "page": page,
            "snippet": d.page_content[:150] + "..."
        })

    # 2. Prepare System Prompt
    system_prompt = (
        "You are an expert UPSC Civil Services Agentic Research Assistant with RAG capabilities.\n"
        "Ground your response thoroughly in the provided reference materials whenever available.\n"
        "Provide factual, highly structured, and accurate answers relevant to UPSC GS Papers I-IV and Optional subjects.\n"
        "At the end of your explanation, explicitly cite the references used [1], [2], etc."
    )

    user_prompt = f"Question: {query}\n\nRetrieved Reference Materials:\n{context_text if context_text else 'No specific vault documents found. Use core UPSC general knowledge.'}"

    # Determine execution strategy
    target_provider = provider.lower() if provider else "auto"
    target_model = model or (settings.OLLAMA_MODEL if target_provider == "ollama" else settings.GEMINI_MODEL if target_provider == "gemini" else settings.LLM_MODEL)

    executed_successfully = False

    # 3. Dynamic Execution Logic

    # A. Specific Provider Request: GEMINI
    if target_provider == "gemini":
        gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        if gemini_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                from langchain_core.messages import SystemMessage, HumanMessage

                g_model = ChatGoogleGenerativeAI(
                    google_api_key=gemini_key,
                    model=target_model or settings.GEMINI_MODEL,
                    streaming=True
                )
                messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
                for chunk in g_model.stream(messages):
                    if chunk.content:
                        yield f"data: {json.dumps({'token': chunk.content})}\n\n"
                executed_successfully = True
            except Exception as err:
                print(f"[ResearchAgent] Gemini error: {err}")

    # B. Specific Provider Request: OPENAI
    elif target_provider == "openai":
        if settings.OPENAI_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import SystemMessage, HumanMessage

                chat = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=target_model or settings.LLM_MODEL, streaming=True)
                messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
                for chunk in chat.stream(messages):
                    if chunk.content:
                        yield f"data: {json.dumps({'token': chunk.content})}\n\n"
                executed_successfully = True
            except Exception as err:
                print(f"[ResearchAgent] OpenAI error: {err}")

    # C. Specific Provider Request: LMSTUDIO (LM Studio local server)
    elif target_provider == "lmstudio":
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage

            lm_url = os.environ.get("LMSTUDIO_BASE_URL", settings.LMSTUDIO_BASE_URL)
            lm_model_name = target_model or os.environ.get("LMSTUDIO_MODEL", settings.LMSTUDIO_MODEL)

            chat = ChatOpenAI(
                openai_api_base=lm_url,
                openai_api_key="lm-studio",
                model=lm_model_name,
                streaming=True
            )
            messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
            for chunk in chat.stream(messages):
                if chunk.content:
                    yield f"data: {json.dumps({'token': chunk.content})}\n\n"
            executed_successfully = True
        except Exception as err:
            print(f"[ResearchAgent] LM Studio error: {err}")
            # Direct REST fallback to LM Studio
            try:
                lm_url = os.environ.get("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")
                res = httpx.post(f"{lm_url}/chat/completions", json={
                    "model": target_model or "local-model",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3
                }, timeout=30.0)
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"]
                    yield f"data: {json.dumps({'token': text})}\n\n"
                    executed_successfully = True
            except Exception as rest_err:
                print(f"[ResearchAgent] LM Studio REST fallback error: {rest_err}")

    # D. Specific Provider Request: OLLAMA
    elif target_provider == "ollama":
        payload = {
            "model": target_model or settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": True
        }
        try:
            with httpx.stream("POST", f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload, timeout=30.0) as resp:
                if resp.status_code == 200:
                    for line in resp.iter_lines():
                        if line:
                            try:
                                parsed = json.loads(line)
                                token = parsed.get("message", {}).get("content", "")
                                if token:
                                    yield f"data: {json.dumps({'token': token})}\n\n"
                            except Exception:
                                pass
                    executed_successfully = True
        except Exception as err:
            print(f"[ResearchAgent] Ollama error: {err}")


    # AUTO mode or Fallback chain if primary choice failed
    if not executed_successfully:
        if target_provider != "auto":
            yield f"data: {json.dumps({'token': f'⚠️ Selected provider ({target_provider}) failed. Switching to Auto-Fallback mode...\n\n'})}\n\n"

        # Auto-fallback step 0: LM Studio (OpenAI-compatible local server)
        lm_url = os.environ.get("LMSTUDIO_BASE_URL", settings.LMSTUDIO_BASE_URL)
        lm_model = os.environ.get("LMSTUDIO_MODEL", settings.LMSTUDIO_MODEL)
        try:
            res = httpx.post(
                f"{lm_url}/chat/completions",
                json={
                    "model": lm_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,
                },
                headers={"Authorization": "Bearer lm-studio"},
                timeout=10.0,
            )
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"]
                yield f"data: {json.dumps({'token': text})}\n\n"
                executed_successfully = True
        except Exception as lm_err:
            print(f"[ResearchAgent] Auto-fallback LM Studio error: {lm_err}")

        # Auto-fallback step 1: Ollama
        if not executed_successfully:
            try:
                payload = {
                    "model": settings.OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "stream": True
                }
                with httpx.stream("POST", f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload, timeout=10.0) as resp:
                    if resp.status_code == 200:
                        for line in resp.iter_lines():
                            if line:
                                try:
                                    parsed = json.loads(line)
                                    token = parsed.get("message", {}).get("content", "")
                                    if token:
                                        yield f"data: {json.dumps({'token': token})}\n\n"
                                except Exception:
                                    pass
                        executed_successfully = True
            except Exception as err:
                print(f"[ResearchAgent] Auto-fallback Ollama error: {err}")

        # Auto-fallback step 2: Gemini
        if not executed_successfully:
            gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
            if gemini_key:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={gemini_key}"
                    res = httpx.post(url, headers={"Content-Type": "application/json"}, json={
                        "contents": [{"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}]
                    }, timeout=30.0)
                    if res.status_code == 200:
                        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        yield f"data: {json.dumps({'token': text})}\n\n"
                        executed_successfully = True
                except Exception as g_err:
                    print(f"[ResearchAgent] Auto-fallback Gemini error: {g_err}")

        if not executed_successfully:
            yield f"data: {json.dumps({'token': '⚠️ All AI providers (LM Studio, Ollama, Gemini) are unavailable. Please start at least one local server or configure GEMINI_API_KEY.'})}\n\n"


    # Send citations object at the end of stream
    yield f"data: {json.dumps({'citations': citations})}\n\n"
    yield "data: [DONE]\n\n"


