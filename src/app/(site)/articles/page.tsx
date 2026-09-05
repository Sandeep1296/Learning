"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import toast from "react-hot-toast";

type Article = {
  _id: string;
  title: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  type: "news" | "report" | "editorial";
  tags: string[];
  summary?: string;
  publishedAt: string;
};

export default function ArticlesPage() {
  const { data: session, status } = useSession();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/articles")
        .then((res) => {
          if (!res.ok) throw new Error("Could not load current affairs feed.");
          return res.json();
        })
        .then((data) => {
          setArticles(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Updating news feed...</span>
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
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Please sign in to read daily current affairs, editorials, and reports.</p>
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

  // Filters
  const filteredArticles = articles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || (item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
        
        {/* Header & Type Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Daily Current Affairs
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
              Stay updated with daily editorials, national reports, and news analysis tagged to the UPSC syllabus.
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-full border border-neutral-200/40 dark:border-neutral-850/40 self-start">
            {["all", "editorial", "news", "report"].map((tType) => (
              <button
                key={tType}
                onClick={() => setSelectedType(tType)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  selectedType === tType
                    ? "bg-white text-black dark:bg-black dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {tType}
              </button>
            ))}
          </div>
        </div>

        {/* Global Toolbar: Filter Input */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search current affairs topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 text-xs bg-white border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-850 rounded-2xl focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-neutral-200 shadow-sm"
            />
            <Icon icon="tabler:search" className="absolute left-4.5 top-3.5 text-neutral-400 text-base" />
          </div>
        </div>

        {/* Articles Feed list */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((article) => (
              <div
                key={article._id}
                onClick={() => setReadingArticle(article)}
                className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:border-neutral-200 dark:hover:border-neutral-800"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                      {article.type}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      {article.source || "Feed Source"}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-snug tracking-tight mb-3">
                    {article.title}
                  </h2>

                  <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    {article.summary || article.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900/60 mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                    {article.tags.length > 2 && (
                      <span className="text-[8px] font-bold text-neutral-400 px-1 py-0.5">
                        +{article.tags.length - 2} more
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                    Read Article <Icon icon="tabler:arrow-right" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8">
            <Icon icon="tabler:news" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No news articles found matching the search criteria.</p>
          </div>
        )}

        {/* Modal Overlay Article Reader */}
        {readingArticle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-900 w-full max-w-3xl max-h-[85vh] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col overflow-y-auto relative animate-scale-up">
              
              {/* Close Button */}
              <button
                onClick={() => setReadingArticle(null)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Close Reader"
              >
                <Icon icon="tabler:x" className="text-2xl" />
              </button>

              {/* Tag Header Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                  {readingArticle.type}
                </span>
                <span className="text-neutral-400">
                  Published: {new Date(readingArticle.publishedAt).toLocaleDateString()}
                </span>
                <span className="text-neutral-350">|</span>
                <span className="text-neutral-400">
                  Source: {readingArticle.source || "Feed Source"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight mb-6">
                {readingArticle.title}
              </h1>

              {/* Tag links */}
              <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-900">
                {readingArticle.tags.map((tag, idx) => (
                  <span key={idx} className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 px-2.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Summary quote if editorial */}
              {readingArticle.summary && (
                <div className="mb-6 bg-neutral-50 dark:bg-neutral-900/40 border-l-2 border-black dark:border-white p-4 rounded-r-xl text-neutral-600 dark:text-neutral-400 text-xs italic">
                  <span className="font-semibold block not-italic uppercase tracking-wider text-[10px] text-neutral-400 mb-1">
                    Summary Excerpt:
                  </span>
                  "{readingArticle.summary}"
                </div>
              )}

              {/* Main Content Body */}
              <div className="text-neutral-800 dark:text-neutral-250 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-light prose dark:prose-invert">
                {readingArticle.content}
              </div>

              {/* Link Out Action */}
              {readingArticle.sourceUrl && (
                <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-900 flex justify-end">
                  <a
                    href={readingArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Read on official source website <Icon icon="tabler:external-link" />
                  </a>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
