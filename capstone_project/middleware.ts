import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "@/lib/rateLimit";

// Public routes are allowed without authentication.
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/tickets",
  "/nearby-events",
];

// Admin routes are handled separately to check for the 'admin' role
const protectedRoutes = [
  "/dashboard",
  "/checkout",
  "/profile",
  "/tickets/new",
  "/messages",
  "/notifications",
  "/transactions",
  "/admin"
];

// Rate limit configurations for different endpoint types
const rateLimitConfigs: Record<string, { windowMs: number; maxRequests: number }> = {
  // Auth endpoints - stricter limits (5 requests per minute)
  "/api/auth/": { windowMs: 60 * 1000, maxRequests: 5 },
  // Ticket creation/update - moderate limits (10 requests per minute)
  "/api/tickets": { windowMs: 60 * 1000, maxRequests: 10 },
  // AI endpoints - stricter limits (10 requests per minute)
  "/api/ai/": { windowMs: 60 * 1000, maxRequests: 10 },
  // Default for all other API routes (30 requests per minute)
  "default": { windowMs: 60 * 1000, maxRequests: 30 },
};

function getRateLimitConfig(pathname: string): { windowMs: number; maxRequests: number } {
  for (const [prefix, config] of Object.entries(rateLimitConfigs)) {
    if (prefix !== "default" && pathname.startsWith(prefix)) {
      return config;
    }
  }
  return rateLimitConfigs["default"];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting for all API routes
  if (pathname.startsWith("/api/")) {
    const config = getRateLimitConfig(pathname);
    const rateLimitResult = rateLimit(request, config);
    
    // If rate limit is exceeded, return 429 Too Many Requests
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.getTime().toString(),
            "Retry-After": Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // Also protect dynamic route /tickets/[id]/edit.
  const isProtected =
    protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.match(/^\/tickets\/[^/]+\/edit$/);

  const isPublic = publicRoutes.some(route =>
    route === "/" ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  );

  // If the route is not protected, allow the request to proceed
  if (isPublic || !isProtected) {
    return NextResponse.next();
  }

  // Verify authentication using NextAuth's getToken
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
  });

  // If there's no valid token, redirect to the login page
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Save the original URL so we can redirect back after login
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based authorization for admin routes
  if (pathname.startsWith("/admin") && (token.role as string) !== "admin") {
    // Non-admin users are redirected to the homepage
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If authenticated and authorized, proceed with the request
  return NextResponse.next();
}

// Specify the paths where this middleware should run
export const config = {
  matcher: [
    // API routes for rate limiting
    "/api/:path*",
    // Protected pages
    "/dashboard/:path*",
    "/checkout/:path*",
    "/profile/:path*",
    "/tickets/new",
    "/tickets/:path*/edit",
    "/messages/:path*",
    "/notifications/:path*",
    "/transactions/:path*",
    "/admin/:path*",
  ]
};
