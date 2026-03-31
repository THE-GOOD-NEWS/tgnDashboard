import WorkshopPackageRequestModel from "@/app/models/workshopPackageRequestModel";
import WorkshopModel from "@/app/models/workshopModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();

type RouteContext = { params: { id: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const updateData = await req.json();
    
    const request = await WorkshopPackageRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Package request not found" }, { status: 404 });
    }

    const oldStatus = request.status;
    const newStatus = updateData.status || request.status;

    if (newStatus === "approved" && oldStatus !== "approved") {
      // Loop through each selected workshop and add attendance
      if (request.selectedWorkshops && request.selectedWorkshops.length > 0) {
        for (const workshopId of request.selectedWorkshops) {
          await WorkshopModel.findByIdAndUpdate(workshopId, {
            $push: {
              attendance: {
                requestId: request._id.toString(), // Store the package request ID
                name: updateData.name || request.name,
                email: updateData.email || request.email,
                phone: updateData.phone || request.phone,
                instapayImage: updateData.instapayImage || request.instapayImage,
              },
            },
          });
        }
      }
    } else if (newStatus !== "approved" && oldStatus === "approved") {
      // Pull the attendance from all selected workshops
      if (request.selectedWorkshops && request.selectedWorkshops.length > 0) {
        for (const workshopId of request.selectedWorkshops) {
          await WorkshopModel.findByIdAndUpdate(workshopId, {
            $pull: {
              attendance: {
                email: request.email,
              },
            },
          });
        }
      }
    }

    Object.assign(request, updateData);
    await request.save();

    return NextResponse.json({ data: request }, { status: 200 });
  } catch (error: any) {
    console.error("PATCH /api/workshop-package-requests/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const deleted = await WorkshopPackageRequestModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Package request not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Package request deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
