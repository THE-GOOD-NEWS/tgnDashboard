import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";
import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/app/lib/email";
import { WorkshopConfirmationMail } from "@/app/emails/WorkshopConfirmationMail";
import { WorkshopRejectionMail } from "@/app/emails/WorkshopRejectionMail";
import crypto from "crypto";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

type RouteContext = { params: { id: string } };

// Helper to extract the most accurate session, date, and start time from a workshop
function extractWorkshopSchedule(workshop: any) {
  const sessions = Array.isArray(workshop.availableSessions)
    ? [...workshop.availableSessions].filter(Boolean)
    : [];

  // Sort sessions chronologically by sessionStartDate
  sessions.sort((a: any, b: any) => {
    const dateA = a.sessionStartDate ? new Date(a.sessionStartDate).getTime() : 0;
    const dateB = b.sessionStartDate ? new Date(b.sessionStartDate).getTime() : 0;
    return dateA - dateB;
  });

  // Find the earliest session with a valid startTime, or fallback to the first chronological session
  const sessionWithTime = sessions.find(
    (s: any) => typeof s.startTime === "string" && s.startTime.trim() !== ""
  );
  const firstSession = sessions[0];

  let rawTime = sessionWithTime?.startTime?.trim() || firstSession?.startTime?.trim() || "";
  const duration = sessionWithTime?.duration || firstSession?.duration || 120;

  // Determine effective workshop start date (prefer earliest session date if set)
  let effectiveDate: Date;
  if (firstSession?.sessionStartDate) {
    effectiveDate = new Date(firstSession.sessionStartDate);
  } else if (workshop.startDate) {
    effectiveDate = new Date(workshop.startDate);
  } else {
    effectiveDate = new Date();
  }

  // If rawTime is empty, check if effectiveDate or workshop.startDate has non-midnight hours/minutes embedded
  if (!rawTime) {
    const checkDate = (d: any) => {
      if (!d) return "";
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        const hours = dt.getHours();
        const minutes = dt.getMinutes();
        if (hours !== 0 || minutes !== 0) {
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
      }
      return "";
    };
    rawTime = checkDate(firstSession?.sessionStartDate) || checkDate(workshop.startDate) || "";
  }

  // Format display time nicely (e.g. "14:00" -> "2:00 PM")
  let formattedTime = "TBD";
  if (rawTime) {
    const match24 = rawTime.match(/^(\d{1,2}):(\d{2})$/);
    const match12 = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match24) {
      const hour = parseInt(match24[1], 10);
      const minute = match24[2];
      if (hour >= 0 && hour <= 23) {
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        formattedTime = `${displayHour}:${minute} ${ampm}`;
      } else {
        formattedTime = rawTime;
      }
    } else if (match12) {
      const hour = parseInt(match12[1], 10);
      const minute = match12[2];
      const ampm = match12[3].toUpperCase();
      formattedTime = `${hour}:${minute} ${ampm}`;
    } else {
      formattedTime = rawTime;
    }
  }

  const formattedStartDate = effectiveDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    time: formattedTime,
    durationMinutes: duration,
    startDate: formattedStartDate,
    rawDate: effectiveDate,
  };
}

// ─── GET /api/workshop-attendance-requests/[id] ─────────────────────────────
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const request = await WorkshopAttendanceRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ data: request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH /api/workshop-attendance-requests/[id] ───────────────────────────
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const updateData = await req.json();

    const request = await WorkshopAttendanceRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const oldStatus = request.status;
    const newStatus = updateData.status || request.status;

    // Handle attendance list synchronization if status changes
    if (newStatus === "approved" && oldStatus !== "approved") {
      const checkInToken =
        request.checkInToken ||
        `TGN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      updateData.checkInToken = checkInToken;

      const workshop = await WorkshopModel.findById(request.workshopId);
      if (workshop) {
        await WorkshopModel.findByIdAndUpdate(request.workshopId, {
          $push: {
            attendance: {
              requestId: request._id,
              name: updateData.name || request.name,
              email: updateData.email || request.email,
              phone: updateData.phone || request.phone,
              instapayImage: updateData.instapayImage || request.instapayImage,
              checkInToken: checkInToken,
              checkedIn: false,
            },
          },
        });

        // Send Confirmation Email
        try {
          const schedule = extractWorkshopSchedule(workshop);
          const mailBody = WorkshopConfirmationMail({
            participantName: updateData.name || request.name,
            workshopTitle: workshop.title,
            startDate: schedule.startDate,
            time: schedule.time,
            location: workshop.location?.altText || "Our Studio",
            rawDate: schedule.rawDate,
            checkInToken: checkInToken,
            hasQrCode: workshop.hasQrCode !== false,
            durationMinutes: schedule.durationMinutes,
          });

          await sendMail({
            to: updateData.email || request.email,
            name: updateData.name || request.name,
            subject: `Confirmation: ${workshop.title} Booking accepted!`,
            body: mailBody,
            from: '"The Good News" <info@thegoodnews-me.com>',
            replyTo: "info@thegoodnews-me.com",
          });
          console.log(`Confirmation email sent to ${updateData.email || request.email}`);
        } catch (mailError) {
          console.error("Failed to send confirmation email:", mailError);
        }
      }
    } else if (newStatus !== "approved" && oldStatus === "approved") {
      await WorkshopModel.findByIdAndUpdate(request.workshopId, {
        $pull: {
          attendance: {
            // Use email or requestId for more precision
            email: request.email,
          },
        },
      });
    }

    // Send Rejection / Waitlist Email if status changed to rejected
    if (newStatus === "rejected" && oldStatus !== "rejected") {
      const workshop = await WorkshopModel.findById(request.workshopId);
      if (workshop) {
        try {
          const mailBody = WorkshopRejectionMail({
            participantName: updateData.name || request.name,
            workshopTitle: workshop.title,
          });

          await sendMail({
            to: updateData.email || request.email,
            name: updateData.name || request.name,
            subject: `Update regarding your registration for ${workshop.title}`,
            body: mailBody,
            from: "Thegoodnewsms@gmail.com",
          });
          console.log(`Rejection/waitlist email sent to ${updateData.email || request.email}`);
        } catch (mailError) {
          console.error("Failed to send rejection email:", mailError);
        }
      }
    }

    // Update the request document with all fields provided
    Object.assign(request, updateData);
    await request.save();

    return NextResponse.json({ data: request }, { status: 200 });
  } catch (error: any) {
    console.error("PATCH /api/workshop-attendance-requests/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE /api/workshop-attendance-requests/[id] ──────────────────────────
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const deleted = await WorkshopAttendanceRequestModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Request deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
