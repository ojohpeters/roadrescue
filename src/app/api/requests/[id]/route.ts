import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { RescueRequest } from "@/lib/models";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import type { RequestStatus } from "@/lib/models";

type Params = { params: Promise<{ id: string }> };

const USER_SELECT = "name email phone image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDoc(r: any) {
  const driver = r.driverId ?? {};
  const mechanic = r.mechanicId ?? null;
  return {
    id: String(r._id),
    status: r.status,
    description: r.description,
    issueType: r.issueType,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    acceptedAt: r.acceptedAt ?? null,
    completedAt: r.completedAt ?? null,
    driverId: String(r.driverId?._id ?? r.driverId),
    mechanicId: r.mechanicId ? String(r.mechanicId?._id ?? r.mechanicId) : null,
    driver: {
      id: String(driver._id ?? driver),
      name: driver.name ?? null,
      email: driver.email ?? "",
      phone: driver.phone ?? null,
      image: driver.image ?? null,
    },
    mechanic: mechanic
      ? {
          id: String(mechanic._id ?? mechanic),
          name: mechanic.name ?? null,
          email: mechanic.email ?? "",
          phone: mechanic.phone ?? null,
          image: mechanic.image ?? null,
          isPremium: mechanic.isPremium ?? false,
        }
      : null,
  };
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const req = await RescueRequest.findById(id)
    .populate("driverId", USER_SELECT)
    .populate("mechanicId", USER_SELECT)
    .lean();

  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(normalizeDoc(req));
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = (await request.json()) as { status: RequestStatus };

  try {
    await connectDB();
    const existing = await RescueRequest.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session.user.role;
    const userId = session.user.id;

    // Permission checks
    if (role === "MECHANIC") {
      if (status === "ACCEPTED" && existing.status !== "PENDING") {
        return NextResponse.json({ error: "Request is no longer available" }, { status: 409 });
      }
      if (
        (status === "ON_THE_WAY" || status === "COMPLETED") &&
        String(existing.mechanicId) !== userId
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    if (role === "DRIVER" && status === "CANCELLED") {
      if (String(existing.driverId) !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { status };
    if (status === "ACCEPTED") {
      updateData.mechanicId = userId;
      updateData.acceptedAt = new Date();
    }
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const updated = await RescueRequest.findByIdAndUpdate(id, updateData, { new: true })
      .populate("driverId", USER_SELECT)
      .populate("mechanicId", USER_SELECT)
      .lean();

    const result = normalizeDoc(updated!);

    const event =
      status === "ACCEPTED" ? EVENTS.REQUEST_ACCEPTED :
      status === "COMPLETED" ? EVENTS.REQUEST_COMPLETED :
      status === "CANCELLED" ? EVENTS.REQUEST_CANCELLED :
      EVENTS.REQUEST_UPDATED;

    await Promise.all([
      pusherServer.trigger(CHANNELS.REQUEST(id), event, result),
      pusherServer.trigger(CHANNELS.REQUESTS, event, result),
      pusherServer.trigger(CHANNELS.ADMIN, event, result),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PATCH_REQUEST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
