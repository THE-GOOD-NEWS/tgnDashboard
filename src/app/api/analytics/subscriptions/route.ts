import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

// GET: Get subscription analytics data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // Format: YYYY-MM
  const year = searchParams.get("year"); // Format: YYYY
  const packageId = searchParams.get("packageId"); // Optional package filter

  await loadDB();

  try {
    // Parse parameters or use current month/year
    let startDate, endDate;
    if (year) {
      // If year parameter is provided, get data for the entire year
      startDate = new Date(parseInt(year), 0, 1); // January 1st of the year
      endDate = new Date(parseInt(year), 11, 31); // December 31st of the year
    } else if (month) {
      // If month parameter is provided, get data for that specific month
      const [yearNum, monthNum] = month.split("-").map(Number);
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum, 0); // Last day of month
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Build query
    let query: any = {
      subscribed: true,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Add package filter if provided
    if (packageId) {
      query.packageID = new mongoose.Types.ObjectId(packageId);
    }

    // Get subscriptions with package details - expand query to get more data
    // Remove date restrictions if no results are found
    let subscriptions = await subscriptionsModel
      .find(query)
      .populate({
        path: "packageID",
        model: packageModel,
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    // If no subscriptions found with the date filter, get the most recent ones
    if (subscriptions.length === 0) {
      const modifiedQuery = { ...query };
      delete modifiedQuery.createdAt; // Fetch all subscriptions from the last 6 months for better data representation
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      if (subscriptions.length === 0) {
        subscriptions = await subscriptionsModel
          .find({ subscribed: true, createdAt: { $gte: twelveMonthsAgo } })
          .sort({ createdAt: -1 }) // Increased limit to get more real data
          .populate("packageID");
      }

      // If still no data, try without date restrictions
      if (subscriptions.length === 0) {
        subscriptions = await subscriptionsModel
          .find({ subscribed: true })
          .sort({ createdAt: -1 })
          // Increased limit to get more real data
          .populate("packageID");
      }

      // Ensure we have at least some real data
      if (subscriptions.length === 0) {
        // Try to get ALL subscriptions without any filters
        subscriptions = await subscriptionsModel
          .find({ subscribed: "true" })
          .sort({ createdAt: -1 }) // Get as many real subscriptions as possible
          .populate("packageID");

        console.log(
          "Fetched all available subscriptions:",
          subscriptions.length,
        );
      }
    }

    // Calculate analytics
    const totalSubscriptions = subscriptions.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscounts = 0;
    let totalProfit = 0;
    let totalShippingCost = 0;
    let totalRedeemedPoints = 0;
    let totalRedeemedPointsValue = 0; // in pounds (20 points = 1 pound)
    let totalPaymobFees = 0; // 2.75% of total, 0 if isGift

    // Group by package
    const packageStats: Record<
      string,
      {
        name: string;
        count: number;
        revenue: number;
        cost: number;
        discounts: number;
        profit: number;
        shippingCost: number;
        redeemedPoints: number;
        redeemedPointsValue: number;
        paymobFees: number;
      }
    > = {};

    // Process each subscription
    subscriptions.forEach((sub) => {
      const pkg = sub.packageID as any;
      if (!pkg) return;

      // Calculate revenue from total, cost and profit
      const subTotal = sub.subTotal || 0;
      const total = sub.total || 0;
      const revenue = total || 0; // Use total as revenue
      const cost = parseFloat(pkg.cost) || 0;
      const discount = sub.appliedDiscountAmount || 0; // Keep discount as is

      // Calculate shipping costs when total is not equal to subTotal
      const shippingCost = sub.shipping + sub.shipping * 0.14;

      // Calculate redeemed points and their value (20 points = 1 pound)
      const redeemedPoints = sub.redeemedLoyaltyPoints || 0;
      const redeemedPointsValue = redeemedPoints / 20; // Convert to pounds

      // Calculate Paymob fees (2.75% of total, 0 if isGift)
      const paymobFeesBefore14Vat = total * 0.0275;
      const paymobFees = sub.isGift
        ? 0
        : paymobFeesBefore14Vat + paymobFeesBefore14Vat * 0.14;

      // Calculate profit (revenue - cost - shipping - paymob fees)
      const profit = revenue - cost - shippingCost - paymobFees;

      // Add to totals
      totalRevenue += revenue;
      totalCost += cost;
      totalDiscounts += discount;
      totalShippingCost += shippingCost;
      totalRedeemedPoints += redeemedPoints;
      totalRedeemedPointsValue += redeemedPointsValue;
      totalPaymobFees += paymobFees;
      // Calculate profit as revenue minus cost minus shipping cost minus paymob fees
      totalProfit += profit;

      // Add to package stats
      if (!packageStats[pkg._id]) {
        packageStats[pkg._id] = {
          name: pkg.name,
          count: 0,
          revenue: 0,
          cost: 0,
          discounts: 0,
          profit: 0,
          shippingCost: 0,
          redeemedPoints: 0,
          redeemedPointsValue: 0,
          paymobFees: 0,
        };
      }

      packageStats[pkg._id].count++;
      packageStats[pkg._id].revenue += revenue;
      packageStats[pkg._id].cost += cost;
      packageStats[pkg._id].discounts += discount;
      packageStats[pkg._id].shippingCost += shippingCost;
      packageStats[pkg._id].redeemedPoints += redeemedPoints;
      packageStats[pkg._id].redeemedPointsValue += redeemedPointsValue;
      packageStats[pkg._id].paymobFees += paymobFees;
      // Calculate profit as revenue minus cost minus shipping cost minus paymob fees
      packageStats[pkg._id].profit =
        packageStats[pkg._id].revenue -
        packageStats[pkg._id].cost -
        packageStats[pkg._id].shippingCost -
        packageStats[pkg._id].paymobFees;
    });

    // Get all packages for the dropdown
    const allPackages = await packageModel.find({}).sort({ name: 1 });

    // Generate monthly data for the chart (last 6 months)
    const monthlyData = [];
    const now = new Date();

    // Only show last 6 months for cleaner chart
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // Ensure we use English month names consistently
      const monthName =
        monthDate.toLocaleString("en-US", { month: "short" }) +
        " " +
        monthDate.getFullYear();

      // Get month start and end dates for filtering
      const monthStart = new Date(monthDate);
      const monthEnd = new Date(monthDate);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of the month

      // Calculate monthly metrics from actual subscriptions
      let monthRevenue = 0;
      let monthCost = 0;
      let monthProfit = 0;

      // Filter subscriptions for this month
      const monthSubscriptions = subscriptions.filter((sub) => {
        const subDate = new Date(sub.createdAt);
        return subDate >= monthStart && subDate <= monthEnd;
      });
      console.log(
        `Month: ${monthName}, Subscriptions: ${monthSubscriptions.length}`,
      );

      // Log month name and number of subscriptions

      // Calculate metrics from real data
      monthSubscriptions.forEach((sub) => {
        monthRevenue += sub.total || 0;

        // Get cost from package if available
        if (sub.packageID && typeof sub.packageID === "object") {
          monthCost +=
            sub.packageID.cost +
              sub.shipping +
              sub.shipping * 0.14 +
              sub.total * 0.0275 +
              sub.total * 0.0275 * 0.14 || 0;
        }
      });

      monthProfit = monthRevenue - monthCost;

      // Always add data for all months, even if zero
      monthlyData.push({
        month: monthName,
        revenue: monthRevenue,
        cost: monthCost,
        profit: monthProfit,
        isSample: false,
      });
    }

    return NextResponse.json(
      {
        data: {
          period: {
            startDate,
            endDate,
          },
          summary: {
            totalSubscriptions,
            totalRevenue,
            totalCost,
            totalDiscounts,
            totalShippingCost,
            totalProfit,
            totalRedeemedPoints,
            totalRedeemedPointsValue,
            totalPaymobFees,
          },
          packageStats: Object.values(packageStats),
          allPackages: allPackages.map((pkg) => ({
            _id: pkg._id,
            name: pkg.name,
          })),
          monthlyData: monthlyData, // Add monthly data for the chart
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription analytics" },
      { status: 500 },
    );
  }
}
