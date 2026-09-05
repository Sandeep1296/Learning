import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AnswerPrompt } from "@/models/AnswerWriting";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const prompts = await AnswerPrompt.find().sort({ date: -1 });
  return NextResponse.json(prompts);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const prompt = await AnswerPrompt.create({ ...body, createdBy: (session.user as any).id });
  return NextResponse.json(prompt);
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id, ...update } = await req.json();
  const prompt = await AnswerPrompt.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json(prompt);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await req.json();
  await AnswerPrompt.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
