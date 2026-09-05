"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white pt-28">
      {/* Hero Section */}
      <section className="py-20 md:py-28 overflow-hidden relative border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6 text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-500 tracking-tight mb-8">
            <Icon icon="tabler:award-filled" className="text-black dark:text-white text-sm" /> 
            <span>Complete Civil Services Prep Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-neutral-900 dark:text-white max-w-4xl mb-6">
            Master the UPSC Civil Services Examination.
          </h1>

          <p className="text-neutral-500 dark:text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-10">
            A minimalist, distraction-free environment for daily Prelims MCQs, Mains GS essay writing, current affairs editorials, and syllabus study guides.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-b from-neutral-800 to-neutral-950 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-950 hover:opacity-90 px-10 py-4 rounded-full text-sm font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2"
              >
                Go to Dashboard <Icon icon="tabler:arrow-right" className="text-base" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-header-modal", { detail: "student-signup" }))}
                  className="bg-gradient-to-b from-neutral-800 to-neutral-950 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-950 hover:opacity-90 px-10 py-4 rounded-full text-sm font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2"
                >
                  Create Free Account <Icon icon="tabler:arrow-right" className="text-base" />
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-header-modal", { detail: "student-signin" }))}
                  className="bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900 px-10 py-4 rounded-full text-sm font-semibold tracking-wide transition-all"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-neutral-50 dark:bg-black">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-905 dark:text-white mb-4">
              Everything you need, simplified.
            </h2>
            <p className="text-neutral-500 dark:text-neutral-450 text-sm">
              Focus on what matters. Our platform replaces cluttered interfaces with structured study workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-250 dark:hover:border-neutral-800 transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-6">
                  <Icon icon="tabler:clipboard-list" className="text-xl text-neutral-800 dark:text-neutral-200" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Daily MCQ Tests</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
                  Solve curated GS and CSAT multiple-choice tests daily. Analyze wrong answers with rich explanations.
                </p>
              </div>
              <Link href="/quiz" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white mt-8 flex items-center gap-1">
                Take Test <Icon icon="tabler:arrow-right" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-250 dark:hover:border-neutral-800 transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-6">
                  <Icon icon="tabler:edit" className="text-xl text-neutral-800 dark:text-neutral-200" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Mains GS Writing</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
                  Practice mains essay responses with character timers and evaluate copies using model answers.
                </p>
              </div>
              <Link href="/answer-writing" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white mt-8 flex items-center gap-1">
                Write Essay <Icon icon="tabler:arrow-right" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-250 dark:hover:border-neutral-800 transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-6">
                  <Icon icon="tabler:news" className="text-xl text-neutral-800 dark:text-neutral-200" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Curated Editorials</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
                  Read national editorials and news briefs categorized by UPSC syllabus topics (GS1-4).
                </p>
              </div>
              <Link href="/articles" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white mt-8 flex items-center gap-1">
                Read News <Icon icon="tabler:arrow-right" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-250 dark:hover:border-neutral-800 transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-6">
                  <Icon icon="tabler:cards" className="text-xl text-neutral-800 dark:text-neutral-200" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Revision Hub</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
                  Flip flashcards, download syllabus revision sheets, and browse previous years questions database.
                </p>
              </div>
              <Link href="/study" className="text-xs font-semibold text-neutral-400 hover:text-black dark:hover:text-white mt-8 flex items-center gap-1">
                Study Now <Icon icon="tabler:arrow-right" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Quote Banner */}
      <section className="py-24 border-t border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
        <div className="container mx-auto lg:max-w-screen-md px-6 text-center">
          <Icon icon="tabler:quote" className="text-4xl text-neutral-350 dark:text-neutral-755 mx-auto mb-6" />
          <blockquote className="text-xl sm:text-2xl font-light italic leading-relaxed text-neutral-800 dark:text-neutral-200 mb-6">
            "Success is the sum of small efforts, repeated day in and day out."
          </blockquote>
          <cite className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Robert Collier
          </cite>
        </div>
      </section>
    </main>
  );
}