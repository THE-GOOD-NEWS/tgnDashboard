import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import LoginModel from "@/app/models/loginsModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET: Fetch login records with filtering options
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // 'month', 'week', 'today', 'all'
    const email = searchParams.get("email");
    const suspicious = searchParams.get("suspicious") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate date ranges based on period
    const now = new Date();
    let startDate = new Date();

    if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "10days") {
      startDate.setDate(now.getDate() - 10);
    } else if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "all") {
      startDate = new Date(0); // Beginning of time
    }

    // Build query
    const query: any = {
      timestamp: { $gte: startDate },
    };

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Handle suspicious login detection separately
    if (suspicious) {
      // Use the same period for suspicious detection as for filtering
      const suspiciousStartDate = new Date(startDate);

      // Find users with more than 3 different fingerprints in the selected period
      const suspiciousUsers = await LoginModel.aggregate([
        {
          $match: {
            timestamp: { $gte: suspiciousStartDate },
            fingerprint: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: { email: "$email" },
            uniqueFingerprints: { $addToSet: "$fingerprint" },
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            "uniqueFingerprints.3": { $exists: true }, // At least 4 elements (more than 3)
          },
        },
        {
          $project: {
            email: "$_id.email",
            fingerprintCount: { $size: "$uniqueFingerprints" },
            uniqueFingerprints: 1,
          },
        },
      ]);

      if (suspiciousUsers.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }

      // Get emails of suspicious users
      const suspiciousEmails = suspiciousUsers.map((user) => user.email);

      // Check if we need to return grouped data
      const groupByEmail = searchParams.get("groupByEmail") === "true";

      if (groupByEmail) {
        // Return the suspicious users with their fingerprint counts
        return NextResponse.json({
          data: suspiciousUsers,
          pagination: {
            page: 1,
            limit: 10,
            total: suspiciousUsers.length,
            pages: 1,
          },
        });
      }

      // If not grouping, filter by suspicious emails
      query.email = { $in: suspiciousEmails };
    }

    // Check if we need to get details for a specific email
    const specificEmail = searchParams.get("specificEmail");
    if (specificEmail) {
      query.email = specificEmail;
    }

    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [logins, total] = await Promise.all([
      LoginModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      LoginModel.countDocuments(query),
    ]);

    return NextResponse.json({
      data: logins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching login data:", error);
    return NextResponse.json(
      { error: "Failed to fetch login data" },
      { status: 500 },
    );
  }
}
