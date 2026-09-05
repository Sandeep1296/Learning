import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const QUIZ_PROMPT = (topic: string, difficulty: string, paper: string) =>
  `You are a UPSC Prelims question setter. Generate exactly 1 MCQ. Respond with a single JSON object only, no markdown, no code fences, no extra text.

Topic: "${topic}"
Paper: ${paper}
Difficulty: ${difficulty}

Return ONLY this JSON object:
{
  "question": "<question text>",
  "options": ["<A>", "<B>", "<C>", "<D>"],
  "correctIndex": <0-3>,
  "explanation": "<2-3 line explanation>",
  "tags": ["<topic-slug>"]
}`;

async function tryOllama(systemMsg: string, userMsg: string): Promise<string | null> {
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace("localhost", "127.0.0.1");
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        stream: false,
        options: { num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return null;
    return (await res.json()).message?.content || null;
  } catch {
    return null;
  }
}

async function tryLmStudio(systemMsg: string, userMsg: string): Promise<string | null> {
  const base = (process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234/v1").replace("localhost", "127.0.0.1");
  const model = process.env.LMSTUDIO_MODEL || "local-model";
  console.log(`[generate-quiz] trying LM Studio at ${base} with model ${model}`);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer lm-studio" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(90000),
    });
    console.log(`[generate-quiz] LM Studio response status: ${res.status}`);
    if (!res.ok) { console.error(`[generate-quiz] LM Studio non-ok: ${res.status} ${await res.text()}`); return null; }
    return (await res.json()).choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("[generate-quiz] LM Studio fetch error:", e);
    return null;
  }
}

async function tryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return null;
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

function extractJsonObject(raw: string): any | null {
  // Strip <think>...</think> reasoning blocks (Qwen3, DeepSeek-R1, etc.)
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const stripped = withoutThink.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  // Fix malformed keys like { " "question": ... } → { "question": ... }
  const cleaned = stripped.replace(/"\s+"/g, '"');

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}

  // Find first { ... } block
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  const block = cleaned.slice(start);

  // Try as-is
  try {
    const parsed = JSON.parse(block);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}

  // Truncated recovery: walk backwards to find last position where we have
  // a complete field (closing quote/bracket/number) followed by optional whitespace then , or }
  try {
    // Find all positions of "}," or complete field endings
    // Strategy: try progressively shorter cuts at each top-level comma
    let depth = 0;
    let inString = false;
    let lastSafeComma = -1;
    for (let i = 0; i < block.length; i++) {
      const ch = block[i];
      if (ch === "\\" && inString) { i++; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") depth--;
      else if (ch === "," && depth === 1) lastSafeComma = i;
    }
    if (lastSafeComma > 0) {
      const recovered = JSON.parse(block.slice(0, lastSafeComma) + "}");
      if (recovered && typeof recovered === "object") return recovered;
    }
  } catch {}

  return null;
}

function extractJsonArray(raw: string): any[] | null {
  // Strip <think>...</think> reasoning blocks
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const stripped = withoutThink.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const cleaned = stripped.replace(/"\s+"/g, '"');

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  const start = cleaned.indexOf("[");
  if (start === -1) return null;
  const block = cleaned.slice(start);

  try {
    const parsed = JSON.parse(block);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}

  // Truncation recovery: cut at last complete object
  try {
    const lastCompleteObj = block.lastIndexOf("},");
    const lastObj = block.lastIndexOf("}");
    const cutAt = lastCompleteObj !== -1 ? lastCompleteObj + 1 : lastObj + 1;
    if (cutAt > 1) {
      const recovered = JSON.parse(block.slice(0, cutAt) + "]");
      if (Array.isArray(recovered) && recovered.length > 0) return recovered;
    }
  } catch {}

  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { topic, numQuestions = 5, difficulty = "medium", paper = "GS1" } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });

  const systemMsg = "You are a UPSC Prelims question setter. Generate exactly 1 MCQ as a JSON object. No markdown, no code fences, no extra text.";

  // Generate questions sequentially — LM Studio is single-threaded and drops
  // concurrent requests (returns empty content) when busy with another request.
  async function generateOne(): Promise<{ raw: string; provider: string } | null> {
    const userMsg = QUIZ_PROMPT(topic, difficulty, paper);
    const lmResult = await tryLmStudio(systemMsg, userMsg);
    if (lmResult) return { raw: lmResult, provider: "lmstudio" };
    const ollamaResult = await tryOllama(systemMsg, userMsg);
    if (ollamaResult) return { raw: ollamaResult, provider: "ollama" };
    const geminiResult = await tryGemini(`${systemMsg}\n\n${userMsg}`);
    if (geminiResult) return { raw: geminiResult, provider: "gemini" };
    return null;
  }

  const results: ({ raw: string; provider: string } | null)[] = [];
  for (let i = 0; i < numQuestions; i++) {
    results.push(await generateOne());
  }
  const usedProvider = results.find(r => r !== null)?.provider || "unknown";

  const questions = results
    .filter((r): r is { raw: string; provider: string } => r !== null)
    .map(r => extractJsonObject(r.raw))
    .filter((q): q is any =>
      q !== null &&
      typeof q.question === "string" && q.question.trim() !== "" &&
      Array.isArray(q.options) && q.options.length === 4
    );

  if (questions.length === 0) {
    const sampleRaw = results.find(r => r !== null)?.raw || "";
    return NextResponse.json(
      { error: "No AI backend available", detail: sampleRaw.slice(0, 300) },
      { status: 503 }
    );
  }

  const normalised = questions.map((q: any) => ({
    question: q.question || q.question_text || "",
    options: q.options,
    correctIndex: q.correctIndex ?? q.correct_answer ?? 0,
    explanation: q.explanation || "",
    tags: Array.isArray(q.tags) ? q.tags : [topic.toLowerCase().replace(/\s+/g, "-")],
  }));

  console.log(`[generate-quiz] generated ${normalised.length}/${numQuestions} questions via ${usedProvider}`);
  return NextResponse.json({ questions: normalised, provider: usedProvider });
}
