import { NextResponse } from 'next/server';
import { removeToken } from '@/utils/auth';
import { Router } from 'next/router';

export async function GET(request:Request) {
  try {
    // Remove token from cookies
    removeToken();
    return NextResponse.redirect(new URL('/login', request.url));

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 