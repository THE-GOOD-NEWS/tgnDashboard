import { NextRequest, NextResponse } from "next/server";

import BannersModel, {
  getBanners,
  // updateBanner,
} from "@/app/models/bannersModel";
import { ConnectDB } from "@/config/db";

export async function GET(req: Request) {
  try {
    await ConnectDB();
    const banner = await getBanners();
    return NextResponse.json({ data: banner }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ConnectDB();
    const body = await req.json();
    console.log("banner" + JSON.stringify(body.announcementBar));
    console.log("banner" + body.announcementBar);
    // const updated = await updateBanner(body);
    const updated = await BannersModel.findByIdAndUpdate(
      "6899f4226d5cdf79c1908292",

      { announcementBar: body.announcementBar },

      { new: true },
    );
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 },
    );
  }
}
