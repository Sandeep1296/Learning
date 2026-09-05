import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnswerPrompt } from "@/models/AnswerWriting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const prompt = await AnswerPrompt.findOne({ date, isPublished: true });
  if (!prompt) return NextResponse.json({ error: "No prompt for today" }, { status: 404 });
  return NextResponse.json(prompt);
}
