import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

// ─── GET /api/workshop-attendance-requests ──────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workshopId = searchParams.get("workshopId");
    const status = searchParams.get("status");

    const query: any = {};
    if (workshopId) query.workshopId = workshopId;
    if (status) query.status = status;

    const requests = await WorkshopAttendanceRequestModel.find(query)
      .populate("workshopId", "title")
      .sort({
        createdAt: -1,
      });

    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/workshop-attendance-requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance requests" },
      { status: 500 }
    );
  }
}

// ─── POST /api/workshop-attendance-requests ─────────────────────────────────
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const request = await WorkshopAttendanceRequestModel.create(data);
    return NextResponse.json({ data: request }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/workshop-attendance-requests error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ─── PATCH /api/workshop-attendance-requests ────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "markSeen") {
      await WorkshopAttendanceRequestModel.updateMany({ seen: false }, { $set: { seen: true } });
      return NextResponse.json({ message: "All requests marked as seen" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/workshop-attendance-requests error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
