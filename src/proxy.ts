
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.svn/i,
  /^\/\.hg/i,
  /^\/\.DS_Store/i,
  /^\/admin(\/.*)?$/i,
  /\.(pem|key|crt|sql|bak|backup|config|dump)$/i,
];

export function proxy(request: NextRequest) {
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
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)",
  ],
};