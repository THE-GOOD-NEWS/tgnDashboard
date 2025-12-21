import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let upstream = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!upstream.ok || !upstream.headers.get("content-type")) {
      upstream = await fetch(url, { method: "GET", redirect: "follow" });
    }

    const contentType = upstream.headers.get("content-type") || null;
    const contentLength = upstream.headers.get("content-length") || null;
    const finalUrl = upstream.url || url;

    return NextResponse.json({
      contentType,
      contentLength,
      finalUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch media info" },
      { status: 500 },
    );
  }
}

