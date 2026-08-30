import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/utils/auth';

export function middleware(request: NextRequest) {
  const protectedRoutes = ["/pages"];
  const publicRoutes = ["/login", "/create-admin"];
  const path = request.nextUrl.pathname;

  // Allow access to static files and public API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/images') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/workshop-ticket') ||
    path.startsWith('/api/workshop-checkin') ||
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

  // Protect homepage (/) if no token
  if (path === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Immediate Edge redirection for guestWriter role
  if (token) {
    try {
      const payloadSegment = token.split('.')[1];
      if (payloadSegment) {
        const decodedStr = Buffer.from(payloadSegment, 'base64').toString('utf8');
        const payload = JSON.parse(decodedStr);
        if (payload?.role === 'guestWriter' && !path.startsWith('/pages/articles') && !path.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/pages/articles', request.url));
        }
      }
    } catch (e) {
      // Ignore token parse error
    }
  }

  // If trying to access public route with token
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 