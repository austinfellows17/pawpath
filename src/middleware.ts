import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const AUTH_RATE_LIMITS: { path: string; scope: string; limit: number; windowMs: number }[] = [
  {
    path: "/api/auth/callback/credentials",
    scope: "login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  {
    path: "/api/auth/signin/credentials",
    scope: "login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
];

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/messages", "/admin"];

function isProtectedAppRoute(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST") {
    for (const rule of AUTH_RATE_LIMITS) {
      if (pathname === rule.path) {
        const ip = getClientIp(request);
        const result = checkRateLimit({
          key: `${rule.scope}:${ip}`,
          limit: rule.limit,
          windowMs: rule.windowMs,
        });

        if (!result.ok) {
          return rateLimitResponse(result.retryAfterMs);
        }
      }
    }
  }

  if (
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
    isProtectedAppRoute(pathname)
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!token.emailVerified) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "EmailNotVerified");
      if (typeof token.email === "string") {
        loginUrl.searchParams.set("email", token.email);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/callback/:path*",
    "/api/auth/signin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/messages",
    "/messages/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
