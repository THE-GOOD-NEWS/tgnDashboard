import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

type RouteContext = { params: { id: string } };

// ─── GET  /api/workshops/[id] ────────────────────────────────────────────────
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const workshop = await WorkshopModel.findById(id);
    if (!workshop) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: workshop }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT  /api/workshops/[id] ────────────────────────────────────────────────
export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const data = await req.json();

    // If slug is changing, ensure uniqueness
    if (data.slug) {
      const conflict = await WorkshopModel.findOne({
        slug: data.slug,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Slug already in use by another workshop" },
          { status: 400 },
        );
      }
    }

    const updated = await WorkshopModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/workshops/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE  /api/workshops/[id] ─────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const deleted = await WorkshopModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Workshop not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Workshop deleted", data: deleted },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("DELETE /api/workshops/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
