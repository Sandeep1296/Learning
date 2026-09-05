"use client";

import React from "react";
import { AdminPanel } from "@/components/Admin/AdminPanel";

export default function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: "quizzes" | "prompts" | "articles" | "flashcards" | "notes" | "pyq" };
}) {
  const defaultTab = searchParams?.tab || "quizzes";
  return <AdminPanel defaultTab={defaultTab} />;
}
