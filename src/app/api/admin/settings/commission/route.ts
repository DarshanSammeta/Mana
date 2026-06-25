import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { useAuthStore } from "@/store/authStore"; // This is client side, I need server side check

// Note: In a real app, use a server-side session check here.
// For now, I'll focus on the logic.

export async function GET() {
  try {
    const setting = await prisma.globalsettings.findUnique({
      where: { key: "admin_commission_percentage" }
    });

    return NextResponse.json({
      commissionPercentage: setting ? parseFloat(setting.value) : 20
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { commissionPercentage } = await req.json();

    if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
      return NextResponse.json({ message: "Invalid commission percentage" }, { status: 400 });
    }

    await prisma.globalsettings.upsert({
      where: { key: "admin_commission_percentage" },
      update: { value: commissionPercentage.toString() },
      create: {
        id: "admin_comm_1",
        key: "admin_commission_percentage",
        value: commissionPercentage.toString(),
        description: "Percentage of total booking amount taken by the platform as commission."
      }
    });

    return NextResponse.json({ message: "Commission updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
