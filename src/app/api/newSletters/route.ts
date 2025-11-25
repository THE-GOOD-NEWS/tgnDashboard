import newSletterModel from "@/app/models/newSletterModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();
export async function POST(request: Request) {
  const data = await request.json();
  console.log("Email" + data.email);

  try {
    const res = await newSletterModel.create({ email: data.email });
    return NextResponse.json({ message: "Done Wogo" }, { status: 200 });
  } catch (error: any) {
    console.error(error);

    // Check if error is related to MongoDB validation
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation failed. Please check the data format." },
        { status: 400 },
      );
    }

    // Check for duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: `Duplicate entry: The email ${data.email} already exists.` },
        { status: 400 },
      );
    }

    // For other MongoDB errors (e.g., connection issues)
    if (error.name === "MongoNetworkError") {
      return NextResponse.json(
        { message: "Network error while connecting to Database." },
        { status: 503 },
      );
    }

    // General server error
    return NextResponse.json(
      {
        message: "Internal server error please try again later",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await newSletterModel.findByIdAndDelete(req.newSletterID);
    console.log(res);

    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    //  return NextResponse.json({msg:'error'}),
    //  {status:500}
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const newSletterID = searchParams.get("newSletterID");
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await newSletterModel.findByIdAndUpdate(newSletterID, req, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stats = searchParams.get("stats") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    if (stats === "monthly") {
      const year = parseInt(
        searchParams.get("year") || new Date().getFullYear().toString(),
        10,
      );
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      const agg = await newSletterModel.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: "$_id.month", count: 1 } },
        { $sort: { month: 1 } },
      ]);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const countsMap: Record<number, number> = {};
      for (const { month, count } of agg) countsMap[month] = count;
      const monthly = monthNames.map((name, idx) => ({
        month: name,
        count: countsMap[idx + 1] || 0,
      }));

      return NextResponse.json({ data: { year, monthly } }, { status: 200 });
    }

    if (stats === "summary") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const [allTime, thisMonth, thisWeek, today] = await Promise.all([
        newSletterModel.countDocuments({}),
        newSletterModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
        newSletterModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        newSletterModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      ]);

      return NextResponse.json(
        {
          data: { allTime, thisMonth, thisWeek, today },
        },
        { status: 200 },
      );
    }

    const newSletter = await newSletterModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalnewSletter = await newSletterModel.countDocuments();

    return NextResponse.json(
      {
        data: newSletter,
        total: totalnewSletter,
        currentPage: page,
        totalPages: Math.ceil(totalnewSletter / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch newsletters" },
      { status: 500 },
    );
  }
}
