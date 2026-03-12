import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Allowed origins for CORS — add your production domain(s) here
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  "http://localhost:3001",
  "http://localhost:3000",
]);

function getCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return origin;
  }
  // Allow same-origin requests (no origin header)
  return null;
}

// Performance and security middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers for all routes
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Vary", "Accept-Encoding, Origin");

    const corsOrigin = getCorsOrigin(request);
    if (corsOrigin) {
      response.headers.set("Access-Control-Allow-Origin", corsOrigin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // Add cache headers for static assets
  if (
    request.nextUrl.pathname.match(
      /\.(jpg|jpeg|png|gif|svg|ico|webp|avif|woff|woff2|ttf|eot)$/
    )
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }

  return response;
}

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
