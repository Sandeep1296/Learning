import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Flashcard } from "@/models/Study";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const cards = await Flashcard.find().sort({ createdAt: -1 });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const card = await Flashcard.create({ ...body, createdBy: (session.user as any).id });
  return NextResponse.json(card);
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id, ...update } = await req.json();
  const card = await Flashcard.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json(card);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await req.json();
  await Flashcard.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
