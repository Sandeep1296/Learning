import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin")
    return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const quizzes = await Quiz.find().sort({ date: -1 });
  return NextResponse.json(quizzes);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const quiz = await Quiz.create({ ...body, createdBy: (session.user as any).id });
  return NextResponse.json(quiz);
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id, ...update } = await req.json();
  const quiz = await Quiz.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json(quiz);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await req.json();
  await Quiz.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
