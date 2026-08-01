import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary.server";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { createHash } from "crypto";

/**
 * Validates the file signature (Magic Bytes) against the expected MIME type.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const hex = buffer.slice(0, 8).toString("hex").toUpperCase();

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return hex.startsWith("FFD8FF");
  }
  if (mimeType === "image/png") {
    return hex.startsWith("89504E47");
  }
  if (mimeType === "image/webp") {
    return hex.startsWith("52494646"); // RIFF
  }
  if (mimeType === "application/pdf") {
    return hex.startsWith("25504446"); // %PDF
  }
  return false;
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ message: "No file uploaded" }, { status: 400 });

    // 1. Extension Check
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];
    if (!ext || !allowedExts.includes(ext)) {
        return NextResponse.json({ message: "Invalid file extension" }, { status: 400 });
    }

    // 2. MIME Type Check
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid MIME type" }, { status: 400 });
    }

    // 3. File Size Check (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File too large (Max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Deep Validation: Magic Bytes (File Signature)
    if (!validateMagicBytes(buffer, file.type)) {
        logger.error(`[SECURITY] File signature mismatch for user ${payload.userId}`, {
            fileName: file.name,
            mime: file.type,
            hex: buffer.slice(0, 8).toString("hex")
        });
        return NextResponse.json({ message: "File content does not match its type" }, { status: 400 });
    }

    const cloudinary = getCloudinary();
    if (!cloudinary) return NextResponse.json({ message: "Upload service unavailable" }, { status: 503 });

    // 5. Secure & Deterministic Public ID
    // Format: user_[userId]/[hash_of_filename_and_timestamp]
    const fileHash = createHash("sha256").update(file.name + Date.now()).digest("hex").slice(0, 16);
    const publicId = `user_${payload.userId}/${fileHash}`;

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: file.type === "application/pdf" ? "raw" : "image",
        folder: "mana_events",
        public_id: publicId,
        overwrite: false,
        unique_filename: true
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
  }, req);
}
