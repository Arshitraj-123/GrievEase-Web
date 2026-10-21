import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY'];

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Feature Flag: /register-society
  if (pathname.startsWith('/register-society')) {
    const isFeatureEnabled =
      process.env.FEATURE_REGISTER_SOCIETY === 'true' ||
      process.env.NEXT_PUBLIC_FEATURE_REGISTER_SOCIETY === 'true';
    if (!isFeatureEnabled) {
      return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 });
    }
  }

  // Retrieve JWT access token from cookie (handles both HTTP and HTTPS __Host- prefix)
  const token =
    request.cookies.get('__Host-access_token')?.value ||
    request.cookies.get('access_token')?.value;

  const payload = token ? parseJwtPayload(token) : null;
  const isAuthenticated = Boolean(payload && payload.userId && payload.role);
  const userRole = payload?.role;

  // 2. Redirect logged-in users away from /login
  if (pathname === '/login' && isAuthenticated) {
    if (userRole === 'RESIDENT') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    if (ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (userRole === 'GUARD') {
      return NextResponse.redirect(new URL('/guard', request.url));
    }
    if (userRole === 'VENDOR') {
      return NextResponse.redirect(new URL('/vendor', request.url));
    }
    if (userRole === 'INVITED') {
      return NextResponse.redirect(new URL('/activate', request.url));
    }
  }

  // 3. Protected Shell: /app (Resident only)
  if (pathname.startsWith('/app')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (ADMIN_ROLES.includes(userRole)) {
      // Admins cannot reach resident /app routes per requirements
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (userRole !== 'RESIDENT') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // 4. Protected Shell: /admin (Admin roles only)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!ADMIN_ROLES.includes(userRole)) {
      // Non-admin cannot reach /admin
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // 5. Protected Shell: /guard (Guard only)
  if (pathname.startsWith('/guard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'GUARD') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // 6. Protected Shell: /vendor (Vendor only)
  if (pathname.startsWith('/vendor')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'VENDOR') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register-society/:path*',
    '/app/:path*',
    '/admin/:path*',
    '/guard/:path*',
    '/vendor/:path*',
  ],
};
