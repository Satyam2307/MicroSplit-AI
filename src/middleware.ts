import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

// Block sensitive file extensions & hidden dot files
const BLOCKED_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.svn/i,
  /^\/\.hg/i,
  /^\/\.DS_Store/i,
  /\.(pem|key|crt|sql|bak|backup|config|dump)$/i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Guard against probe attacks on dot files and secret files
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Access Denied', { status: 403 });
    }
  }

  // 2. Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('microsplit_admin_token')?.value;
    const authHeader = request.headers.get('authorization');

    // If no admin token or authorization bearer, redirect to login with callback
    if (!adminToken && !authHeader) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // 3. Defense-in-depth headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - icon, apple-icon, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
};
