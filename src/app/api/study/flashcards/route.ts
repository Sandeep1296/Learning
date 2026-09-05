import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Flashcard } from "@/models/Study";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const query: any = {};
  if (tag) query.tags = tag;
  const cards = await Flashcard.find(query).sort({ createdAt: -1 });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const card = await Flashcard.create(body);
  return NextResponse.json(card);
}
