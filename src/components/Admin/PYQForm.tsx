"use client";
import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import { ALL_TAGS } from "@/lib/syllabus";

const inputStyle = "w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-4 py-2.5 text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition placeholder:text-neutral-400";
const labelStyle = "text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1";

export default function AdminPYQForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    question: "",
    year: new Date().getFullYear(),
    paper: "Prelims GS1",
    type: "prelims" as "prelims" | "mains",
    options: ["", "", "", ""],
    correctIndex: 0,
    answer: "",
    explanation: "",
    tags: [] as string[],
  });

  const toggleTag = (slug: string) => {
    const tags = form.tags.includes(slug)
      ? form.tags.filter((t) => t !== slug)
      : [...form.tags, slug];
    setForm((p) => ({ ...p, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = form.type === "prelims"
        ? { ...form, answer: undefined }
        : { ...form, options: undefined, correctIndex: undefined };
      const res = await fetch("/api/admin/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Could not save PYQ.");
      toast.success("PYQ saved successfully!");
      setForm({
        question: "", year: new Date().getFullYear(), paper: "Prelims GS1",
        type: "prelims", options: ["", "", "", ""], correctIndex: 0,
        answer: "", explanation: "", tags: [],
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Add Previous Year Question</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelStyle}>Year</label>
          <input type="number" required value={form.year}
            onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
            className={inputStyle} />
        </div>
        <div>
          <label className={labelStyle}>Paper</label>
          <select value={form.paper} onChange={(e) => setForm((p) => ({ ...p, paper: e.target.value }))} className={inputStyle}>
            <option>Prelims GS1</option>
            <option>Prelims CSAT</option>
            <option>GS1</option><option>GS2</option><option>GS3</option><option>GS4</option>
            <option>Essay</option>
          </select>
        </div>
        <div>
          <label className={labelStyle}>Type</label>
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))} className={inputStyle}>
            <option value="prelims">Prelims MCQ</option>
            <option value="mains">Mains Descriptive</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelStyle}>Question</label>
        <textarea required rows={3} value={form.question}
          onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
          placeholder="Enter the full question text..."
          className={`${inputStyle} resize-none`} />
      </div>

      {form.type === "prelims" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.options.map((opt, i) => (
            <div key={i}>
              <label className={labelStyle}>Option {String.fromCharCode(65 + i)}</label>
              <input type="text" required value={opt}
                onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = e.target.value;
                  setForm((p) => ({ ...p, options: opts }));
                }}
                className={inputStyle} />
            </div>
          ))}
          <div>
            <label className={labelStyle}>Correct Answer</label>
            <select value={form.correctIndex}
              onChange={(e) => setForm((p) => ({ ...p, correctIndex: Number(e.target.value) }))}
              className={inputStyle}>
              {["A","B","C","D"].map((l, i) => <option key={i} value={i}>Option {l}</option>)}
            </select>
          </div>
        </div>
      )}

      {form.type === "mains" && (
        <div>
          <label className={labelStyle}>Model Answer Summary</label>
          <textarea rows={4} value={form.answer}
            onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
            placeholder="Key points of the model answer..."
            className={`${inputStyle} resize-none`} />
        </div>
      )}

      <div>
        <label className={labelStyle}>Explanation</label>
        <textarea rows={2} value={form.explanation}
          onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
          placeholder="Explanation / context..."
          className={`${inputStyle} resize-none`} />
      </div>

      <div>
        <label className={labelStyle}>Syllabus Tags</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-h-[140px] overflow-y-auto">
          {ALL_TAGS.map((tag) => (
            <button type="button" key={tag.slug} onClick={() => toggleTag(tag.slug)}
              className={`text-left text-[10px] p-2 rounded border flex items-center gap-2 transition-all ${
                form.tags.includes(tag.slug)
                  ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black font-semibold"
                  : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800 text-neutral-500"
              }`}>
              <Icon icon={form.tags.includes(tag.slug) ? "tabler:checkbox" : "tabler:square"} />
              <span className="truncate">{tag.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900">
        <button type="submit" disabled={loading}
          className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm">
          {loading ? "Saving..." : "Save PYQ"}
        </button>
      </div>
    </form>
  );
}
