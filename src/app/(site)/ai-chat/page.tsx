"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

type AiHealth = {
  status: "online" | "offline";
  providers: { ollama: boolean; lmstudio: boolean; fastapi: boolean; gemini: boolean };
  model: string;
};

type Message = { role: "user" | "assistant"; content: string };
  "Explain the Basic Structure Doctrine with key cases",
  "What is the difference between Fundamental Rights and DPSP?",
  "Summarize India's monetary policy framework",
  "Key environmental conventions India has signed",
  "How to write a good GS2 governance answer?",
];

export default function AIChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [aiProviders, setAiProviders] = useState<AiHealth["providers"] | null>(null);
  const [aiModel, setAiModel] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    fetch("/api/ai/health")
      .then((r) => r.json())
      .then((d: AiHealth) => {
        setAiStatus(d.status);
        setAiProviders(d.providers);
        setAiModel(d.model);
      })
      .catch(() => setAiStatus("offline"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          provider: selectedProvider,
          model: selectedModel || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `⚠️ ${err.error}` };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value);
        const current = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: current };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "⚠️ Could not connect to AI. Make sure local backend or Ollama is running.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center shadow-sm">
          <Icon icon="tabler:lock-square-rounded" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Sign in to use AI Assistant</h1>
          <p className="text-sm text-neutral-500 mb-6">Your personal UPSC study AI assistant.</p>
          <Link href="/" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full text-sm font-medium">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-24 pb-0 flex flex-col">
      <div className="container mx-auto lg:max-w-screen-md px-4 flex flex-col flex-1 h-[calc(100vh-6rem)]">

        {/* Header with Dynamic Provider / Model Selector */}
        <div className="flex flex-wrap items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-900 mb-4 shrink-0 gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Icon icon="tabler:brain" className="text-2xl" /> UPSC AI Assistant
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">Dynamic Multi-Model Agentic RAG Pipeline</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic Provider Selector */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs rounded-full px-3 py-1.5 outline-none font-semibold cursor-pointer"
            >
              <option value="auto">⚡ Auto-Fallback</option>
              <option value="ollama">💻 Local Ollama</option>
              <option value="lmstudio">🚀 LM Studio</option>
              <option value="gemini">✨ Google Gemini</option>
              <option value="openai">🤖 OpenAI GPT</option>
            </select>


            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              aiStatus === "online"
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                aiStatus === "online" ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"
              }`} />
              {selectedProvider === "auto" ? "Auto Mode" : selectedProvider.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Offline warning — only shown when ALL providers are unavailable */}
        {aiStatus === "offline" && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 shrink-0">
            <p className="font-bold mb-1">No AI providers available</p>
            <p>Start one of: <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-mono">ollama serve</code>, LM Studio, or set <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-mono">GEMINI_API_KEY</code></p>
            {aiProviders && (
              <div className="flex gap-3 mt-2">
                {Object.entries(aiProviders).map(([k, v]) => (
                  <span key={k} className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                    v ? "border-green-400 text-green-700 dark:text-green-400" : "border-amber-300 text-amber-600 dark:text-amber-400 opacity-50"
                  }`}>{k}: {v ? "✓" : "✗"}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-2 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                <Icon icon="tabler:brain" className="text-3xl text-neutral-400 dark:text-neutral-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-1">Ask anything about UPSC</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">History, Polity, Economy, Current Affairs, Answer Writing tips...</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    disabled={aiStatus !== "online"}
            className="text-left text-xs px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Icon icon="tabler:brain" className="text-sm text-white dark:text-neutral-950" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-br-sm"
                  : "bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-bl-sm"
              }`}>
                {msg.content}
                {msg.role === "assistant" && streaming && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-neutral-400 dark:bg-neutral-500 ml-1 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-neutral-100 dark:border-neutral-900 pt-4 pb-6">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-3 flex items-center gap-1 transition-colors"
            >
              <Icon icon="tabler:trash" className="text-sm" /> Clear conversation
            </button>
          )}
          <div className="flex items-end gap-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 shadow-sm focus-within:border-neutral-400 dark:focus-within:border-neutral-600 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={aiStatus === "online" ? "Ask about any UPSC topic... (Enter to send)" : "No AI providers available — check settings"}
              disabled={aiStatus !== "online" || streaming}
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 max-h-32 disabled:opacity-50"
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming || aiStatus !== "online"}
              className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-950 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all disabled:opacity-30 disabled:pointer-events-none shrink-0"
            >
              {streaming
                ? <span className="w-3 h-3 rounded-sm bg-white dark:bg-neutral-950 animate-pulse" />
                : <Icon icon="tabler:arrow-up" className="text-sm" />
              }
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center mt-2">
            Running locally via Ollama · No data sent to external servers
          </p>
        </div>
      </div>
    </main>
  );
}
