"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import toast from "react-hot-toast";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tags?: string[];
  _id: string;
};

type QuizData = {
  _id: string;
  title: string;
  date: string;
  questions: Question[];
  isPublished: boolean;
};

export default function QuizPage() {
  const { data: session, status } = useSession();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [gameState, setGameState] = useState<"start" | "playing" | "results">("start");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const [scoreData, setScoreData] = useState<{ score: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const todayStr = new Date().toISOString().split("T")[0];
      fetch(`/api/quiz?date=${todayStr}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not find a daily test for today.");
          return res.json();
        })
        .then((data) => {
          setQuiz(data);
          setAnswers(new Array(data.questions.length).fill(-1));
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [status]);

  // Timer effect
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [gameState]);

  const handleStart = () => {
    setGameState("playing");
    setElapsedTime(0);
  };

  const handleSelectOption = (optIdx: number) => {
    const updated = [...answers];
    updated[currentIdx] = optIdx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIdx < (quiz?.questions.length || 1) - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((ans) => ans === -1)) {
      if (!confirm("You have unanswered questions. Are you sure you want to submit?")) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz?._id,
          answers,
          timeTaken: elapsedTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setScoreData({ score: data.score, total: data.total });
      setGameState("results");
      toast.success("Quiz submitted successfully!");
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

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Loading daily quiz...</span>
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
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Please sign in to take today's daily prelims practice exam.</p>
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

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="tabler:exclamation-circle" className="text-3xl text-neutral-400 dark:text-neutral-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">No Quiz Found</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
            {error || "There are no quizzes published for today yet. Please check back later."}
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

  const currentQuestion = quiz.questions[currentIdx];

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-md px-6">
        
        {/* Start Game View */}
        {gameState === "start" && (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-3">
              Daily Prelims Practice
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-4">
              {quiz.title}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-lg mx-auto mb-8">
              This test consists of {quiz.questions.length} multiple-choice questions to boost your general studies preparation. A timer will record your duration. Ready to begin?
            </p>
            <button
              onClick={handleStart}
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-10 py-3.5 rounded-full text-sm font-medium transition-all shadow-sm inline-flex items-center gap-2"
            >
              Start Practice Test <Icon icon="tabler:chevron-right" className="text-base" />
            </button>
          </div>
        )}

        {/* Playing View */}
        {gameState === "playing" && (
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="flex items-center justify-between bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-sm font-medium text-neutral-500">
                Question <span className="text-black dark:text-white font-semibold">{currentIdx + 1}</span> of {quiz.questions.length}
              </span>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-mono text-sm bg-neutral-50 dark:bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-100 dark:border-neutral-900">
                <Icon icon="tabler:hourglass" className="text-base animate-pulse text-neutral-400" />
                {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {currentQuestion.tags?.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-bold text-neutral-950 dark:text-white leading-relaxed mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((option, oIdx) => {
                  const isSelected = answers[currentIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium flex items-center gap-4 transition-all ${
                        isSelected
                          ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                          : "bg-transparent border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border text-xs font-mono flex items-center justify-center ${
                        isSelected
                          ? "border-white/20 bg-white/10 dark:border-black/20 dark:bg-black/10 text-white dark:text-black font-bold"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-400"
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="bg-white border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 dark:hover:bg-neutral-900 text-black dark:text-white hover:bg-neutral-50 px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icon icon="tabler:arrow-left" /> Previous
              </button>

              {currentIdx === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                >
                  {submitting ? "Submitting..." : "Submit Test"} <Icon icon="tabler:circle-check" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                  Next <Icon icon="tabler:arrow-right" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results / Feedback View */}
        {gameState === "results" && scoreData && (
          <div className="flex flex-col gap-8">
            {/* Score summary card */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2 animate-pulse">
                Practice Completed
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-6">
                Your Performance
              </h1>
              
              <div className="flex items-center justify-center gap-8 mb-8 max-w-sm mx-auto">
                <div className="flex flex-col items-center flex-1 bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100/55 dark:border-neutral-900/55">
                  <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono">
                    {scoreData.score} / {scoreData.total}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase mt-1">
                    Final Score
                  </span>
                </div>
                <div className="flex flex-col items-center flex-1 bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100/55 dark:border-neutral-900/55">
                  <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono">
                    {formatTime(elapsedTime)}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase mt-1">
                    Time Taken
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Answer Explanations Review */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white px-2">
                Detailed Review
              </h2>
              {quiz.questions.map((q, qIdx) => {
                const userAns = answers[qIdx];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div
                    key={q._id}
                    className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-900">
                      <span className="text-xs font-semibold text-neutral-400">
                        Question {qIdx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <Icon icon="tabler:circle-check" /> Correct (+1)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <Icon icon="tabler:circle-x" /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-neutral-900 dark:text-white leading-relaxed">
                      {q.question}
                    </h3>

                    {/* Options list static */}
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAns === oIdx;
                        const isActualCorrect = q.correctIndex === oIdx;
                        
                        let optionStyle = "border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300";
                        if (isActualCorrect) {
                          optionStyle = "border-success bg-green-500/10 text-green-700 dark:text-green-400";
                        } else if (isSelected && !isCorrect) {
                          optionStyle = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-3 ${optionStyle}`}
                          >
                            <span className="font-bold font-mono">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-900/80 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-2">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
