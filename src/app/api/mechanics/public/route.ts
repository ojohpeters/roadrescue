import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();
    const mechanics = await User.find(
      { role: "MECHANIC", isAvailable: true },
      "name email phone isPremium serviceRadius responseTime latitude longitude address"
    ).lean();

    const result = mechanics.map((m) => ({
      id: String(m._id),
      name: m.name ?? null,
      phone: m.phone ?? null,
      email: m.email,
      latitude: m.latitude ?? undefined,
      longitude: m.longitude ?? undefined,
      address: m.address ?? null,
      isPremium: m.isPremium ?? false,
      serviceRadius: m.serviceRadius ?? undefined,
      responseTime: m.responseTime ?? null,
    }));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
