"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

type Submission = {
  _id: string;
  content: string;
  wordCount: number;
  selfScore?: number;
  selfNote?: string;
  timeTaken?: number;
  submittedAt: string;
  promptId?: {
    question: string;
    paper: string;
    wordLimit: number;
    date: string;
  };
};

export default function AnswerHistoryPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/answer-writing/submit")
        .then((r) => r.json())
        .then((data) => { setSubmissions(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const formatTime = (sec?: number) => {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const scoreColor = (score?: number) => {
    if (!score) return "text-neutral-400";
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center">
          <Icon icon="tabler:lock-square-rounded" className="text-4xl text-neutral-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Sign in to view history</h1>
          <Link href="/" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full text-sm font-medium">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">

        <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Answer Writing History</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
              {submissions.length} answer{submissions.length !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <Link
            href="/answer-writing"
            className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
          >
            <Icon icon="tabler:edit" /> Write Today's Answer
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl">
            <Icon icon="tabler:edit" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No answers submitted yet.</p>
            <Link href="/answer-writing" className="text-xs text-black dark:text-white hover:underline mt-2 inline-block font-medium">
              Write your first answer
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((sub) => {
              const isOpen = expanded === sub._id;
              return (
                <div key={sub._id} className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl shadow-sm overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : sub._id)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {sub.promptId?.paper && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                            {sub.promptId.paper}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          {new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                        {sub.promptId?.question || "Mains Answer Submission"}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center hidden sm:block">
                        <span className={`text-xl font-black font-mono ${scoreColor(sub.selfScore)}`}>
                          {sub.selfScore ?? "—"}<span className="text-xs font-normal text-neutral-400">/10</span>
                        </span>
                        <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Self Score</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-base font-bold text-neutral-700 dark:text-neutral-300 font-mono">{sub.wordCount ?? "—"}</span>
                        <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Words</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-base font-bold text-neutral-700 dark:text-neutral-300 font-mono">{formatTime(sub.timeTaken)}</span>
                        <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Time</p>
                      </div>
                      <Icon icon={isOpen ? "tabler:chevron-up" : "tabler:chevron-down"} className="text-neutral-400 text-lg" />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="border-t border-neutral-100 dark:border-neutral-900 p-6 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4 sm:hidden">
                        <div className="text-center bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3">
                          <span className={`text-lg font-black font-mono ${scoreColor(sub.selfScore)}`}>{sub.selfScore ?? "—"}/10</span>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Score</p>
                        </div>
                        <div className="text-center bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3">
                          <span className="text-lg font-bold text-neutral-700 dark:text-neutral-300 font-mono">{sub.wordCount ?? "—"}</span>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Words</p>
                        </div>
                        <div className="text-center bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3">
                          <span className="text-lg font-bold text-neutral-700 dark:text-neutral-300 font-mono">{formatTime(sub.timeTaken)}</span>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">Time</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Your Answer</p>
                        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-900 rounded-2xl p-5 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {sub.content}
                        </div>
                      </div>

                      {sub.selfNote && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Self Reflection</p>
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            {sub.selfNote}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
