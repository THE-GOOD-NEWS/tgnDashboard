import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";
import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/app/lib/email";
import { WorkshopConfirmationMail } from "@/app/emails/WorkshopConfirmationMail";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

type RouteContext = { params: { id: string } };

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
            },
          },
        });

        // Send Confirmation Email
        try {
          const firstSession = workshop.availableSessions?.[0];
          const mailBody = WorkshopConfirmationMail({
            participantName: updateData.name || request.name,
            workshopTitle: workshop.title,
            startDate: workshop.startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: firstSession?.startTime || "TBD",
            location: workshop.location?.altText || "Our Studio",
            rawDate: workshop.startDate,
          });

          await sendMail({
            to: updateData.email || request.email,
            name: updateData.name || request.name,
            subject: `Confirmation: ${workshop.title} Booking accepted!`,
            body: mailBody,
            from: "Thegoodnewsms@gmail.com",
            // from: "noreply@thegoodnews-me.com",
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
    } else if (newStatus === "approved" && oldStatus === "approved") {
      // If staying approved but info updated, we might need to update the attendance entry
      // This part is a bit more complex with $set and array filters, but for now simple pull/push or just skip
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
