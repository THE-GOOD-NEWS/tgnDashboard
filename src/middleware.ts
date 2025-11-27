import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/utils/auth';

const CANONICAL_HOST = process.env.CANONICAL_HOST;

export function middleware(request: NextRequest) {
  if (CANONICAL_HOST && request.nextUrl.hostname !== CANONICAL_HOST) {
    const url = new URL(request.url);
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url);
  }
  const protectedRoutes = ["/pages"];
  const publicRoutes = ["/login", "/create-admin"];
  const path = request.nextUrl.pathname;

  // Allow access to static files and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/images') ||
    path.startsWith('/api') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access public route with token
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
    console.log('Skipping redirect for testing, token:', token);
    return NextResponse.next();  }

  // Protect homepage (/) if no token
  if (path === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow access to all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
