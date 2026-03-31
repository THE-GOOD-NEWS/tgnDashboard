import WorkshopPackageModel from "@/app/models/workshopPackageModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

type RouteContext = { params: { id: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const pkg = await WorkshopPackageModel.findById(id);

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ data: pkg }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const updateData = await req.json();

    const pkg = await WorkshopPackageModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ data: pkg }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/workshop-packages/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const deletedPkg = await WorkshopPackageModel.findByIdAndDelete(id);

    if (!deletedPkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Package deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
