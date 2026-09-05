import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { StudyNote } from "@/models/Study";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const query: any = {};
  if (tag) query.tags = tag;
  const notes = await StudyNote.find(query).sort({ createdAt: -1 });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const note = await StudyNote.create(body);
  return NextResponse.json(note);
}
