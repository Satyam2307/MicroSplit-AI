
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BLOCKED_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.svn/i,
  /^\/\.hg/i,
  /^\/\.DS_Store/i,
  /\.(pem|key|crt|sql|bak|backup|config|dump)$/i,
];

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  // Block requests for sensitive files
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse("Access Denied", {
        status: 403,
      });
    }
  }

  // Defense-in-depth response header
  const response = NextResponse.next();

  response.headers.set(
    "X-Permitted-Cross-Domain-Policies",
    "none"
  );

  return response;
});

export const config = {
  matcher: [
    "/squads/:path*",
    "/splits/:path*",
    "/evidence/:path*",
    "/payouts/:path*",
    "/ledger/:path*",
    "/statements/:path*",
    "/runs/:path*",
    "/admin/:path*",
  ],
};