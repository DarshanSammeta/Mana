import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger, { logProduction } from "./logger";
import { observability } from "./observability";
import { AlertEngine } from "./observability/alert-engine";

export interface ApiErrorResponse {
  message: string;
  error?: string;
  code?: string;
  details?: any;
  requestId?: string;
}

export function handleApiError(error: any, requestId?: string, ipAddress?: string) {
  const status = error.status || 500;
  const severity = status >= 500 ? "error" : "warn";

  logProduction(severity as any, `[API Error] ${error.message || "Unknown error"}`, {
    requestId,
    name: error.name,
    code: error.code,
    stack: error.stack,
    status,
    ipAddress
  });

  // Track metric
  observability.trackError(error.code || "API_ERROR", "API");

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation Error",
        error: "Bad Request",
        code: "VALIDATION_ERROR",
        details: error.errors,
        requestId,
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message: "A record with this value already exists.",
          error: "Conflict",
          code: "DUPLICATE_RECORD",
          requestId,
        },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: "Record not found.",
          error: "Not Found",
          code: "NOT_FOUND",
          requestId,
        },
        { status: 404 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          message: "A related record was not found (Invalid reference).",
          error: "Bad Request",
          code: "INVALID_REFERENCE",
          requestId,
        },
        { status: 400 }
      );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        message: "Invalid data provided to the database.",
        error: "Bad Request",
        code: "DB_VALIDATION_ERROR",
        requestId,
      },
      { status: 400 }
    );
  }

  const isJoseError = error.code && (error.code.startsWith("ERR_JWT_") || error.code.startsWith("ERR_JWS_"));
  const isLegacyJwtError = error.name === "JsonWebTokenError" || error.name === "TokenExpiredError";

  if (isJoseError || isLegacyJwtError) {
    const isExpired = error.code === "ERR_JWT_EXPIRED" || error.name === "TokenExpiredError";
    return NextResponse.json(
      {
        message: isExpired
          ? "Session expired. Please login again."
          : "Invalid session. Please login again.",
        error: "Unauthorized",
        code: isExpired ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
        requestId,
      },
      { status: 401 }
    );
  }

  const message = error.message || "An unexpected error occurred";

  return NextResponse.json(
    {
      message,
      error: status === 500 ? "Internal Server Error" : "Error",
      code: error.code || "INTERNAL_ERROR",
      requestId,
    },
    { status }
  );
}

export async function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>,
  req: Request | null = null
) {
  const start = Date.now();

  if (!req) {
    logger.warn("[withErrorHandler] Execution starting without a Request context. Request ID tracking and API metrics will be limited.");
  }

  const requestId = req?.headers?.get("x-request-id") || `req_${Math.random().toString(36).substring(7)}`;
  const correlationId = req?.headers?.get("x-correlation-id") || requestId;

  let pathname = "unknown";
  let method = "UNKNOWN";
  let ipAddress = "unknown";

  if (req) {
    try {
      const url = new URL(req.url);
      pathname = url.pathname;
      method = req.method;
      ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    } catch {
      // Ignore URL parsing errors
    }
  }

  const apiName = `${method} ${pathname}`;
  console.log(`[withErrorHandler] Executing ${apiName} (ID: ${requestId})`);

  try {
    const response = await handler(req as any);
    const duration = Date.now() - start;
    console.log(`[withErrorHandler] Completed ${apiName} in ${duration}ms (Status: ${response.status})`);

    // Track API Latency
    if (pathname !== "unknown") {
      observability.recordLatency(pathname, duration);
    }

    // Structured Logging for every API call
    logProduction("info", `[API Success] ${apiName}`, {
      requestId,
      correlationId,
      apiName,
      executionTime: duration,
      status: response.status,
      route: pathname,
      ipAddress
    });

    // Slow API Alert
    if (duration > 2000) {
      // Backgrounding alert to prevent further blocking
      AlertEngine.trigger("slow_api", {
        apiName,
        duration,
        requestId,
      }).catch(err => console.error("[CRITICAL] AlertEngine failed in background", err));
    }

    return response;
  } catch (error: any) {
    const duration = Date.now() - start;
    const response = handleApiError(error, requestId, ipAddress);

    logProduction("error", `[API Failure] ${apiName}`, {
      requestId,
      correlationId,
      apiName,
      executionTime: duration,
      status: response.status,
      errorCode: error.code,
      error: error.message,
      ipAddress
    });

    return response;
  }
}
