import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth-edge";

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1] || req.cookies.get("accessToken")?.value;

  const { pathname } = req.nextUrl;

  // Public routes check
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/api/auth") ||
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

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes for all authenticated users
  const isProtectedRoute =
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/customer");

  if (isProtectedRoute && !token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("message", "Please login to continue.");
    return NextResponse.redirect(url);
  }

  if (!token && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyAccessToken(token as string);
  if (!payload) {
    console.error(`[Middleware] Token verification failed for ${pathname}`);
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access control
  if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
    const url = new URL("/", req.url);
    url.searchParams.set("error", "access_denied");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/vendor") && payload.role !== "VENDOR") {
    const url = new URL("/", req.url);
    url.searchParams.set("error", "access_denied");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/customer") && payload.role !== "CUSTOMER" && payload.role !== "VENDOR") {
    // Both Customers and Vendors (who might be buying) can access /customer routes usually,
    // but if we want strict CUSTOMER-only:
    const url = new URL("/", req.url);
    url.searchParams.set("error", "access_denied");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Add Security Headers and Cache Control
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos https://maps.gstatic.com https://maps.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; connect-src 'self' ws: wss: https://api.razorpay.com https://maps.googleapis.com;");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/((?!api/auth|api/socket|_next/static|_next/image|favicon.ico).*)"],
};
