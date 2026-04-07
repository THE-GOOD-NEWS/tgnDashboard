import WorkshopPackageRequestModel from "@/app/models/workshopPackageRequestModel";
import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

export async function GET(req: Request) {
  try {
    const requests = await WorkshopPackageRequestModel.find()
      .populate("packageId", "title")
      .populate("selectedWorkshops", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: requests, total: requests.length }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newRequest = new WorkshopPackageRequestModel(data);
    await newRequest.save();

    return NextResponse.json({ message: "Package request created", data: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "markSeen") {
      await WorkshopPackageRequestModel.updateMany({ seen: false }, { $set: { seen: true } });
      return NextResponse.json({ message: "All requests marked as seen" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
