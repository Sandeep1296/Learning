const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function ollamaChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  stream = false
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error: ${err}`);
  }

  const data = await res.json();
  return data.message?.content || "";
}

export async function ollamaStreamResponse(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<ReadableStream> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: true }),
  });

  if (!res.ok) throw new Error(`Ollama stream error: ${res.statusText}`);
  return res.body!;
}

export async function ollamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
