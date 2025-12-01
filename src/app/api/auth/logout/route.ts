import { NextResponse } from "next/server";

function buildLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const { hostname } = new URL(request.url);
  const envDomain = process.env.NEXT_PUBLIC_DOMAIN;
  const cookieDomain =
    envDomain && (hostname === envDomain || hostname.endsWith(`.${envDomain}`))
      ? envDomain
      : undefined;
  // Explicitly clear the cookie on the response with matching options
  response.cookies.set({
    name: "token",
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: cookieDomain,
  });
  return response;
}

export async function GET(request: Request) {
  try {
    return buildLogoutResponse(request);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return buildLogoutResponse(request);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
