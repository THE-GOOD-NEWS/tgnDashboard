import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import WorkshopModel from "@/app/models/workshopModel";
import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

async function processCheckIn(token: string) {
  if (!token || typeof token !== "string") {
    return { error: "Missing or invalid check-in token", status: 400 };
  }

  let cleanToken = token.trim();

  // If token is a full URL or contains query parameters, extract the actual token
  if (cleanToken.startsWith("http://") || cleanToken.startsWith("https://")) {
    try {
      const parsedUrl = new URL(cleanToken);
      const paramToken =
        parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("code");
      if (paramToken && paramToken.trim()) {
        cleanToken = paramToken.trim();
      }
    } catch {}
  }

  if (cleanToken.includes("token=")) {
    const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      cleanToken = match[1];
    }
  }

  if (!cleanToken || cleanToken.startsWith("http")) {
    return { error: "No valid ticket token found in the scanned pass", status: 400 };
  }

  // Fast direct indexed lookup first
  let request = await WorkshopAttendanceRequestModel.findOne({
    checkInToken: cleanToken,
  });

  if (!request && cleanToken.match(/^[0-9a-fA-F]{24}$/)) {
    request = await WorkshopAttendanceRequestModel.findById(cleanToken);
  }

  if (!request) {
    request = await WorkshopAttendanceRequestModel.findOne({
      checkInToken: { $regex: new RegExp(`^${cleanToken}$`, "i") },
    });
  }

  // Also search in WorkshopModel attendance array
  let workshop = null;
  if (request?.workshopId) {
    workshop = await WorkshopModel.findById(request.workshopId);
  } else {
    workshop = await WorkshopModel.findOne({
      "attendance.checkInToken": cleanToken,
    }) || await WorkshopModel.findOne({
      "attendance.checkInToken": { $regex: new RegExp(`^${cleanToken}$`, "i") },
    });
  }

  if (!workshop && !request) {
    return {
      error: `Invalid Pass Code (${cleanToken}) / Ticket not found`,
      status: 404,
    };
  }

  const attendeeName =
    request?.name ||
    workshop?.attendance?.find(
      (a: any) =>
        a.checkInToken?.toLowerCase() === cleanToken.toLowerCase()
    )?.name ||
    "Attendee";
  const attendeeEmail =
    request?.email ||
    workshop?.attendance?.find(
      (a: any) =>
        a.checkInToken?.toLowerCase() === cleanToken.toLowerCase()
    )?.email;
  const attendeePhone =
    request?.phone ||
    workshop?.attendance?.find(
      (a: any) =>
        a.checkInToken?.toLowerCase() === cleanToken.toLowerCase()
    )?.phone;

  // Check if already checked in
  const isAlreadyCheckedIn =
    request?.checkedIn ||
    workshop?.attendance?.some(
      (a: any) =>
        (a.checkInToken?.toLowerCase() === cleanToken.toLowerCase() ||
          (attendeeEmail && a.email?.toLowerCase() === attendeeEmail.toLowerCase())) &&
        a.checkedIn
    );

  if (isAlreadyCheckedIn) {
    const checkedInAt =
      request?.checkedInAt ||
      workshop?.attendance?.find(
        (a: any) =>
          (a.checkInToken?.toLowerCase() === cleanToken.toLowerCase() ||
            (attendeeEmail && a.email?.toLowerCase() === attendeeEmail.toLowerCase())) &&
          a.checkedIn
      )?.checkedInAt ||
      new Date();

    return {
      status: 200,
      alreadyCheckedIn: true,
      data: {
        attendeeName,
        attendeeEmail,
        attendeePhone,
        workshopTitle: workshop?.title || "Workshop",
        location: workshop?.location?.altText || "Venue",
        startDate: workshop?.startDate,
        checkedInAt,
        message: "Attendee is already checked in!",
      },
    };
  }

  const now = new Date();
  const dbUpdates: Promise<any>[] = [];

  // Update WorkshopAttendanceRequestModel
  if (request) {
    request.checkedIn = true;
    request.checkedInAt = now;
    if (!request.checkInToken) request.checkInToken = cleanToken;
    dbUpdates.push(request.save());
  }

  // Update WorkshopModel attendance item safely without positional operator
  if (workshop && Array.isArray(workshop.attendance)) {
    let attendanceUpdated = false;
    const updatedAttendance = workshop.attendance.map((att: any) => {
      const matchToken =
        att.checkInToken &&
        att.checkInToken.toLowerCase() === cleanToken.toLowerCase();
      const matchEmail =
        attendeeEmail &&
        att.email &&
        att.email.toLowerCase() === attendeeEmail.toLowerCase();
      const matchReqId =
        request?._id &&
        att.requestId &&
        String(att.requestId) === String(request._id);

      if (matchToken || matchEmail || matchReqId) {
        attendanceUpdated = true;
        return {
          ...(att.toObject ? att.toObject() : att),
          checkedIn: true,
          checkedInAt: now,
          checkInToken: att.checkInToken || cleanToken,
        };
      }
      return att;
    });

    if (attendanceUpdated) {
      dbUpdates.push(
        WorkshopModel.updateOne(
          { _id: workshop._id },
          { $set: { attendance: updatedAttendance } }
        )
      );
    }
  }

  if (dbUpdates.length > 0) {
    await Promise.all(dbUpdates);
  }

  return {
    status: 200,
    alreadyCheckedIn: false,
    data: {
      attendeeName,
      attendeeEmail,
      attendeePhone,
      workshopTitle: workshop?.title || "Workshop",
      location: workshop?.location?.altText || "Venue",
      startDate: workshop?.startDate,
      checkedInAt: now,
      message: "Check-in successful! Attendance activated.",
    },
  };
}

// ─── GET /api/workshop-checkin?token=... ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code") || "";
    const format = searchParams.get("format");
    const acceptHeader = req.headers.get("accept") || "";

    const result = await processCheckIn(token);

    // If client requested JSON or is an API call
    if (format === "json" || acceptHeader.includes("application/json")) {
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status }
        );
      }
      return NextResponse.json(
        {
          success: true,
          alreadyCheckedIn: result.alreadyCheckedIn,
          ...result.data,
        },
        { status: 200 }
      );
    }

    // Otherwise render a responsive confirmation HTML page for direct mobile camera scans
    const isSuccess = !result.error && !result.alreadyCheckedIn;
    const isAlready = !result.error && result.alreadyCheckedIn;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workshop Check-in | The Good News</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8f6ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; color: #222; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 440px; width: 100%; overflow: hidden; text-align: center; }
    .header { padding: 32px 24px 20px 24px; background: ${isSuccess ? "#ecfdf5" : isAlready ? "#fffbeb" : "#fef2f2"}; }
    .icon { font-size: 54px; line-height: 1; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; color: ${isSuccess ? "#065f46" : isAlready ? "#92400e" : "#991b1b"}; }
    .subtitle { font-size: 14px; color: #666; margin-top: 6px; }
    .content { padding: 24px; text-align: left; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #888; font-weight: 500; }
    .value { color: #111; font-weight: 600; text-align: right; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${isSuccess ? "#10b981" : isAlready ? "#f59e0b" : "#ef4444"}; color: #fff; }
    .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #f0f0f0; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${isSuccess ? "✅" : isAlready ? "⚠️" : "❌"}</div>
      <h1 class="title">${isSuccess ? "Check-in Successful!" : isAlready ? "Already Checked In" : "Invalid Pass"}</h1>
      <p class="subtitle">${isSuccess ? "Attendance has been activated successfully." : isAlready ? "This ticket was already checked in earlier." : (result.error || "Pass not found")}</p>
    </div>
    ${
      result.data
        ? `
    <div class="content">
      <div class="row">
        <span class="label">Attendee</span>
        <span class="value">${result.data.attendeeName}</span>
      </div>
      <div class="row">
        <span class="label">Workshop</span>
        <span class="value">${result.data.workshopTitle}</span>
      </div>
      <div class="row">
        <span class="label">Location</span>
        <span class="value">${result.data.location}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="value"><span class="badge">${isSuccess ? "Checked In Just Now" : "Previously Verified"}</span></span>
      </div>
      <div class="row">
        <span class="label">Timestamp</span>
        <span class="value">${new Date(result.data.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>`
        : ""
    }
    <div class="footer">The Good News Workshop Management</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: result.status || 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/workshop-checkin ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || body.code || body.id || "";
    const result = await processCheckIn(token);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyCheckedIn: result.alreadyCheckedIn,
        ...result.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
