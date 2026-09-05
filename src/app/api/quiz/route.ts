import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const quiz = await Quiz.findOne({ date, isPublished: true });
  if (!quiz) return NextResponse.json({ error: "No quiz for today" }, { status: 404 });
  return NextResponse.json(quiz);
}
