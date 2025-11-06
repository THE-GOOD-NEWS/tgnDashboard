import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import Popup from "@/app/models/Popup";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET: Fetch all popups
export async function GET() {
  try {
    const popups = await Popup.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: popups });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new popup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, buttonText, link, active } = body;

    // Validate required fields
    if (!title || !description || !imageUrl || !buttonText || !link) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPopup = await Popup.create({
      title,
      description,
      imageUrl,
      buttonText,
      link,
      active: active || false,
    });

    return NextResponse.json(
      { success: true, data: newPopup },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}