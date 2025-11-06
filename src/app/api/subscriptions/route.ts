import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";
import mongoose from "mongoose";
import PackagesPage from "@/app/pages/packages/page";

const loadDB = async () => {
  await ConnectDB();
};
console.log("registering" + packageModel);
// GET: List all subscriptions, populate package data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const subscribed = searchParams.get("subscribed"); // "true" or "false"
  const type = searchParams.get("type"); // "real", "gift", "all"
  const isGift = searchParams.get("isGift"); // "true" or "false"
  const packageID = searchParams.get("packageID"); // Package ID for filtering
  await loadDB();
  let query: any = {};
  if (email) {
    query.email = email;
  }
  if (subscribed === "true") {
    query.subscribed = true;
  } else if (subscribed === "false") {
    query.subscribed = false;
  }
  if (type === "real") {
    query.subTotal = { $gt: 1000 };
  } else if (type === "gift") {
    query.subTotal = { $lte: 1000 };
  }
  if (isGift === "true") {
    query.isGift = true;
  } else if (isGift === "false") {
    query.isGift = false;
  }
  if (packageID) {
    query.packageID = new mongoose.Types.ObjectId(packageID);
  }
  try {
    const subscriptions = await subscriptionsModel
      .find(query)
      .populate({
        path: "packageID",
        model: packageModel,
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });
    return NextResponse.json({ data: subscriptions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

// POST: Create a new subscription
export async function POST(request: Request) {
  try {
    let body = await request.json();
    // Convert empty strings to null for ObjectId fields
    if (body.appliedDiscount === "") body.appliedDiscount = null;
    if (body.packageID === "") body.packageID = null;
    // You can add more fields here if needed
    console.log(JSON.stringify(body));
    const newSubscription = await subscriptionsModel.create(body);
    return NextResponse.json({ data: newSubscription }, { status: 201 });
  } catch (error: any) {
    // Return mongoose validation errors if present
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

// PUT: Update a subscription by ID
export async function PUT(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const subscriptionID = searchParams.get("subscriptionID");
  if (!subscriptionID) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 },
    );
  }
  try {
    let body = await request.json();
    // Convert empty strings to null for ObjectId fields
    if (body.appliedDiscount === "") body.appliedDiscount = null;
    if (body.packageID === "") body.packageID = null;
    // Validate apartment is a string
    if (body.apartment !== undefined && typeof body.apartment !== "string") {
      return NextResponse.json(
        {
          error: `Apartment must be a string. Received: ${JSON.stringify(body.apartment)} (type: ${typeof body.apartment})`,
        },
        { status: 400 },
      );
    }
    // Validate state is present
    if (body.state !== undefined && typeof body.state !== "string") {
      return NextResponse.json(
        {
          error: `State must be a string. Received: ${JSON.stringify(body.state)} (type: ${typeof body.state})`,
        },
        { status: 400 },
      );
    }
    console.log(JSON.stringify(body));
    const updated = await subscriptionsModel.findByIdAndUpdate(
      subscriptionID,
      body,
      { new: true, runValidators: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a subscription by ID
export async function DELETE(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const subscriptionID = searchParams.get("subscriptionID");
  if (!subscriptionID) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 },
    );
  }
  try {
    const deleted = await subscriptionsModel.findByIdAndDelete(subscriptionID);
    if (!deleted) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Subscription deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}
