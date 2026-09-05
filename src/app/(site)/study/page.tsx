"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import toast from "react-hot-toast";

type Flashcard = {
  _id: string;
  front: string;
  back: string;
  tags: string[];
};

type PYQ = {
  _id: string;
  question: string;
  year: number;
  paper: string;
  type: "prelims" | "mains";
  options?: string[];
  correctIndex?: number;
  answer?: string;
  explanation?: string;
  tags: string[];
};

type StudyNote = {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  paper?: string;
};

export default function StudyHubPage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<"flashcards" | "pyq" | "notes">("flashcards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  // Materials states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Active details
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [expandedPyq, setExpandedPyq] = useState<Record<string, boolean>>({});
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      Promise.all([
        fetch("/api/study/flashcards").then((r) => r.json()),
        fetch("/api/study/pyq").then((r) => r.json()),
        fetch("/api/study/notes").then((r) => r.json()),
      ])
        .then(([fcData, pyqData, notesData]) => {
          setFlashcards(fcData);
          setPyqs(pyqData);
          setNotes(notesData);
          if (notesData.length > 0) setActiveNote(notesData[0]);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Could not load study materials.");
          setLoading(false);
        });
    }
  }, [status]);

  // Aggregate all unique tags from items to display in filter list
  const getUniqueTags = () => {
    const allTags = new Set<string>();
    if (activeTab === "flashcards") {
      flashcards.forEach((item) => item.tags?.forEach((t) => allTags.add(t)));
    } else if (activeTab === "pyq") {
      pyqs.forEach((item) => item.tags?.forEach((t) => allTags.add(t)));
    } else {
      notes.forEach((item) => item.tags?.forEach((t) => allTags.add(t)));
    }
    return ["all", ...Array.from(allTags)];
  };

  const handleFlipCard = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTogglePyq = (id: string) => {
    setExpandedPyq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Setting up revision hub...</span>
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
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Please sign in to access mock flashcards, revision notes, and past exams.</p>
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

  // Filter content
  const filteredFlashcards = flashcards.filter((item) => {
    const matchesSearch = item.front.toLowerCase().includes(searchQuery.toLowerCase()) || item.back.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const filteredPyqs = pyqs.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const filteredNotes = notes.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      {/* Persisted Card flipping flip-card CSS animation values */}
      <style dangerouslySetInnerHTML={{__html: `
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}} />

      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
        
        {/* Hub Header & Navigation Tab Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Revision Study Hub
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
              Revise concepts using active recall flashcards, past exams, and syllabus notes.
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-full border border-neutral-200/40 dark:border-neutral-800/40 self-start">
            <button
              onClick={() => { setActiveTab("flashcards"); setSelectedTag("all"); }}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "flashcards"
                  ? "bg-white text-black dark:bg-black dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              Flashcards
            </button>
            <button
              onClick={() => { setActiveTab("pyq"); setSelectedTag("all"); }}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "pyq"
                  ? "bg-white text-black dark:bg-black dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              PYQ Database
            </button>
            <button
              onClick={() => { setActiveTab("notes"); setSelectedTag("all"); }}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "notes"
                  ? "bg-white text-black dark:bg-black dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              Study Notes
            </button>
          </div>
        </div>

        {/* Global Toolbar: Filters & Keyword Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Scrollable list of tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {getUniqueTags().map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-955 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`}
              >
                {tag === "all" ? "All Subjects" : tag}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-xs bg-white border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-850 rounded-full focus:outline-none focus:border-black dark:focus:border-white text-neutral-800 dark:text-neutral-200 shadow-sm"
            />
            <Icon icon="tabler:search" className="absolute left-3.5 top-3 text-neutral-400 text-base" />
          </div>
        </div>

        {/* TAB CONTENTS */}

        {/* Tab 1: Flashcards Grid */}
        {activeTab === "flashcards" && (
          filteredFlashcards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFlashcards.map((card) => {
                const isFlipped = !!flippedCards[card._id];
                return (
                  <div
                    key={card._id}
                    onClick={() => handleFlipCard(card._id)}
                    className={`flip-card w-full h-[220px] cursor-pointer ${isFlipped ? "flipped" : ""}`}
                  >
                    <div className="flip-card-inner">
                      {/* Front Card Panel */}
                      <div className="flip-card-front bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-900/60 shadow-sm">
                        <div className="flex flex-wrap gap-1 mb-4 justify-center">
                          {card.tags?.map((t, idx) => (
                            <span key={idx} className="text-[8px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 text-neutral-500 px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm font-bold text-center text-neutral-850 dark:text-white leading-relaxed">
                          {card.front}
                        </p>
                        <span className="text-[10px] text-neutral-400 mt-6 flex items-center gap-1">
                          <Icon icon="tabler:rotate" /> Click to reveal
                        </span>
                      </div>

                      {/* Back Card Panel */}
                      <div className="flip-card-back bg-neutral-900 text-white dark:bg-white dark:text-black border border-neutral-800 dark:border-neutral-200 shadow-md">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500 mb-4">
                          Definition / Answer
                        </span>
                        <p className="text-sm font-medium text-center leading-relaxed max-w-[90%] whitespace-pre-line">
                          {card.back}
                        </p>
                        <span className="text-[9px] text-neutral-400 mt-6 flex items-center gap-1">
                          <Icon icon="tabler:rotate" /> Flip back
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8">
              <Icon icon="tabler:cards" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No flashcards found matching the filters.</p>
            </div>
          )
        )}

        {/* Tab 2: PYQs Accordion list */}
        {activeTab === "pyq" && (
          filteredPyqs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredPyqs.map((q) => {
                const isExpanded = !!expandedPyq[q._id];
                return (
                  <div
                    key={q._id}
                    className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-900/60 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black dark:text-white uppercase">
                          {q.type}
                        </span>
                        <span>•</span>
                        <span>Year {q.year} ({q.paper})</span>
                      </div>
                      <div className="flex gap-1">
                        {q.tags.map((t, idx) => (
                          <span key={idx} className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-500 border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                      {q.question}
                    </h3>

                    {/* Options list if Prelims */}
                    {q.type === "prelims" && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctIndex === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-colors ${
                                isExpanded && isCorrect
                                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-semibold"
                                  : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-900 text-neutral-600 dark:text-neutral-400"
                              }`}
                            >
                              <span className="font-mono text-neutral-400">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-900/60 mt-2">
                      <button
                        onClick={() => handleTogglePyq(q._id)}
                        className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-6 py-2 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
                      >
                        {isExpanded ? (
                          <>Hide Solution <Icon icon="tabler:chevron-up" /></>
                        ) : (
                          <>Show Solution <Icon icon="tabler:chevron-down" /></>
                        )}
                      </button>
                    </div>

                    {/* Explanatory solutions */}
                    {isExpanded && (
                      <div className="mt-2 bg-neutral-50 dark:bg-neutral-900/35 border border-neutral-100 dark:border-neutral-900 rounded-2xl p-5 text-xs flex flex-col gap-3">
                        {q.type === "mains" && q.answer && (
                          <div className="leading-relaxed">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1 text-sm">Model Answer Summary:</span>
                            <div className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{q.answer}</div>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="leading-relaxed">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Explanation & Context:</span>
                            <div className="text-neutral-650 dark:text-neutral-400">{q.explanation}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8">
              <Icon icon="tabler:clipboard" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No previous year questions found matching the filters.</p>
            </div>
          )
        )}

        {/* Tab 3: Study Notes Split Reader */}
        {activeTab === "notes" && (
          filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left sidebar note items */}
              <div className="lg:col-span-4 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const isActive = activeNote?._id === note._id;
                  return (
                    <button
                      key={note._id}
                      onClick={() => setActiveNote(note)}
                      className={`text-left p-5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-md"
                          : "bg-white border-neutral-150 hover:bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-900 dark:hover:bg-neutral-900 text-neutral-850 dark:text-neutral-200"
                      }`}
                    >
                      <span className={`text-[9px] uppercase font-bold tracking-wider mb-2 block ${isActive ? "text-neutral-400" : "text-neutral-400 dark:text-neutral-500"}`}>
                        {note.paper || "General Studies"} Note
                      </span>
                      <h4 className="font-bold text-xs tracking-tight truncate leading-tight">
                        {note.title}
                      </h4>
                    </button>
                  );
                })}
              </div>

              {/* Right panel reading screen */}
              <div className="lg:col-span-8 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 shadow-sm">
                {activeNote ? (
                  <div className="flex flex-col gap-4">
                    <div className="pb-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {activeNote.paper} Syllabus Note
                      </span>
                      <div className="flex gap-1">
                        {activeNote.tags.map((t, idx) => (
                          <span key={idx} className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-500">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
                      {activeNote.title}
                    </h2>
                    
                    {/* Rich text/markdown content */}
                    <div className="text-neutral-800 dark:text-neutral-250 text-sm leading-relaxed whitespace-pre-wrap mt-4 prose dark:prose-invert max-h-[400px] overflow-y-auto pr-2">
                      {activeNote.content}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Icon icon="tabler:notebook" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">Select a revision note to read.</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8">
              <Icon icon="tabler:notebook" className="text-4xl text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No revision notes found matching the filters.</p>
            </div>
          )
        )}

      </div>
    </main>
  );
}
