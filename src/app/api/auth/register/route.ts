import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models";
import type { Role } from "@/lib/models";

export async function POST(request: Request) {
  try {
    const { name, email, password, role, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: (role as Role) ?? "DRIVER",
      phone: phone ?? undefined,
    });

    return NextResponse.json(
      { id: String(user._id), email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
