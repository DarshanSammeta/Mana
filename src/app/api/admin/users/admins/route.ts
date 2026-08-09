import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const rows = admins.map(a => ({
        id: a.id,
        username: a.email, // Dashboard uses 'username'
        role: a.role.toLowerCase(),
        created_at: a.createdAt
    }));

    return NextResponse.json(rows);
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const admin = await verifyAdminRequest(req);
    if (!admin || admin.role !== "ADMIN") {
        return NextResponse.json({ message: "Only Admins can grant access" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, role, mobileNumber } = body;

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
        data: {
            email: username,
            fullName: username.split('@')[0],
            password: hashedPassword,
            mobileNumber: mobileNumber || `ADMIN-${Date.now()}`,
            role: (role?.toUpperCase() === "ADMIN" ? "ADMIN" : "ADMIN") as any,
        }
    });

    return NextResponse.json({
        id: newUser.id,
        username: newUser.email,
        role: newUser.role.toLowerCase(),
        created_at: newUser.createdAt
    });
  }, req);
}
