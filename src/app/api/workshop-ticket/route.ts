import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import WorkshopModel from "@/app/models/workshopModel";
import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";
import { generateWorkshopTicket } from "@/utils/generateWorkshopTicket";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ConnectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code");
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";

    if (!token) {
      return NextResponse.json({ error: "Missing check-in token parameter" }, { status: 400 });
    }

    let cleanToken = token.trim();

    // Look up attendee and workshop details if available
    let attendeeName = searchParams.get("name") || "";
    let workshopTitle = searchParams.get("workshop") || "";

    if (!attendeeName || !workshopTitle) {
      try {
        // Try finding from WorkshopAttendanceRequestModel
        const request = await WorkshopAttendanceRequestModel.findOne({
          $or: [
            { checkInToken: cleanToken },
            { checkInToken: { $regex: new RegExp(`^${cleanToken}$`, "i") } },
          ],
        });

        if (request) {
          attendeeName = request.name || attendeeName;
          if (request.workshopId) {
            const ws = await WorkshopModel.findById(request.workshopId);
            if (ws) {
              workshopTitle = ws.title || workshopTitle;
            }
          }
        } else {
          // Check inside WorkshopModel attendance array
          const ws = await WorkshopModel.findOne({
            "attendance.checkInToken": { $regex: new RegExp(`^${cleanToken}$`, "i") },
          });

          if (ws) {
            workshopTitle = ws.title || workshopTitle;
            const att = ws.attendance?.find(
              (a: any) =>
                a.checkInToken &&
                a.checkInToken.toLowerCase() === cleanToken.toLowerCase()
            );
            if (att) {
              attendeeName = att.name || attendeeName;
            }
          }
        }
      } catch (dbErr) {
        console.warn("Could not fetch attendee details from DB:", dbErr);
      }
    }

    // Generate the branded ticket image buffer with QR code embedded
    const imageBuffer = await generateWorkshopTicket({
      token: cleanToken,
      name: attendeeName || "Workshop Attendee",
      workshopTitle: workshopTitle || "Workshop Entry Pass",
    });

    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    if (isDownload) {
      const sanitizedFilename = `Workshop-Pass-${cleanToken}.png`.replace(/[^a-zA-Z0-9_.-]/g, "_");
      headers["Content-Disposition"] = `attachment; filename="${sanitizedFilename}"`;
    } else {
      headers["Content-Disposition"] = `inline; filename="Workshop-Pass-${cleanToken}.png"`;
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error generating workshop ticket:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate workshop pass" },
      { status: 500 }
    );
  }
}
