import { NextResponse } from "next/server";

function buildLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  // Explicitly clear the cookie on the response with matching options
  response.cookies.set({
    name: "token",
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
  });
  return response;
}

export async function GET(request: Request) {
  try {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Explicitly clear the cookie on the response with matching options
    response.cookies.set({
      name: "token",
      value: "",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,

      // domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
    });
    return response;
    // return buildLogoutResponse(request);
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
    // return buildLogoutResponse(request);
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Explicitly clear the cookie on the response with matching options
    response.cookies.set({
      name: "token",
      value: "",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,

      // domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
