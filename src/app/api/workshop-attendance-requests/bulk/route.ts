import WorkshopAttendanceRequestModel from "@/app/models/workshopAttendanceRequestModel";
import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import { WorkshopConfirmationMail } from "@/app/emails/WorkshopConfirmationMail";
import { WorkshopRejectionMail } from "@/app/emails/WorkshopRejectionMail";
import { sendMail } from "@/app/lib/email";
import crypto from "crypto";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((item) => fn(item)));
    results.push(...chunkResults);
  }
  return results;
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { requestIds, status } = body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: "No request IDs provided" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status provided. Allowed: approved, rejected, archived" },
        { status: 400 }
      );
    }

    await loadDB();

    // Fetch all targeted requests
    const requests = await WorkshopAttendanceRequestModel.find({
      _id: { $in: requestIds },
    });

    if (!requests || requests.length === 0) {
      return NextResponse.json(
        { error: "No matching requests found" },
        { status: 404 }
      );
    }

    // Pre-fetch all relevant workshops in a single query
    const workshopIds = Array.from(
      new Set(requests.map((r) => r.workshopId?.toString()).filter(Boolean))
    );
    const workshops = await WorkshopModel.find({ _id: { $in: workshopIds } });
    const workshopMap = new Map(
      workshops.map((w) => [w._id.toString(), w])
    );

    const emailTasks: (() => Promise<{ success: boolean; to: string }>)[] = [];
    let updatedCount = 0;

    for (const request of requests) {
      const oldStatus = request.status;
      const wId = request.workshopId?.toString();
      const workshop = wId ? workshopMap.get(wId) : null;

      if (status === "approved") {
        const checkInToken =
          request.checkInToken ||
          `TGN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        request.status = "approved";
        request.checkInToken = checkInToken;
        await request.save();
        updatedCount++;

        // Sync with Workshop attendance array if not already present
        if (workshop) {
          const alreadyAttending = (workshop.attendance || []).some(
            (a: any) =>
              (a.requestId && a.requestId.toString() === request._id.toString()) ||
              a.email === request.email
          );

          if (!alreadyAttending) {
            await WorkshopModel.findByIdAndUpdate(workshop._id, {
              $push: {
                attendance: {
                  requestId: request._id,
                  name: request.name,
                  email: request.email,
                  phone: request.phone,
                  instapayImage: request.instapayImage,
                  checkInToken: checkInToken,
                  checkedIn: false,
                },
              },
            });
            // Update local workshop reference to prevent duplicates in loop
            workshop.attendance = workshop.attendance || [];
            workshop.attendance.push({
              requestId: request._id,
              name: request.name,
              email: request.email,
            } as any);
          }

          // Queue confirmation email (only if status changed or wasn't approved)
          if (oldStatus !== "approved") {
            emailTasks.push(async () => {
              try {
                const firstSession = workshop.availableSessions?.[0];
                const startDateStr = workshop.startDate
                  ? new Date(workshop.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "TBD";

                const mailBody = WorkshopConfirmationMail({
                  participantName: request.name,
                  workshopTitle: workshop.title,
                  startDate: startDateStr,
                  time: firstSession?.startTime || "TBD",
                  location: workshop.location?.altText || "Our Studio",
                  rawDate: workshop.startDate,
                  checkInToken: checkInToken,
                  hasQrCode: workshop.hasQrCode !== false,
                });

                const res = await sendMail({
                  to: request.email,
                  name: request.name,
                  subject: `Confirmation: ${workshop.title} Booking accepted!`,
                  body: mailBody,
                  from: '"The Good News" <info@thegoodnews-me.com>',
                  replyTo: "info@thegoodnews-me.com",
                });
                return { success: res.success, to: request.email };
              } catch (err) {
                console.error(`Error emailing ${request.email}:`, err);
                return { success: false, to: request.email };
              }
            });
          }
        }
      } else if (status === "rejected") {
        request.status = "rejected";
        await request.save();
        updatedCount++;

        // Remove from workshop attendance if previously approved
        if (workshop && oldStatus === "approved") {
          await WorkshopModel.findByIdAndUpdate(workshop._id, {
            $pull: {
              attendance: {
                email: request.email,
              },
            },
          });
        }

        // Queue rejection email if status changed to rejected
        if (workshop && oldStatus !== "rejected") {
          emailTasks.push(async () => {
            try {
              const mailBody = WorkshopRejectionMail({
                participantName: request.name,
                workshopTitle: workshop.title,
              });

              const res = await sendMail({
                to: request.email,
                name: request.name,
                subject: `Update regarding your registration for ${workshop.title}`,
                body: mailBody,
                from: "Thegoodnewsms@gmail.com",
              });
              return { success: res.success, to: request.email };
            } catch (err) {
              console.error(`Error emailing ${request.email}:`, err);
              return { success: false, to: request.email };
            }
          });
        }
      } else if (status === "archived") {
        request.status = "archived";
        await request.save();
        updatedCount++;

        // Remove from attendance if previously approved
        if (workshop && oldStatus === "approved") {
          await WorkshopModel.findByIdAndUpdate(workshop._id, {
            $pull: {
              attendance: {
                email: request.email,
              },
            },
          });
        }
      }
    }

    // Send emails in concurrent batches of 5
    let emailsSent = 0;
    let emailsFailed = 0;

    if (emailTasks.length > 0) {
      const emailResults = await runWithConcurrency(emailTasks, 5, (task) => task());
      for (const res of emailResults) {
        if (res.success) emailsSent++;
        else emailsFailed++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed ${updatedCount} requests.`,
        updatedCount,
        emailsSent,
        emailsFailed,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/workshop-attendance-requests/bulk error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process bulk request update" },
      { status: 500 }
    );
  }
}
