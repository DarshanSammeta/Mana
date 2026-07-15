import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const service = await prisma.service.findUnique({
        where: { id: id },
        select: {
          id: true,
          title: true,
          description: true,
          basePrice: true,
          serviceTypeId: true,
          vendorProfileId: true,
          vendorprofile: {
            select: {
              userId: true
            }
          },
          servicetype: {
            select: {
              id: true,
              name: true,
              subcategory: {
                select: {
                  id: true,
                  name: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      eventtype: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
    });

    if (!service || service.vendorprofile?.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to view this service" }, { status: 403 });
    }

    return NextResponse.json(service);
  } catch (error) {
    logger.error("Vendor Service GET Error", { error, serviceId: id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const service = await prisma.service.findUnique({
        where: { id: id },
        select: {
          vendorprofile: {
            select: { userId: true }
          }
        }
    });

    if (!service || service.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to update this service" }, { status: 403 });
    }

    const updatedService = await prisma.service.update({
      where: { id: id },
      data: {
        title: body.title,
        description: body.description,
        serviceTypeId: body.serviceTypeId,
        basePrice: body.basePrice,
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    logger.error("Vendor Service PUT Error", { error, serviceId: id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const service = await prisma.service.findUnique({
        where: { id: id },
        select: {
          vendorprofile: {
            select: { userId: true }
          }
        }
    });

    if (!service || service.vendorprofile.userId !== payload.userId) {
        return NextResponse.json({ message: "Not authorized to delete this service" }, { status: 403 });
    }

    // This might fail if there are active bookings, we should handle that
    await prisma.service.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error) {
    logger.error("Vendor Service DELETE Error", { error, serviceId: id });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 400 }
    );
  }
}
