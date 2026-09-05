import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PYQ } from "@/models/Study";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const year = searchParams.get("year");
  const type = searchParams.get("type");
  const paper = searchParams.get("paper");
  const query: any = {};
  if (tag) query.tags = tag;
  if (year) query.year = Number(year);
  if (type) query.type = type;
  if (paper) query.paper = paper;
  const pyqs = await PYQ.find(query).sort({ year: -1 });
  return NextResponse.json(pyqs);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const pyq = await PYQ.create(body);
  return NextResponse.json(pyq);
}
