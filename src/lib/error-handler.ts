import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger from "./logger";

export interface ApiErrorResponse {
  message: string;
  error?: string;
  code?: string;
  details?: any;
}

export function handleApiError(error: any) {
  logger.error("[API Error]", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
  });

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation Error",
        error: "Bad Request",
        code: "VALIDATION_ERROR",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message: "A record with this value already exists.",
          error: "Conflict",
          code: "DUPLICATE_RECORD",
        },
        { status: 409 }
      );
    }
    // Record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: "Record not found.",
          error: "Not Found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }
  }

  // JWT or Auth errors
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return NextResponse.json(
      {
        message: "Session expired or invalid. Please login again.",
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  // Default error
  const message = error.message || "An unexpected error occurred";
  const status = error.status || 500;

  return NextResponse.json(
    {
      message,
      error: status === 500 ? "Internal Server Error" : "Error",
      code: error.code || "INTERNAL_ERROR",
    },
    { status }
  );
}

export async function withErrorHandler(handler: () => Promise<NextResponse>) {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}
