import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(subcategories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}
