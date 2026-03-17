import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

// ─── GET  /api/workshops ─────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { briefy: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.altText": { $regex: search, $options: "i" } },
      ];
    }

    const skip = all ? 0 : (page - 1) * limit;
    const actualLimit = all ? 0 : limit;

    const [workshops, total] = await Promise.all([
      WorkshopModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(actualLimit),
      WorkshopModel.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        data: workshops,
        total,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("GET /api/workshops error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workshops" },
      { status: 500 },
    );
  }
}

// ─── POST  /api/workshops ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    // Auto-generate slug if not supplied
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    // Guarantee slug uniqueness
    const existing = await WorkshopModel.findOne({ slug: data.slug });
    if (existing) {
      data.slug = `${data.slug}-${Date.now()}`;
    }

    const workshop = await WorkshopModel.create(data);
    return NextResponse.json({ data: workshop }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/workshops error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
