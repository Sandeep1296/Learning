import json
import re
import os
import httpx
from typing import Dict, Any
from backend.config import settings
from backend.rag import get_scoped_documents


def _call_lmstudio(system_prompt: str, user_prompt: str) -> str:
    """Call LM Studio OpenAI-compatible endpoint."""
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
                "temperature": 0.2,
            },
            headers={"Authorization": "Bearer lm-studio"},
            timeout=90.0,
        )
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[EvaluatorAgent] LM Studio error: {e}")
    return ""


def _call_ollama(system_prompt: str, user_prompt: str) -> str:
    """Call Ollama local chat endpoint."""
    try:
        res = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
            },
            timeout=90.0,
        )
        if res.status_code == 200:
            return res.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"[EvaluatorAgent] Ollama error: {e}")
    return ""


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Call Google Gemini REST API."""
    gemini_key = os.environ.get("GEMINI_API_KEY", settings.GEMINI_API_KEY)
    if not gemini_key:
        return ""
    gemini_model = os.environ.get("GEMINI_MODEL", settings.GEMINI_MODEL)
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
        res = httpx.post(
            url,
            json={"contents": [{"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}]},
            timeout=30.0,
        )
        if res.status_code == 200:
            return res.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"[EvaluatorAgent] Gemini error: {e}")
    return ""


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    """Call OpenAI chat endpoint."""
    if not settings.OPENAI_API_KEY:
        return ""
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        chat = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=settings.LLM_MODEL, temperature=0.2)
        res = chat.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        return res.content
    except Exception as e:
        print(f"[EvaluatorAgent] OpenAI error: {e}")
    return ""


def _extract_json_object(raw: str) -> Dict:
    """Robustly extract a JSON object from model output, stripping markdown fences."""
    stripped = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).replace("```", "").strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", stripped)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return {}


def evaluate_mains_answer(
    question: str,
    user_answer: str,
    marks: int = 15,
    user_id: str = "default_user",
) -> Dict[str, Any]:
    """
    Evaluates candidate's UPSC Mains answer based on standard UPSC evaluation rubric.
    Tries: LM Studio → Ollama → OpenAI → Gemini with automatic fallback.
    """
    # Retrieve model answer context via RAG
    docs = get_scoped_documents(query=question, user_id=user_id, k=3)
    rag_context = "\n\n".join([d.page_content for d in docs])

    system_prompt = (
        "You are an experienced UPSC Mains Evaluator & Examiner.\n"
        "Evaluate the candidate's answer strictly based on UPSC Mains rubric criteria:\n"
        "1. Introduction (Relevance, Hook)\n"
        "2. Body & Structure (Flow, Headings, Sub-points)\n"
        "3. Content & Accuracy (Substance, Concepts)\n"
        "4. Examples, Data & Case Studies\n"
        "5. Conclusion (Forward-looking, Crisp)\n"
        "Respond ONLY in valid JSON format, no markdown, no code fences."
    )

    user_prompt = f"""Question: {question} [{marks} Marks]

Candidate Answer:
{user_answer}

Reference Context from Vault:
{rag_context if rag_context else "Use core UPSC model answer knowledge."}

Return a valid JSON object in this exact format:
{{
  "score": <Calculated score out of {marks}>,
  "max_marks": {marks},
  "percentage": <Score percentage>,
  "breakdown": {{
    "introduction": "<Feedback on intro score out of 2>",
    "structure": "<Feedback on structure score out of 3>",
    "content": "<Feedback on content coverage score out of 5>",
    "examples": "<Feedback on examples score out of 3>",
    "conclusion": "<Feedback on conclusion score out of 2>"
  }},
  "strengths": ["<Strength 1>", "<Strength 2>"],
  "improvements": ["<Area for improvement 1>", "<Area for improvement 2>"],
  "model_points": ["<Key point that should be included 1>", "<Key point 2>"]
}}
"""

    # Try providers in order: LM Studio → Ollama → OpenAI → Gemini
    raw_response = ""
    for provider_fn, provider_name in [
        (_call_lmstudio, "LM Studio"),
        (_call_ollama, "Ollama"),
        (_call_openai, "OpenAI"),
        (_call_gemini, "Gemini"),
    ]:
        result = provider_fn(system_prompt, user_prompt)
        if result.strip():
            raw_response = result
            print(f"[EvaluatorAgent] Successfully used provider: {provider_name}")
            break
        print(f"[EvaluatorAgent] Provider {provider_name} failed, trying next...")

    if not raw_response:
        print("[EvaluatorAgent] All providers failed — returning default evaluation.")
        return _default_evaluation(marks)

    result = _extract_json_object(raw_response)
    if not result:
        print(f"[EvaluatorAgent] JSON parse error. Raw[:200]: {raw_response[:200]}")
        return _default_evaluation(marks)

    return result


def _default_evaluation(marks: int) -> Dict[str, Any]:
    return {
        "score": round(marks * 0.5, 1),
        "max_marks": marks,
        "percentage": 50.0,
        "breakdown": {
            "introduction": "Fair introduction",
            "structure": "Adequate structure",
            "content": "Good coverage of core points",
            "examples": "Add more relevant case studies",
            "conclusion": "Standard concluding remark",
        },
        "strengths": ["Good attempt on main core concept"],
        "improvements": ["Incorporate current affairs examples"],
        "model_points": ["Include Constitutional Articles and committee reports"],
    }
