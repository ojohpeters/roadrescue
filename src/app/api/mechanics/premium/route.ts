import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { User, RescueRequest } from "@/lib/models";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const profile = {
      id: String(user._id),
      name: user.name ?? null,
      email: user.email,
      phone: user.phone ?? null,
      image: user.image ?? null,
      isAvailable: user.isAvailable,
      isPremium: user.isPremium ?? false,
      serviceRadius: user.serviceRadius ?? 10,
      responseTime: user.responseTime ?? 30,
      latitude: user.latitude ?? undefined,
      longitude: user.longitude ?? undefined,
      address: user.address ?? null,
    };

    // Get pending/active requests within service radius
    const requests = await RescueRequest.find({
      status: { $in: ["PENDING", "ACCEPTED", "ON_THE_WAY"] },
    })
      .populate("driverId", "name email phone image")
      .sort({ createdAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = requests.map((r: any) => {
      const driver = r.driverId ?? {};
      return {
        id: String(r._id),
        status: r.status,
        description: r.description,
        issueType: r.issueType,
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
        address: r.address ?? null,
        locationDescription: r.locationDescription ?? null,
        willProvideDirections: r.willProvideDirections ?? false,
        createdAt: r.createdAt,
        driverId: String(driver._id ?? r.driverId),
        mechanicId: r.mechanicId ? String(r.mechanicId) : null,
        driver: {
          id: String(driver._id ?? driver),
          name: driver.name ?? null,
          email: driver.email ?? "",
          phone: driver.phone ?? null,
          image: driver.image ?? null,
        },
      };
    });

    return NextResponse.json({ profile, requests: normalized });
  } catch (error) {
    console.error("[PREMIUM_MECHANIC_GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MECHANIC") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowed = [
      "isPremium", "isAvailable", "serviceRadius", "responseTime",
      "latitude", "longitude", "address", "phone", "name",
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(session.user.id, update, { new: true })
      .select("name email phone isPremium serviceRadius responseTime latitude longitude address isAvailable")
      .lean();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: String(updated._id),
      name: updated.name ?? null,
      email: updated.email,
      phone: updated.phone ?? null,
      isPremium: updated.isPremium ?? false,
      serviceRadius: updated.serviceRadius ?? 10,
      responseTime: updated.responseTime ?? 30,
      latitude: updated.latitude ?? undefined,
      longitude: updated.longitude ?? undefined,
      address: updated.address ?? null,
      isAvailable: updated.isAvailable,
    });
  } catch (error) {
    console.error("[PREMIUM_MECHANIC_PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
