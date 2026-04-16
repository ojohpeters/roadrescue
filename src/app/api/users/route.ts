import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { User, RescueRequest } from "@/lib/models";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const users = await User.find({}, "name email role phone isAvailable createdAt").lean();

  // Attach request counts
  const withCounts = await Promise.all(
    users.map(async (u) => {
      const [driverRequests, mechanicJobs] = await Promise.all([
        RescueRequest.countDocuments({ driverId: u._id }),
        RescueRequest.countDocuments({ mechanicId: u._id }),
      ]);
      return {
        id: String(u._id),
        name: u.name ?? null,
        email: u.email,
        role: u.role,
        phone: u.phone ?? null,
        isAvailable: u.isAvailable,
        createdAt: u.createdAt,
        _count: { driverRequests, mechanicJobs },
      };
    })
  );

  return NextResponse.json(withCounts);
}
