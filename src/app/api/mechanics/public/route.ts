import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();
    // Premium mechanics are always listed (they're a call-directly fallback),
    // plus any regular mechanic currently marked available.
    const mechanics = await User.find(
      { role: "MECHANIC", $or: [{ isPremium: true }, { isAvailable: true }] },
      "name email phone isPremium isAvailable serviceRadius responseTime latitude longitude address"
    ).lean();

    const result = mechanics
      .map((m) => ({
        id: String(m._id),
        name: m.name ?? null,
        phone: m.phone ?? null,
        email: m.email,
        latitude: m.latitude ?? undefined,
        longitude: m.longitude ?? undefined,
        address: m.address ?? null,
        isPremium: m.isPremium ?? false,
        isAvailable: m.isAvailable ?? false,
        serviceRadius: m.serviceRadius ?? undefined,
        responseTime: m.responseTime ?? null,
      }))
      // Premium first, then by fastest stated response time
      .sort((a, b) => {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return (a.responseTime ?? 999) - (b.responseTime ?? 999);
      });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
