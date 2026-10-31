import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY'];

/** Public routes that support the /hi locale prefix */
const PUBLIC_LOCALE_ROUTES = [
  '/', '/features', '/how-it-works', '/about', '/faq', '/contact',
  '/transparency', '/download', '/privacy', '/terms', '/testimonials',
  '/data-deletion', '/track',
];

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

  // ──────────────────────────────────────────────────────────
  // 0. LOCALE-AWARE ROUTING for public pages
  //    /hi        → rewrite to / with lang=hi cookie
  //    /hi/faq    → rewrite to /faq with lang=hi cookie
  //    Preserves the /hi URL in the browser address bar.
  // ──────────────────────────────────────────────────────────
  if (pathname === '/hi' || pathname.startsWith('/hi/')) {
    const strippedPath = pathname === '/hi' ? '/' : pathname.slice(3); // remove "/hi"

    // Only rewrite known public routes; let other /hi/... 404 normally
    const isPublicRoute = PUBLIC_LOCALE_ROUTES.some(
      (r) => strippedPath === r || (r !== '/' && strippedPath.startsWith(r + '/'))
    );

    if (isPublicRoute) {
      const rewriteUrl = new URL(strippedPath, request.url);
      rewriteUrl.search = request.nextUrl.search; // preserve query params
      const response = NextResponse.rewrite(rewriteUrl);
      // Set lang cookie to hi (1 year) so the client picks up Hindi
      const oneYear = 365 * 24 * 60 * 60;
      response.cookies.set('lang', 'hi', {
        path: '/',
        maxAge: oneYear,
        sameSite: 'lax',
      });
      response.cookies.set('NEXT_LOCALE', 'hi', {
        path: '/',
        maxAge: oneYear,
        sameSite: 'lax',
      });
      return response;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 1. PUBLIC ROUTES (bypass all auth checks)
  // ──────────────────────────────────────────────────────────
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/activate') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/how-it-works') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/transparency') ||
    pathname.startsWith('/download') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/testimonials') ||
    pathname.startsWith('/data-deletion') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/403') ||
    pathname.startsWith('/session-expired') ||
    pathname.startsWith('/society') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  // Explicitly disabled / stubbed registration routes
  if (pathname.startsWith('/register-society') || pathname.startsWith('/join')) {
    return NextResponse.rewrite(new URL('/404', request.url), { status: 404 });
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ──────────────────────────────────────────────────────────
  // 2. TOKEN EXTRACTION & VERIFICATION
  // ──────────────────────────────────────────────────────────
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) {
    const expiredUrl = new URL('/session-expired', request.url);
    expiredUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(expiredUrl);
  }

  // ──────────────────────────────────────────────────────────
  // 3. ROLE-BASED ACCESS CONTROL (RBAC)
  // ──────────────────────────────────────────────────────────
  const userRole = payload.role;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Protect /guard routes
  if (pathname.startsWith('/guard')) {
    if (userRole !== 'GUARD' && !ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Protect /vendor routes
  if (pathname.startsWith('/vendor')) {
    if (userRole !== 'VENDOR' && !ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Protect /app (resident) routes
  if (pathname.startsWith('/app')) {
    if (userRole !== 'RESIDENT' && !ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
