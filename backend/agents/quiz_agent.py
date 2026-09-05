import json
import re
import os
import httpx
from typing import List, Dict, Any
from backend.config import settings
from backend.rag import get_scoped_documents


def _call_lmstudio(system_prompt: str, user_prompt: str) -> str:
    """Call LM Studio OpenAI-compatible endpoint, returns raw text or empty string."""
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
            timeout=60.0,
        )
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[QuizAgent] LM Studio error: {e}")
    return ""


def _call_ollama(system_prompt: str, user_prompt: str) -> str:
    """Call Ollama local chat endpoint, returns raw text or empty string."""
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
            timeout=60.0,
        )
        if res.status_code == 200:
            return res.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"[QuizAgent] Ollama error: {e}")
    return ""


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Call Google Gemini REST API, returns raw text or empty string."""
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
        print(f"[QuizAgent] Gemini error: {e}")
    return ""


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    """Call OpenAI chat endpoint, returns raw text or empty string."""
    if not settings.OPENAI_API_KEY:
        return ""
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        chat = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=settings.LLM_MODEL, temperature=0.3)
        res = chat.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        return res.content
    except Exception as e:
        print(f"[QuizAgent] OpenAI error: {e}")
    return ""


def _extract_json_array(raw: str) -> List[Dict]:
    """Robustly extract JSON array from model output, stripping markdown fences."""
    stripped = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).replace("```", "").strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    match = re.search(r"\[[\s\S]*\]", stripped)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return []


def generate_quiz_questions(
    topic: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    paper: str = "GS1",
    user_id: str = "default_user",
    active_sources: List[str] = None,
) -> List[Dict[str, Any]]:
    """
    Generates UPSC Prelims MCQs grounded in RAG context.
    Tries: LM Studio → Ollama → OpenAI → Gemini with automatic fallback.
    """
    # 1. Retrieve RAG Context
    docs = get_scoped_documents(query=topic, user_id=user_id, active_sources=active_sources, k=3)
    context_str = "\n\n".join([f"[{d.metadata.get('source', 'Ref')}] {d.page_content}" for d in docs])

    system_prompt = (
        "You are a senior UPSC Prelims examination question setter.\n"
        "Generate realistic, non-ambiguous UPSC-style Multiple Choice Questions (MCQs).\n"
        "Respond ONLY with a valid JSON array, no markdown, no code fences, no commentary."
    )

    user_prompt = f"""Generate {num_questions} UPSC Prelims MCQs on: "{topic}"
Paper: {paper}
Difficulty: {difficulty}

Reference Context from Vault:
{context_str if context_str else "No vault document context found. Use standard UPSC syllabus facts."}

Rules:
1. Exactly 4 options per question ["A", "B", "C", "D"]
2. Exactly 1 correct option index (0 for A, 1 for B, 2 for C, 3 for D)
3. Concise 2-3 line clear explanation referencing key facts
4. UPSC Prelims conceptual rigor

Return ONLY a JSON array in this exact format:
[
  {{
    "question_text": "<Question text>",
    "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
    "correct_answer": 0,
    "explanation": "<Explanation>",
    "source_ref": "<Reference source or topic>",
    "topic": "{topic}",
    "gs_paper": "{paper}",
    "difficulty": "{difficulty}"
  }}
]
"""

    # 2. Try providers in order: LM Studio → Ollama → OpenAI → Gemini
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
            print(f"[QuizAgent] Successfully used provider: {provider_name}")
            break
        print(f"[QuizAgent] Provider {provider_name} failed, trying next...")

    if not raw_response:
        print("[QuizAgent] All providers failed — returning placeholder question.")
        return [
            {
                "question_text": f"Which of the following is associated with {topic}?",
                "options": ["Statement 1 only", "Statement 2 only", "Both 1 and 2", "Neither 1 nor 2"],
                "correct_answer": 2,
                "explanation": f"Refer to study notes on {topic}.",
                "source_ref": "Syllabus Core",
                "topic": topic,
                "gs_paper": paper,
                "difficulty": difficulty,
            }
        ]

    # 3. Parse JSON
    questions = _extract_json_array(raw_response)
    if not questions:
        print(f"[QuizAgent] JSON parse error. Raw[:200]: {raw_response[:200]}")
        return [
            {
                "question_text": f"Which of the following is associated with {topic}?",
                "options": ["Statement 1 only", "Statement 2 only", "Both 1 and 2", "Neither 1 nor 2"],
                "correct_answer": 2,
                "explanation": f"Refer to study notes on {topic}.",
                "source_ref": "Syllabus Core",
                "topic": topic,
                "gs_paper": paper,
                "difficulty": difficulty,
            }
        ]

    return questions
