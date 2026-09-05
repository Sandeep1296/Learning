"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import toast from "react-hot-toast";
import { ALL_TAGS } from "@/lib/syllabus";

export function AdminPanel({
  defaultTab = "quizzes",
}: {
  defaultTab?: "quizzes" | "prompts" | "articles" | "flashcards" | "notes" | "pyq";
}) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"quizzes" | "prompts" | "articles" | "flashcards" | "notes" | "pyq">(defaultTab);
  const [loading, setLoading] = useState(false);

  // AI Quiz Auto-Generator state
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // 1. QUIZ FORM STATE
  const [quizForm, setQuizForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    isPublished: true,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
        tags: [] as string[],
      },
    ],
  });

  // 2. PROMPT FORM STATE
  const [promptForm, setPromptForm] = useState({
    question: "",
    date: new Date().toISOString().split("T")[0],
    paper: "GS1",
    wordLimit: 250,
    idealPoints: [""] as string[],
    isPublished: true,
  });

  // 3. ARTICLE FORM STATE
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    source: "",
    sourceUrl: "",
    type: "news",
    summary: "",
    tags: [] as string[],
  });

  // 4. FLASHCARD FORM STATE
  const [flashcardForm, setFlashcardForm] = useState({
    front: "",
    back: "",
    tags: [] as string[],
  });

  // 5. NOTES FORM STATE
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    paper: "GS1",
  });

  // 6. PYQ FORM STATE
  const [pyqForm, setPyqForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    year: 2023,
    paper: "GS1",
    tags: [] as string[],
  });

  // Access check
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-200 animate-spin border-t-black dark:border-neutral-800 dark:border-t-white"></div>
          <span className="text-sm text-neutral-500 font-medium">Authorizing credentials...</span>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user && (session.user as any).role === "admin";

  if (status === "unauthenticated" || !isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="tabler:shield-lock" className="text-3xl text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Unauthorized Access</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
            Access to this portal is restricted to system administrators.
          </p>
          <Link
            href="/dashboard"
            className="w-full inline-block bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 py-3 rounded-full text-sm font-medium transition-all"
          >
            Go to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- FORM HANDLERS ---
  const handleAddQuizQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", tags: [] },
      ],
    }));
  };

  const handleRemoveQuizQuestion = (qIdx: number) => {
    if (quizForm.questions.length <= 1) return;
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx),
    }));
  };

  const handleQuizQuestionChange = (qIdx: number, field: string, value: any) => {
    const updated = [...quizForm.questions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setQuizForm((prev) => ({ ...prev, questions: updated }));
  };

  const handleQuizOptionChange = (qIdx: number, optIdx: number, value: string) => {
    const updatedQuestions = [...quizForm.questions];
    const updatedOptions = [...updatedQuestions[qIdx].options];
    updatedOptions[optIdx] = value;
    updatedQuestions[qIdx] = { ...updatedQuestions[qIdx], options: updatedOptions };
    setQuizForm((prev) => ({ ...prev, questions: updatedQuestions }));
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizForm),
      });
      if (!res.ok) throw new Error("Could not publish new quiz.");
      toast.success("Successfully published daily prelims quiz!");
      setQuizForm({
        title: "",
        date: new Date().toISOString().split("T")[0],
        isPublished: true,
        questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", tags: [] }],
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIdealPoint = () => {
    setPromptForm((prev) => ({ ...prev, idealPoints: [...prev.idealPoints, ""] }));
  };

  const handleRemoveIdealPoint = (pIdx: number) => {
    if (promptForm.idealPoints.length <= 1) return;
    setPromptForm((prev) => ({ ...prev, idealPoints: prev.idealPoints.filter((_, idx) => idx !== pIdx) }));
  };

  const handleIdealPointChange = (pIdx: number, value: string) => {
    const updated = [...promptForm.idealPoints];
    updated[pIdx] = value;
    setPromptForm((prev) => ({ ...prev, idealPoints: updated }));
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptForm),
      });
      if (!res.ok) throw new Error("Could not publish Mains prompt.");
      toast.success("Successfully published daily mains prompt!");
      setPromptForm({
        question: "",
        date: new Date().toISOString().split("T")[0],
        paper: "GS1",
        wordLimit: 250,
        idealPoints: [""],
        isPublished: true,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormTag = (formName: "article" | "flashcard" | "note", tag: string) => {
    if (formName === "article") {
      const tags = articleForm.tags.includes(tag)
        ? articleForm.tags.filter((t) => t !== tag)
        : [...articleForm.tags, tag];
      setArticleForm((prev) => ({ ...prev, tags }));
    } else if (formName === "flashcard") {
      const tags = flashcardForm.tags.includes(tag)
        ? flashcardForm.tags.filter((t) => t !== tag)
        : [...flashcardForm.tags, tag];
      setFlashcardForm((prev) => ({ ...prev, tags }));
    } else if (formName === "note") {
      const tags = noteForm.tags.includes(tag)
        ? noteForm.tags.filter((t) => t !== tag)
        : [...noteForm.tags, tag];
      setNoteForm((prev) => ({ ...prev, tags }));
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleForm),
      });
      if (!res.ok) throw new Error("Could not publish article.");
      toast.success("Successfully published current affairs article!");
      setArticleForm({ title: "", content: "", source: "", sourceUrl: "", type: "news", summary: "", tags: [] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlashcardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flashcardForm),
      });
      if (!res.ok) throw new Error("Could not publish flashcard.");
      toast.success("Successfully published study flashcard!");
      setFlashcardForm({ front: "", back: "", tags: [] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      if (!res.ok) throw new Error("Could not publish syllabus note.");
      toast.success("Successfully published syllabus study note!");
      setNoteForm({ title: "", content: "", tags: [], paper: "GS1" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePyqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pyqForm),
      });
      if (!res.ok) throw new Error("Could not publish Previous Year Question.");
      toast.success("Successfully published Previous Year Question!");
      setPyqForm({
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
        year: 2023,
        paper: "GS1",
        tags: [],
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildQuestionsFromAI = (data: any) =>
    data.questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tags: q.tags?.length > 0 ? q.tags : [aiTopic.toLowerCase().replace(/\s+/g, "-")],
    }));

  const handleGenerateQuizWithAI = async () => {
    if (!aiTopic.trim()) { toast.error("Please enter a topic."); return; }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, numQuestions: 5, difficulty: "medium" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI quiz generation failed.");
      if (data.questions?.length > 0) {
        setQuizForm((prev) => ({
          ...prev,
          title: prev.title || `AI Quiz: ${aiTopic}`,
          questions: buildQuestionsFromAI(data),
        }));
        toast.success(`Generated ${data.questions.length} MCQs via ${data.provider || "AI"}. Review and publish below.`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateAndPublish = async () => {
    if (!aiTopic.trim()) { toast.error("Please enter a topic."); return; }
    setAiGenerating(true);
    try {
      const aiRes = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, numQuestions: 5, difficulty: "medium" }),
      });
      const data = await aiRes.json();
      if (!aiRes.ok) throw new Error(data.error || "AI quiz generation failed.");
      if (!data.questions?.length) throw new Error("AI returned no questions.");

      const payload = {
        title: `AI Quiz: ${aiTopic}`,
        date: new Date().toISOString().split("T")[0],
        isPublished: true,
        questions: buildQuestionsFromAI(data),
      };
      const pubRes = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!pubRes.ok) throw new Error("Failed to publish quiz.");
      toast.success(`Published ${data.questions.length} MCQs on "${aiTopic}" via ${data.provider || "AI"}!`);
      setAiTopic("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const inputStyle = "w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-4 py-2.5 text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition placeholder:text-neutral-400";
  const labelStyle = "text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1";

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black pt-32 pb-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6">
        
        {/* Admin Header & Selector navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-900">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Icon icon="tabler:settings" /> Administrator Control Panel
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
              Publish new mock quizzes, writing prompts, current affairs editorials, PYQs, and study notes.
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-full border border-neutral-200/40 dark:border-neutral-850/40 self-start overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: "quizzes", label: "Quizzes" },
              { id: "prompts", label: "GS Prompts" },
              { id: "articles", label: "Articles" },
              { id: "flashcards", label: "Flashcards" },
              { id: "notes", label: "Study Notes" },
              { id: "pyq", label: "PYQs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-black dark:bg-black dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Forms Container */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-3xl p-8 sm:p-10 shadow-sm max-w-4xl mx-auto">
          
          {/* TAB 1: QUIZZES */}
          {activeTab === "quizzes" && (
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-5 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="tabler:sparkles" className="text-purple-600 dark:text-purple-400 text-lg" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">AI Auto Quiz Generator</h3>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                  Generate 5 UPSC Prelims MCQs instantly on any topic using local AI and pre-fill the quiz form below.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Monetary Policy & Inflation..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="flex-1 rounded-xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-neutral-900 px-4 py-2 text-xs text-black dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateQuizWithAI}
                    disabled={aiGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon icon="tabler:sparkles" /> Generate Questions
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAndPublish}
                    disabled={aiGenerating}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Icon icon="tabler:rocket" /> Generate & Publish
                      </>
                    )}
                  </button>
                </div>
              </div>

              <form onSubmit={handleQuizSubmit} className="flex flex-col gap-6">
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish Daily Prelims Quiz</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Quiz Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daily Practice: Economy & History"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Publish Date</label>
                    <input
                      type="date"
                      required
                      value={quizForm.date}
                      onChange={(e) => setQuizForm((p) => ({ ...p, date: e.target.value }))}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Questions List</h3>
                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="text-xs font-semibold text-black dark:text-white hover:underline flex items-center gap-1"
                    >
                      <Icon icon="tabler:plus" /> Add Question
                    </button>
                  </div>

                  {quizForm.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-neutral-50 dark:bg-neutral-900/40 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-900 flex flex-col gap-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveQuizQuestion(qIdx)}
                        className="absolute top-4 right-4 text-neutral-400 hover:text-red-500"
                      >
                        <Icon icon="tabler:trash" className="text-lg" />
                      </button>

                      <h4 className="text-xs font-extrabold text-neutral-400">Question #{qIdx + 1}</h4>
                      
                      <div>
                        <label className={labelStyle}>Question Text</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Type question description..."
                          value={q.question}
                          onChange={(e) => handleQuizQuestionChange(qIdx, "question", e.target.value)}
                          className={`${inputStyle} resize-none`}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            <label className={labelStyle}>Option {String.fromCharCode(65 + oIdx)}</label>
                            <input
                              type="text"
                              required
                              placeholder={`Choice ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => handleQuizOptionChange(qIdx, oIdx, e.target.value)}
                              className={inputStyle}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelStyle}>Correct Answer Index</label>
                          <select
                            value={q.correctIndex}
                            onChange={(e) => handleQuizQuestionChange(qIdx, "correctIndex", Number(e.target.value))}
                            className={inputStyle}
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelStyle}>Question Subject Tags (comma separated)</label>
                          <input
                            type="text"
                            placeholder="constitution, modern-history"
                            onChange={(e) => handleQuizQuestionChange(qIdx, "tags", e.target.value.split(",").map(t => t.trim()))}
                            className={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelStyle}>Explanation</label>
                        <textarea
                          rows={2}
                          placeholder="Provide detailed explanation context for wrong attempts..."
                          value={q.explanation}
                          onChange={(e) => handleQuizQuestionChange(qIdx, "explanation", e.target.value)}
                          className={`${inputStyle} resize-none`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                  >
                    {loading ? "Publishing..." : "Publish Quiz"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MAINS PROMPTS */}
          {activeTab === "prompts" && (
            <form onSubmit={handlePromptSubmit} className="flex flex-col gap-6">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish Mains Writing Prompt</h2>
              
              <div>
                <label className={labelStyle}>GS Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Critically examine the impact of decentralized planning under the 73rd constitutional amendment..."
                  value={promptForm.question}
                  onChange={(e) => setPromptForm((p) => ({ ...p, question: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelStyle}>Subject Paper</label>
                  <select
                    value={promptForm.paper}
                    onChange={(e) => setPromptForm((p) => ({ ...p, paper: e.target.value }))}
                    className={inputStyle}
                  >
                    <option value="GS1">GS Paper I (GS1)</option>
                    <option value="GS2">GS Paper II (GS2)</option>
                    <option value="GS3">GS Paper III (GS3)</option>
                    <option value="GS4">GS Paper IV (GS4)</option>
                    <option value="Essay">Essay Paper</option>
                    <option value="Optional">Optional Subject</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Suggested Word Limit</label>
                  <input
                    type="number"
                    required
                    value={promptForm.wordLimit}
                    onChange={(e) => setPromptForm((p) => ({ ...p, wordLimit: Number(e.target.value) }))}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Publish Date</label>
                  <input
                    type="date"
                    required
                    value={promptForm.date}
                    onChange={(e) => setPromptForm((p) => ({ ...p, date: e.target.value }))}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Ideal Rubric Points (for Student Self-Evaluation)</h3>
                  <button
                    type="button"
                    onClick={handleAddIdealPoint}
                    className="text-xs font-semibold text-black dark:text-white hover:underline flex items-center gap-1"
                  >
                    <Icon icon="tabler:plus" /> Add Point
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {promptForm.idealPoints.map((pt, pIdx) => (
                    <div key={pIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`e.g. Core arguments/guideline ${pIdx + 1}`}
                        value={pt}
                        onChange={(e) => handleIdealPointChange(pIdx, e.target.value)}
                        className={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIdealPoint(pIdx)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Icon icon="tabler:trash" className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish GS Prompt"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ARTICLES */}
          {activeTab === "articles" && (
            <form onSubmit={handleArticleSubmit} className="flex flex-col gap-6">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish News & Editorials</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Headline title..."
                    value={articleForm.title}
                    onChange={(e) => setArticleForm((p) => ({ ...p, title: e.target.value }))}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Article Type</label>
                  <select
                    value={articleForm.type}
                    onChange={(e) => setArticleForm((p) => ({ ...p, type: e.target.value as any }))}
                    className={inputStyle}
                  >
                    <option value="news">Daily News Analysis</option>
                    <option value="editorial">Editorial Piece</option>
                    <option value="report">Official National Report</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Source Publication</label>
                  <input
                    type="text"
                    placeholder="e.g. The Hindu, PIB, NITI Aayog"
                    value={articleForm.source}
                    onChange={(e) => setArticleForm((p) => ({ ...p, source: e.target.value }))}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Source URL</label>
                  <input
                    type="url"
                    placeholder="Link to original publication website..."
                    value={articleForm.sourceUrl}
                    onChange={(e) => setArticleForm((p) => ({ ...p, sourceUrl: e.target.value }))}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Brief Excerpt/Summary</label>
                <input
                  type="text"
                  placeholder="Summarize the core point in 1-2 lines..."
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm((p) => ({ ...p, summary: e.target.value }))}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Main Article Content</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Draft full body text..."
                  value={articleForm.content}
                  onChange={(e) => setArticleForm((p) => ({ ...p, content: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div>
                <label className={labelStyle}>Syllabus Topic Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-h-[140px] overflow-y-auto">
                  {ALL_TAGS.map((tag) => {
                    const isChecked = articleForm.tags.includes(tag.slug);
                    return (
                      <button
                        type="button"
                        key={tag.slug}
                        onClick={() => toggleFormTag("article", tag.slug)}
                        className={`text-left text-[10px] p-2 rounded border flex items-center gap-2 transition-all ${
                          isChecked
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black font-semibold"
                            : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800 text-neutral-500"
                        }`}
                      >
                        <Icon icon={isChecked ? "tabler:checkbox" : "tabler:square"} />
                        <span className="truncate">{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish Article"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === "flashcards" && (
            <form onSubmit={handleFlashcardSubmit} className="flex flex-col gap-6">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish Active Recall Flashcards</h2>
              
              <div>
                <label className={labelStyle}>Front Question / Concept Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is Article 356?"
                  value={flashcardForm.front}
                  onChange={(e) => setFlashcardForm((p) => ({ ...p, front: e.target.value }))}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Back Answer / Explanatory Answer</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Draft answers to recall..."
                  value={flashcardForm.back}
                  onChange={(e) => setFlashcardForm((p) => ({ ...p, back: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div>
                <label className={labelStyle}>Syllabus Topic Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-h-[140px] overflow-y-auto">
                  {ALL_TAGS.map((tag) => {
                    const isChecked = flashcardForm.tags.includes(tag.slug);
                    return (
                      <button
                        type="button"
                        key={tag.slug}
                        onClick={() => toggleFormTag("flashcard", tag.slug)}
                        className={`text-left text-[10px] p-2 rounded border flex items-center gap-2 transition-all ${
                          isChecked
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black font-semibold"
                            : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800 text-neutral-500"
                        }`}
                      >
                        <Icon icon={isChecked ? "tabler:checkbox" : "tabler:square"} />
                        <span className="truncate">{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish Flashcard"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: STUDY NOTES */}
          {activeTab === "notes" && (
            <form onSubmit={handleNoteSubmit} className="flex flex-col gap-6">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish Revision Study Notes</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Note Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basic Structure Doctrine..."
                    value={noteForm.title}
                    onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>UPSC Syllabus Paper</label>
                  <select
                    value={noteForm.paper}
                    onChange={(e) => setNoteForm((p) => ({ ...p, paper: e.target.value }))}
                    className={inputStyle}
                  >
                    <option value="GS1">GS Paper I (GS1)</option>
                    <option value="GS2">GS Paper II (GS2)</option>
                    <option value="GS3">GS Paper III (GS3)</option>
                    <option value="GS4">GS Paper IV (GS4)</option>
                    <option value="Essay">Essay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Revision Note Content (Markdown format supported)</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Draft revision study note detail content..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div>
                <label className={labelStyle}>Syllabus Topic Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-h-[140px] overflow-y-auto">
                  {ALL_TAGS.map((tag) => {
                    const isChecked = noteForm.tags.includes(tag.slug);
                    return (
                      <button
                        type="button"
                        key={tag.slug}
                        onClick={() => toggleFormTag("note", tag.slug)}
                        className={`text-left text-[10px] p-2 rounded border flex items-center gap-2 transition-all ${
                          isChecked
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black font-semibold"
                            : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800 text-neutral-500"
                        }`}
                      >
                        <Icon icon={isChecked ? "tabler:checkbox" : "tabler:square"} />
                        <span className="truncate">{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish Study Note"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: PYQ */}
          {activeTab === "pyq" && (
            <form onSubmit={handlePyqSubmit} className="flex flex-col gap-6">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Publish Previous Year Question (PYQ)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>UPSC Exam Year</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2023"
                    value={pyqForm.year}
                    onChange={(e) => setPyqForm((p) => ({ ...p, year: Number(e.target.value) }))}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Paper Category</label>
                  <select
                    value={pyqForm.paper}
                    onChange={(e) => setPyqForm((p) => ({ ...p, paper: e.target.value }))}
                    className={inputStyle}
                  >
                    <option value="GS1">GS Paper I (Prelims/Mains)</option>
                    <option value="GS2">GS Paper II (CSAT/Mains)</option>
                    <option value="GS3">GS Paper III (Economy/Env)</option>
                    <option value="GS4">GS Paper IV (Ethics)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Question Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Official UPSC Question text..."
                  value={pyqForm.question}
                  onChange={(e) => setPyqForm((p) => ({ ...p, question: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pyqForm.options.map((opt, oIdx) => (
                  <div key={oIdx}>
                    <label className={labelStyle}>Option {String.fromCharCode(65 + oIdx)}</label>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...pyqForm.options];
                        opts[oIdx] = e.target.value;
                        setPyqForm((p) => ({ ...p, options: opts }));
                      }}
                      className={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Correct Answer Index</label>
                  <select
                    value={pyqForm.correctIndex}
                    onChange={(e) => setPyqForm((p) => ({ ...p, correctIndex: Number(e.target.value) }))}
                    className={inputStyle}
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Official Solution & Detailed Context Explanation</label>
                <textarea
                  rows={3}
                  placeholder="Detailed solution reference..."
                  value={pyqForm.explanation}
                  onChange={(e) => setPyqForm((p) => ({ ...p, explanation: e.target.value }))}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish PYQ"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </main>
  );
}
