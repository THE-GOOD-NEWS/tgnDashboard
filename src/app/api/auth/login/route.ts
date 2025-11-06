import { NextResponse } from 'next/server';
import UserModel from '@/app/models/userModel';
import { ConnectDB } from '@/config/db';
import { generateToken } from '@/utils/auth';

export async function POST(request: Request) {
  try {
    await ConnectDB();

    const { username, password } = await request.json();

    // Find user
    const user = await UserModel.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({ id: user._id, username: user.username });

    // Create response
    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    );

    // Set token in cookie with proper configuration
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60,  // 30 minutes
      domain: process.env.NEXT_PUBLIC_DOMAIN || undefined
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 