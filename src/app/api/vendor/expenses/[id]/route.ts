import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
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
    const expense = await prisma.expense.update({
      where: {
        id: id,
        vendorProfileId: vendorProfile.id
      },
      data: {
        title: body.title,
        amount: body.amount,
        category: body.category,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
        reference: body.reference,
        updatedAt: new Date()
      }
    });

    logger.info("Expense updated", { expenseId: expense.id, vendorId: vendorProfile.id });
    return NextResponse.json(expense);
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
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

    await prisma.expense.delete({
      where: {
        id: id,
        vendorProfileId: vendorProfile.id
      }
    });

    logger.info("Expense deleted", { expenseId: id, vendorId: vendorProfile.id });
    return NextResponse.json({ message: "Expense deleted successfully" });
  });
}
