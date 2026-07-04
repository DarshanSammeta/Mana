import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const expenses = await prisma.expense.findMany({
      where: { vendorProfileId: vendorProfile.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(expenses);
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        vendorProfileId: vendorProfile.id,
        title: body.title,
        amount: body.amount,
        category: body.category,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status || "PAID",
        reference: body.reference,
        updatedAt: new Date()
      }
    });

    logger.info("Expense created", { expenseId: expense.id, vendorId: vendorProfile.id });
    return NextResponse.json(expense, { status: 201 });
  });
}
