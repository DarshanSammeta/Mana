import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendorprofile: true,
        user: true,
        bookingitem: {
          include: {
            service: true,
            Renamedpackage: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // In a production app, we would use a library like 'jspdf' or 'pdfkit'
    // to generate a PDF and stream it.
    // For now, we return the data that the frontend uses for the "Print" view.

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
