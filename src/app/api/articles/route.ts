import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Article } from "@/models/Article";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const type = searchParams.get("type");
  const query: any = {};
  if (tag) query.tags = tag;
  if (type) query.type = type;
  const articles = await Article.find(query).sort({ publishedAt: -1 }).limit(50);
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const article = await Article.create(body);
  return NextResponse.json(article);
}
