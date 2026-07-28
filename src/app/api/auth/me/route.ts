import { NextResponse } from "next/server";
import UserModel from "@/app/models/userModel";
import { ConnectDB } from "@/config/db";
import { getToken, verifyToken } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    let token = getToken();
    if (!token) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await ConnectDB();
    const user = await UserModel.findById(decoded.id).select(
      "_id username email role firstName lastName imageURL",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
