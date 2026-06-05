import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { RescueRequest, serializeRequest } from "@/lib/models";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

const USER_SELECT = "name email phone image";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const role = session.user.role;
  const userId = session.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (role === "DRIVER") {
    filter.driverId = userId;
    if (status) filter.status = status;
  } else if (role === "MECHANIC") {
    filter.status = status
      ? status
      : { $in: ["PENDING", "ACCEPTED", "ON_THE_WAY"] };
  } else if (role === "ADMIN") {
    if (status) filter.status = status;
  }

  const requests = await RescueRequest.find(filter)
    .populate("driverId", USER_SELECT)
    .populate("mechanicId", USER_SELECT)
    .sort({ createdAt: -1 })
    .lean();

  // Normalize populated fields to driver/mechanic keys
  const normalized = requests.map((r) => normalizeDoc(r));
  return NextResponse.json(normalized);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Only drivers can create requests" }, { status: 403 });
  }

  try {
    const {
      description,
      issueType,
      latitude,
      longitude,
      address,
      locationDescription,
      willProvideDirections,
    } = await request.json();

    if (!description || !issueType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hasCoords = latitude != null && longitude != null;
    const hasManualLocation =
      !!willProvideDirections && !!locationDescription?.trim();

    // A request needs either GPS coordinates or a manual location description
    // (when the driver opts to guide the mechanic with directions).
    if (!hasCoords && !hasManualLocation) {
      return NextResponse.json(
        { error: "Set your location on the map, or describe it and choose to provide directions." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for existing active request
    const active = await RescueRequest.findOne({
      driverId: session.user.id,
      status: { $in: ["PENDING", "ACCEPTED", "ON_THE_WAY"] },
    });
    if (active) {
      return NextResponse.json({ error: "You already have an active request" }, { status: 409 });
    }

    const doc = await RescueRequest.create({
      description,
      issueType,
      latitude: hasCoords ? latitude : undefined,
      longitude: hasCoords ? longitude : undefined,
      address: address ?? undefined,
      locationDescription: locationDescription?.trim() || undefined,
      willProvideDirections: !!willProvideDirections,
      driverId: session.user.id,
    });

    const populated = await RescueRequest.findById(doc._id)
      .populate("driverId", USER_SELECT)
      .populate("mechanicId", USER_SELECT)
      .lean();

    const result = normalizeDoc(populated!);

    await pusherServer.trigger(CHANNELS.REQUESTS, EVENTS.NEW_REQUEST, result);
    await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_REQUEST, result);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[CREATE_REQUEST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDoc(r: any) {
  const driver = r.driverId ?? {};
  const mechanic = r.mechanicId ?? null;
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

export { serializeRequest, normalizeDoc };
