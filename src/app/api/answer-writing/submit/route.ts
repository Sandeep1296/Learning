import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AnswerSubmission } from "@/models/AnswerWriting";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const submissions = await AnswerSubmission.find({ userId: (session.user as any).id })
    .populate("promptId")
    .sort({ submittedAt: -1 });
  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const wordCount = body.content.trim().split(/\s+/).length;
  const submission = await AnswerSubmission.create({
    ...body,
    userId: (session.user as any).id,
    wordCount,
  });
  return NextResponse.json(submission);
}
