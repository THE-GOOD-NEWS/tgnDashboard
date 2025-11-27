import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PROD = process.env.NODE_ENV === 'production';

export async function GET(request: Request) {
  try {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set('token', '', {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: COOKIE_DOMAIN ? 'none' : 'lax',
      domain: COOKIE_DOMAIN,
      path: '/',
      maxAge: 0,
    });
    return res;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
