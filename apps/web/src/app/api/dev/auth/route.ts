import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role') || 'SECRETARY';
  const next = request.nextUrl.searchParams.get('next') || '/admin/performance';
  const payload = {
    userId: 'usr-sec-1',
    role,
    societyId: 'soc-palm-grove',
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set('access_token', token, {
    path: '/',
    maxAge: 86400,
    httpOnly: false,
    sameSite: 'lax',
  });
  return response;
}
