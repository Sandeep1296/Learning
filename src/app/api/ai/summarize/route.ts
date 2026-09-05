import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ALL_TAGS } from "@/lib/syllabus";

async function callLmStudio(prompt: string): Promise<string | null> {
  const base = (process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1").replace("localhost", "127.0.0.1");
  const model = process.env.LMSTUDIO_MODEL || "local-model";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer lm-studio" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a UPSC current affairs analyst. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return (await res.json()).choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function callOllama(prompt: string): Promise<string | null> {
  const base = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace("localhost", "127.0.0.1");
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a UPSC current affairs analyst. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return (await res.json()).message?.content || null;
  } catch {
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return null;
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, title } = await req.json();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const tagList = ALL_TAGS.map((t) => t.slug).join(", ");

  const prompt = `Analyze this article for UPSC preparation.

Title: ${title || "Untitled"}
Content: ${content.substring(0, 3000)}

Return JSON:
{
  "summary": "<3-4 sentence UPSC-relevant summary>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "upscRelevance": "<why this matters for UPSC>",
  "suggestedTags": ["<pick 1-3 from: ${tagList}>"]
}`;

  let raw: string | null = null;
  for (const [fn, name] of [[callLmStudio, "LM Studio"], [callOllama, "Ollama"], [callGemini, "Gemini"]] as const) {
    raw = await fn(prompt);
    if (raw) { console.log(`[summarize] used ${name}`); break; }
  }

  if (!raw) {
    return NextResponse.json({ error: "All AI providers unavailable" }, { status: 503 });
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "AI returned invalid JSON", detail: raw.slice(0, 200) }, { status: 500 });
  }

  try {
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({ error: "JSON parse failed", detail: raw.slice(0, 200) }, { status: 500 });
  }
}
