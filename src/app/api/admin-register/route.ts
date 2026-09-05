import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const { name, email, password, secretKey } = await req.json();

  if (!name || !email || !password || !secretKey) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Validate the admin secret key
  const validSecret = process.env.ADMIN_REGISTRATION_SECRET;
  if (!validSecret || secretKey !== validSecret) {
    return NextResponse.json({ error: "Invalid admin secret key" }, { status: 403 });
  }

  await connectDB();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, role: "admin" });

  return NextResponse.json({ success: true });
}
