import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary.server";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

const cloudinary = getCloudinary();

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      logger.warn("Unauthorized upload attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      logger.warn("Forbidden upload attempt: invalid token");
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    logger.info("File upload started", {
        userId: payload.userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
    });

    // Security: File type validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      logger.warn("Invalid file type upload attempt", { userId: payload.userId, fileType: file.type });
      return NextResponse.json({ message: "Invalid file type. Allowed: jpg, png, webp, pdf" }, { status: 400 });
    }

    // Security: File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.warn("File too large upload attempt", { userId: payload.userId, fileSize: file.size });
      return NextResponse.json({ message: "File too large. Max 5MB allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: "auto",
        folder: "mana_events",
        // Sanitize filename or use a secure random one (Cloudinary handles this mostly, but we can specify public_id)
      }, (error, result) => {
        if (error) {
          logger.error("Cloudinary upload failed", { error, userId: payload.userId });
          reject(error);
        }
        else resolve(result);
      }).end(buffer);
    });

    logger.info("File upload successful", { userId: payload.userId, publicId: (result as any).public_id });

    return NextResponse.json(result);
  });
}
