import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    let filename = searchParams.get("filename") || "download";

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    // Sanitize filename
    filename = filename.replace(/[/\\?%*:|"<>]/g, "");
    if (!filename) filename = "download";

    const upstream = await fetch(url, {
      // Ensure server-side fetch, no CORS restrictions apply here
      method: "GET",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch media: ${upstream.status} ${upstream.statusText}`,
        },
        { status: upstream.status || 500 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const mapExt = (ct: string) => {
      const m: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/bmp": "bmp",
        "image/svg+xml": "svg",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/ogg": "ogg",
        "application/pdf": "pdf",
      };
      return m[ct.toLowerCase()] || "";
    };
    const ensureExt = (name: string, ct: string) => {
      const ext = mapExt(ct);
      if (!ext) return name;
      const lower = name.toLowerCase();
      if (lower.endsWith("." + ext)) return name;
      if (/\.[a-z0-9]+$/.test(lower)) return name;
      return `${name}.${ext}`;
    };
    filename = ensureExt(filename, contentType);
    const arrayBuffer = await upstream.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":
          "private, max-age=0, no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected error while downloading media" },
      { status: 500 },
    );
  }
}
