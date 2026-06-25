import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

  try {
    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    // In a real app, you'd have a VendorTeam or Staff model.
    // For now, returning dummy data as per the UI design
    const team = [
        {
          id: "1",
          name: "Alex Rivera",
          role: "Manager",
          status: "Active",
          email: "alex@manaevents.com",
          phone: "+91 98271 28192",
          joined: "12 Jan 2026",
          avatar: "AR"
        },
        {
          id: "2",
          name: "Sarah Chen",
          role: "Photographer",
          status: "On Site",
          email: "sarah@manaevents.com",
          phone: "+91 98271 28193",
          joined: "15 Jan 2026",
          avatar: "SC"
        },
        {
          id: "3",
          name: "David Kumar",
          role: "Decorator",
          status: "Active",
          email: "david@manaevents.com",
          phone: "+91 98271 28194",
          joined: "20 Jan 2026",
          avatar: "DK"
        }
    ];

    return NextResponse.json(team);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
