"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

type DashboardStats = {
  totalQuizzes: number;
  avgScore: number;
  totalAnswers: number;
  recentQuizzes: any[];
  recentAnswers: any[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Analyzing your progress...</span>
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
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Access Restriced</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Please sign in to access your student learning dashboard and track your metrics.</p>
          <button
            onClick={() => {
              // Click the Header's Sign In button by triggering the login modal
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

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Here is your daily study coverage and performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/quiz"
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <Icon icon="tabler:player-play" className="text-base" /> Take Today's Quiz
            </Link>
            <Link
              href="/answer-writing"
              className="bg-white border border-neutral-200 text-black hover:bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <Icon icon="tabler:edit" className="text-base" /> Practice Writing
            </Link>
          </div>
        </div>

        {/* Overview Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all hover:border-neutral-200 dark:hover:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Prelims Quizzes
              </span>
              <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <Icon icon="tabler:clipboard-check" className="text-xl text-neutral-600 dark:text-neutral-300" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats?.totalQuizzes || 0}
              </span>
              <span className="text-sm text-neutral-500">completed</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all hover:border-neutral-200 dark:hover:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Average Accuracy
              </span>
              <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <Icon icon="tabler:percentage" className="text-xl text-neutral-600 dark:text-neutral-300" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats?.avgScore || 0}%
              </span>
              <span className="text-sm text-neutral-500">score rate</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all hover:border-neutral-200 dark:hover:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Mains Answers
              </span>
              <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <Icon icon="tabler:book" className="text-xl text-neutral-600 dark:text-neutral-300" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                {stats?.totalAnswers || 0}
              </span>
              <span className="text-sm text-neutral-500">submitted</span>
            </div>
          </div>
        </div>

        {/* Detailed Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quizzes List */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Recent Quizzes</h2>
              <Link href="/quiz" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-wider">
                View All
              </Link>
            </div>
            {stats?.recentQuizzes && stats.recentQuizzes.length > 0 ? (
              <div className="flex flex-col gap-4">
                {stats.recentQuizzes.map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100/50 dark:border-neutral-900/50">
                    <div className="max-w-[70%]">
                      <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                        {attempt.quizId?.title || "Daily Prelims MCQ Quiz"}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Completed: {new Date(attempt.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-neutral-900 dark:text-white block">
                        {attempt.score} / {attempt.quizId?.questions?.length || 0}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">
                        {attempt.timeTaken}s taken
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon icon="tabler:clipboard" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No quizzes attempted yet.</p>
                <Link href="/quiz" className="text-xs text-black dark:text-white hover:underline mt-2 inline-block font-medium">
                  Try Today's Test
                </Link>
              </div>
            )}
          </div>

          {/* Answer Writing List */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Recent Written Answers</h2>
              <Link href="/answer-writing" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-wider">
                Practice More
              </Link>
            </div>
            {stats?.recentAnswers && stats.recentAnswers.length > 0 ? (
              <div className="flex flex-col gap-4">
                {stats.recentAnswers.map((submission, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100/50 dark:border-neutral-900/50">
                    <div className="max-w-[70%]">
                      <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        GS Paper Submission
                      </p>
                      <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mt-0.5 truncate">
                        {submission.content ? (submission.content.substring(0, 50) + "...") : "Mains response submission"}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {submission.selfScore ? (
                        <>
                          <span className="font-mono text-base font-bold text-neutral-900 dark:text-white block">
                            {submission.selfScore} / 10
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-neutral-400">
                            Self Evaluation
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-neutral-400">
                          Not Evaluated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon icon="tabler:edit" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No answers written yet.</p>
                <Link href="/answer-writing" className="text-xs text-black dark:text-white hover:underline mt-2 inline-block font-medium">
                  Write Your First Answer
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
