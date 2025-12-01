import { NextResponse } from "next/server";
import UserModel from "@/app/models/userModel";
import { ConnectDB } from "@/config/db";
import { generateToken } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    await ConnectDB();

    const { username, password } = await request.json();

    // Find user
    const user = await UserModel.findOne({ username, role: "admin" });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Generate token
    const token = generateToken({ id: user._id, username: user.username });

    // Create response
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 },
    );

    // Determine cookie domain only when it matches the current host
    const { hostname } = new URL(request.url);
    const envDomain = process.env.NEXT_PUBLIC_DOMAIN;
    const cookieDomain = envDomain && (hostname === envDomain || hostname.endsWith(`.${envDomain}`))
      ? envDomain
      : undefined;

    // Set token in cookie with proper configuration
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      domain: cookieDomain,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
