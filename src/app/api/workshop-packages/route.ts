import WorkshopPackageModel from "@/app/models/workshopPackageModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    
    let queryArgs: any = {};
    if (search) {
        queryArgs.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }
    
    // For packages, pagination might not be heavily needed immediately, but let's return all.
    const packages = await WorkshopPackageModel.find(queryArgs).sort({ createdAt: -1 });

    return NextResponse.json(
      { data: packages, total: packages.length },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.slug && data.title) {
        data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    }

    const newPackage = new WorkshopPackageModel(data);
    await newPackage.save();

    return NextResponse.json(
      { message: "Package details have been added", data: newPackage },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/workshop-packages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
