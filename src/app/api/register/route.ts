import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  await connectDB();
  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });
  return NextResponse.json({ success: true });
}
