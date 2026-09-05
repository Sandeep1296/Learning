"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import toast from "react-hot-toast";

type PromptData = {
  _id: string;
  question: string;
  date: string;
  paper: string;
  tags: string[];
  wordLimit: number;
  idealPoints: string[];
};

export default function AnswerWritingPage() {
  const { data: session, status } = useSession();
  
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [writingState, setWritingState] = useState<"write" | "evaluate" | "submitted">("write");
  const [content, setContent] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Self evaluation states
  const [checkedPoints, setCheckedPoints] = useState<boolean[]>([]);
  const [selfScore, setSelfScore] = useState<number>(5);
  const [selfNote, setSelfNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const todayStr = new Date().toISOString().split("T")[0];
      fetch(`/api/answer-writing/prompts?date=${todayStr}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not find a writing prompt for today.");
          return res.json();
        })
        .then((data) => {
          setPrompt(data);
          setCheckedPoints(new Array(data.idealPoints.length).fill(false));
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [status]);

  // Start timer automatically when writing starts
  useEffect(() => {
    if (writingState === "write" && status === "authenticated" && prompt) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [writingState, status, prompt]);

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const handleNextToEvaluation = () => {
    if (getWordCount(content) < 10) {
      toast.error("Please write at least 10 words before evaluation.");
      return;
    }
    setWritingState("evaluate");
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/answer-writing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt?._id,
          content,
          timeTaken: elapsedTime,
          selfScore,
          selfNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setWritingState("submitted");
      toast.success("Answer submission recorded successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleCheckPoint = (index: number) => {
    const updated = [...checkedPoints];
    updated[index] = !updated[index];
    setCheckedPoints(updated);
    
    // Automatically suggest score based on percentage of ideal points checked
    const checkedCount = updated.filter(Boolean).length;
    const suggestedScore = Math.min(10, Math.max(1, Math.round((checkedCount / updated.length) * 10)));
    setSelfScore(suggestedScore);
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Fetching mains question...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="tabler:lock-square-rounded" className="text-3xl text-neutral-400 dark:text-neutral-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Access Restricted</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Please sign in to practice daily GS Mains answer writing questions.</p>
          <button
            onClick={() => {
              const headerSignInBtn = document.querySelector("header button") as HTMLButtonElement;
              if (headerSignInBtn) headerSignInBtn.click();
            }}
            className="w-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 py-3 rounded-full text-sm font-medium transition-all"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="tabler:edit" className="text-3xl text-neutral-400 dark:text-neutral-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">No Prompt Found</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
            {error || "There are no subjective mains questions published for today yet. Please check back later."}
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
        
        {/* Step 1: Writing View */}
        {writingState === "write" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Prompt details */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black inline-block mb-4">
                  {prompt.paper} Question
                </span>
                
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-relaxed mb-6">
                  {prompt.question}
                </h1>

                <div className="flex flex-col gap-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-900 pt-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:calendar" className="text-base" />
                    <span>Published: {new Date(prompt.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="tabler:notes" className="text-base" />
                    <span>Suggested Limit: {prompt.wordLimit} words</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {prompt.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-bold uppercase tracking-wider bg-neutral-50 text-neutral-500 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Writing Canvas */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm flex flex-col flex-grow">
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-900">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Writing Canvas
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-neutral-500">
                      Words: <span className="text-black dark:text-white font-bold">{getWordCount(content)}</span>
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Icon icon="tabler:clock" /> {formatTime(elapsedTime)}
                    </span>
                  </div>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your detailed mains answer response here..."
                  className="w-full min-h-[350px] bg-transparent text-sm text-neutral-800 dark:text-neutral-200 outline-none resize-none leading-relaxed placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
                />

                <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-6">
                  <button
                    onClick={handleNextToEvaluation}
                    className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                  >
                    Next: Self Evaluation <Icon icon="tabler:arrow-right" className="text-base" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Step 2: Evaluation View */}
        {writingState === "evaluate" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side: Student Answer read-only */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-3">
                  Your Answer Copy
                </span>
                <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-[450px] overflow-y-auto pr-2">
                  {content}
                </div>
              </div>
            </div>

            {/* Right side: Ideal checklist and scoring */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
                
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Evaluation Rubric
                </span>
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-6">
                  Checklist of Ideal Points
                </h2>

                <p className="text-xs text-neutral-500 mb-4">
                  Check off the core points and arguments you successfully integrated into your answer. This helps score your response.
                </p>

                <div className="flex flex-col gap-3 mb-8">
                  {prompt.idealPoints.map((point, index) => (
                    <button
                      key={index}
                      onClick={() => toggleCheckPoint(index)}
                      className={`text-left p-3.5 rounded-xl border text-xs font-medium flex items-start gap-3 transition-all ${
                        checkedPoints[index]
                          ? "bg-green-500/5 border-green-500/30 text-green-800 dark:text-green-400"
                          : "bg-transparent border-neutral-100 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <Icon
                        icon={checkedPoints[index] ? "tabler:checkbox" : "tabler:square"}
                        className={`text-lg mt-0.5 ${checkedPoints[index] ? "text-green-600" : "text-neutral-400"}`}
                      />
                      <span>{point}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-900 pt-6 flex flex-col gap-6">
                  {/* Slider Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Self Awarded Score:
                      </span>
                      <span className="font-mono text-base font-extrabold bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded-full text-black dark:text-white">
                        {selfScore} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selfScore}
                      onChange={(e) => setSelfScore(Number(e.target.value))}
                      className="w-full accent-black dark:accent-white bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Reflection Notes */}
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mb-2">
                      Self-Reflection & Mistakes Notes:
                    </span>
                    <textarea
                      placeholder="Add reflections on how you can improve this answer copy (e.g. Structure, formatting)..."
                      value={selfNote}
                      onChange={(e) => setSelfNote(e.target.value)}
                      className="w-full p-4 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl outline-none resize-none min-h-[90px] text-neutral-800 dark:text-neutral-200"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setWritingState("write")}
                      className="bg-transparent text-neutral-500 hover:text-black dark:hover:text-white px-4 py-2 rounded-full text-xs font-medium transition-all"
                    >
                      Back to Editor
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={submitting}
                      className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                    >
                      {submitting ? "Submitting..." : "Submit Copy"} <Icon icon="tabler:circle-check" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Step 3: Submitted View */}
        {writingState === "submitted" && (
          <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 sm:p-12 text-center shadow-sm mx-auto">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="tabler:circle-check" className="text-3xl text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
              Submitted!
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
              Your answer copy has been logged and self-evaluated. Consistent practice is the key to mastering mains answer writing.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 py-3 rounded-full text-sm font-semibold transition-all text-center"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setContent("");
                  setElapsedTime(0);
                  setSelfScore(5);
                  setSelfNote("");
                  setWritingState("write");
                }}
                className="w-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white py-3 rounded-full text-sm font-medium transition-all"
              >
                Practice Again
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
