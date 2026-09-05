import { NextResponse } from "next/server";

async function checkOllama(): Promise<boolean> {
  try {
    const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace("localhost", "127.0.0.1");
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

async function checkLmStudio(): Promise<boolean> {
  try {
    const base = (process.env.LMSTUDIO_BASE_URL || "http://127.0.0.1:1234/v1").replace("localhost", "127.0.0.1");
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: "Bearer lm-studio" },
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch { return false; }
}

async function checkFastApi(): Promise<boolean> {
  try {
    const base = (process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1");
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

export async function GET() {
  const [ollama, lmstudio, fastapi] = await Promise.all([
    checkOllama(),
    checkLmStudio(),
    checkFastApi(),
  ]);

  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const anyAvailable = ollama || lmstudio || fastapi || geminiConfigured;

  return NextResponse.json({
    status: anyAvailable ? "online" : "offline",
    providers: {
      ollama,
      lmstudio,
      fastapi,
      gemini: geminiConfigured,
    },
    model: process.env.OLLAMA_MODEL || "llama3.2",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  });
}
