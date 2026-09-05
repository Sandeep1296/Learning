import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace("localhost", "127.0.0.1");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, provider = "auto", model } = await req.json();
  if (!messages?.length) return NextResponse.json({ error: "messages required" }, { status: 400 });

  const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
  const FASTAPI_URL = (process.env.FASTAPI_BACKEND_URL || "http://localhost:8000").replace("localhost", "127.0.0.1");

  // Try Python Agentic AI RAG Backend first — parse SSE and forward as plain text stream
  try {
    const fastApiRes = await fetch(`${FASTAPI_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: lastUserMsg,
        user_id: (session.user as any)?.id || "default_user",
        provider,
        model,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (fastApiRes.ok && fastApiRes.body) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = fastApiRes.body!.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              for (const line of chunk.split("\n")) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const payload = trimmed.slice(5).trim();
                if (payload === "[DONE]") { controller.close(); return; }
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed.token) controller.enqueue(encoder.encode(parsed.token));
                } catch {}
              }
            }
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
      });
    }
  } catch (backendErr) {
    console.log("[Next.js Proxy] FastAPI backend offline, falling back to direct Ollama.");
  }

  // Fallback: Direct Ollama REST integration
  const systemMessage = {
    role: "system",
    content: `You are an expert UPSC Civil Services preparation assistant. You have deep knowledge of:
- Indian History, Geography, Polity, Economy, Environment, Science & Technology
- Current Affairs and their UPSC relevance
- Mains GS Papers I, II, III, IV and Essay
- Previous Year Questions patterns and answer writing techniques

Be concise, accurate, and always relate answers to UPSC syllabus. When relevant, mention which GS paper a topic belongs to.`,
  };

  const ollamaMessages = [systemMessage, ...messages];

  try {
    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages: ollamaMessages, stream: true }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama status ${ollamaRes.status}`);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                const token = parsed.message?.content || "";
                if (token) controller.enqueue(encoder.encode(token));
                if (parsed.done) { controller.close(); return; }
              } catch {}
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    // Fallback to Google Gemini model if key is provided
    if (GEMINI_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemMessage.content}\n\nUser Question: ${lastUserMsg}` }],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
          return new Response(`⚠️ Primary backend & local Ollama offline. Response from fallback Gemini model:\n\n${text}`, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      } catch (geminiErr) {
        console.log("[Next.js Proxy] Gemini fallback failed:", geminiErr);
      }
    }

    return NextResponse.json(
      { error: "Could not connect to Ollama, FastAPI Backend, or Gemini API. Please start Ollama or configure GEMINI_API_KEY.", detail: err.message },
      { status: 503 }
    );
  }
}
