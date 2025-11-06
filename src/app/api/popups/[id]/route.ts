import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import Popup from "@/app/models/Popup";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET: Fetch a single popup
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const popup = await Popup.findById(params.id);
    if (!popup) {
      return NextResponse.json(
        { success: false, error: "Popup not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: popup });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a popup
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedPopup = await Popup.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPopup) {
      return NextResponse.json(
        { success: false, error: "Popup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPopup });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a popup
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deletedPopup = await Popup.findByIdAndDelete(params.id);

    if (!deletedPopup) {
      return NextResponse.json(
        { success: false, error: "Popup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}