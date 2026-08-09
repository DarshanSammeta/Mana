import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth-edge";
import { getCorsHeaders, handleOptions } from "@/lib/cors";

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const correlationId = req.headers.get("x-correlation-id") || requestId;
  const start = Date.now();
  const origin = req.headers.get("origin");
  const { pathname } = req.nextUrl;

  console.log(`[TRACE] Middleware Entry | ${pathname} | ID: ${requestId} | Method: ${req.method} | Origin: ${origin}`);

  // 1. Handle Preflight
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    console.log(`[TRACE] Middleware: Handled OPTIONS for ${pathname}`);
    return optionsResponse;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-correlation-id", correlationId);

  // Security: Strip incoming user identity headers
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-user-status");

  const token = req.headers.get("authorization")?.split(" ")[1] || req.cookies.get("accessToken")?.value;

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/ready") ||
    pathname.startsWith("/api/inngest") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/maps") ||
    pathname.startsWith("/api/socket") ||
    pathname.startsWith("/api/marketplace") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/event-types") ||
    pathname.startsWith("/api/cities") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml");

  let response: NextResponse;

  try {
    if (isPublicRoute) {
      response = NextResponse.next({
        request: { headers: requestHeaders },
      });
    } else {
      // Protected routes logic
      if (!token) {
          console.warn(`[TRACE] Middleware: Unauthorized access to ${pathname} (No token)`);
          if (pathname.startsWith("/api/")) {
              return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: getCorsHeaders(origin) });
          }
          const url = new URL("/login", req.url);
          url.searchParams.set("message", "Please login to continue.");
          return NextResponse.redirect(url);
      }

      const payload = await verifyAccessToken(token);

      if (!payload) {
          // Allow refresh endpoint to handle expired access tokens
          if (pathname === "/api/auth/refresh") {
              return NextResponse.next({
                  request: { headers: requestHeaders },
              });
          }

          console.warn(`[TRACE] Middleware: Invalid/Expired token for ${pathname}`);

          if (pathname.startsWith("/api/")) {
              return NextResponse.json(
                  { message: "Unauthorized" },
                  { status: 401, headers: getCorsHeaders(origin) }
              );
          }

          return NextResponse.redirect(new URL("/login", req.url));
      }

      // Pass auth details to API routes
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-role", payload.role);
      if (payload.verificationStatus) {
          requestHeaders.set("x-user-status", payload.verificationStatus);
      }

      // RBAC for Pages
      if (!pathname.startsWith("/api/")) {
          if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
              console.warn(`[TRACE] Middleware: Forbidden access to admin page ${pathname} for role ${payload.role}`);
              return NextResponse.redirect(new URL("/", req.url));
          }
      }

      response = NextResponse.next({
          request: { headers: requestHeaders },
      });
    }
  } catch (error: any) {
    console.error(`[TRACE] Middleware Error for ${pathname}:`, error.message);
    return NextResponse.json({ message: "Internal Auth Error" }, { status: 500, headers: getCorsHeaders(origin) });
  }

  // Apply Global Headers
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");

  return response;
}

export const config = {
  matcher: ["/((?!manifest.json|icons/|_next/static|_next/image|favicon.ico).*)"],
};
