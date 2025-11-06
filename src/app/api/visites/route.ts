import visitesModel from "@/app/models/visitsModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET(req: Request) {
  try {
    const today = new Date();
    let startOfPeriod: Date;
    let endOfPeriod: Date;

    // Extract query parameter for duration (thisWeek, lastWeek, thisMonth, lastMonth, thisYear)
    const url = new URL(req.url);
    const duration = url.searchParams.get("duration");

    switch (duration) {
      case "today":
        // Start of today
        startOfPeriod = new Date(today);
        startOfPeriod.setHours(0, 0, 0, 0);

        // End of today
        endOfPeriod = new Date(today);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case "thisWeek":
        // Start of this week (Sunday to Saturday)
        startOfPeriod = new Date(today);
        startOfPeriod.setDate(today.getDate() - today.getDay()); // Get Sunday of this week
        startOfPeriod.setHours(0, 0, 0, 0);

        endOfPeriod = new Date(startOfPeriod);
        endOfPeriod.setDate(startOfPeriod.getDate() + 6); // Saturday
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case "lastWeek":
        // Start of last week (Sunday to Saturday)
        startOfPeriod = new Date(today);
        startOfPeriod.setDate(today.getDate() - today.getDay() - 7); // Get Sunday of last week
        startOfPeriod.setHours(0, 0, 0, 0);

        endOfPeriod = new Date(startOfPeriod);
        endOfPeriod.setDate(startOfPeriod.getDate() + 6); // Saturday
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case "thisMonth":
        // Start of this month
        startOfPeriod = new Date(today.getFullYear(), today.getMonth(), 1); // First day of this month
        startOfPeriod.setHours(0, 0, 0, 0);

        // End of this month
        endOfPeriod = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of this month
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case "lastMonth":
        // Start of last month
        startOfPeriod = new Date(today.getFullYear(), today.getMonth() - 1, 1); // First day of last month
        startOfPeriod.setHours(0, 0, 0, 0);

        // End of last month
        endOfPeriod = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case "thisYear":
        // Start of this year
        startOfPeriod = new Date(today.getFullYear(), 0, 1); // First day of this year
        startOfPeriod.setHours(0, 0, 0, 0);

        // End of this year
        endOfPeriod = new Date(today.getFullYear(), 11, 31); // Last day of this year
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      default:
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Query the database for records between the calculated start and end of the period
    const data = await visitesModel.find({
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
    }).sort({ createdAt: -1 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
