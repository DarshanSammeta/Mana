import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

const SENSITIVE_KEYS = [
  "password",
  "otp",
  "token",
  "accessToken",
  "refreshToken",
  "aadhaarNumber",
  "panNumber",
  "bankDetails",
  "gstNumber",
  "cvv",
  "card_number",
  "mobileNumber",
  "mobile",
  "accountNumber",
];

function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in newObj) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      newObj[key] = "********";
    } else if (typeof newObj[key] === "object") {
      newObj[key] = redactSensitiveData(newObj[key]);
    }
  }
  return newObj;
}

export async function GET(req: Request) {
  return withErrorHandler(async (innerReq) => {
    const admin = await checkAdmin(innerReq!);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const bookingId = searchParams.get("bookingId");
    const vendorId = searchParams.get("vendorId");
    const customerProfileId = searchParams.get("customerProfileId");
    const moduleName = searchParams.get("module");
    const action = searchParams.get("action");
    const performedByRole = searchParams.get("role");

    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (vendorId) where.vendorId = vendorId;
    if (customerProfileId) where.customerProfileId = customerProfileId;
    if (moduleName) where.module = moduleName;
    if (action) where.action = action;
    if (performedByRole) where.performedByRole = performedByRole;

    const logs = await prisma.audit_log.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.audit_log.count({ where });

    // Redact sensitive data before sending to client
    const redactedLogs = logs.map((log) => ({
      ...log,
      oldValue: redactSensitiveData(log.oldValue),
      newValue: redactSensitiveData(log.newValue),
      metadata: redactSensitiveData(log.metadata),
    }));

    return NextResponse.json({ logs: redactedLogs, total });
  }, req);
}
