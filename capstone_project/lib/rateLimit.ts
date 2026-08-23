import { NextRequest } from "next/server";

interface RateLimitInfo {
  count: number;
  resetAt: Date;
}

// In-memory store for rate limiting data
// Key is the user's IP address
const rateLimitMap = new Map<string, RateLimitInfo>();

interface RateLimitOptions {
  windowMs?: number;    // Time window in milliseconds
  maxRequests?: number; // Maximum allowed requests per window
}

/**
 * Basic in-memory rate limiter for API routes.
 * Tracks requests by IP address and auto-cleans expired entries.
 * 
 * @param request The incoming Next.js request
 * @param options Configuration options for window size and max requests
 * @returns Rate limit status and headers
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): { success: boolean; remaining: number; resetAt: Date } {
  // Default to 60 seconds and 30 requests per window
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 30;

  // Extract IP address from trusted proxy headers, fallback to unknown if not present.
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  const now = Date.now();
  
  // Auto-cleanup: remove expired entries to prevent memory leaks
  for (const [key, info] of rateLimitMap.entries()) {
    if (info.resetAt.getTime() < now) {
      rateLimitMap.delete(key);
    }
  }

  // Get or initialize rate limit info for this IP
  let info = rateLimitMap.get(ip);
  if (!info) {
    info = {
      count: 0,
      resetAt: new Date(now + windowMs),
    };
    rateLimitMap.set(ip, info);
  }

  // Increment request count
  info.count += 1;
  
  // Calculate remaining requests and success status
  const remaining = Math.max(0, maxRequests - info.count);
  const success = info.count <= maxRequests;

  return {
    success,
    remaining,
    resetAt: info.resetAt,
  };
}
