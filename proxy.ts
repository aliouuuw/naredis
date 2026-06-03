import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cookie presence only — not a cryptographic session check.
 * RSC routes must call requireAuthContext(). Full proxy validation: PLAT-010.
 */
const protectedPrefixes = [
  "/declarations",
  "/clients",
  "/dossiers",
  "/dashboard",
  "/settings",
  "/transactions",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/declarations/:path*",
    "/clients/:path*",
    "/dossiers/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/transactions/:path*",
  ],
};
