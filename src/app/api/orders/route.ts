import ordersModel from "@/app/models/ordersModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function DELETE(request: Request) {
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await ordersModel.findByIdAndDelete(req.orderID);
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
  const orderID = searchParams.get("orderID");
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await ordersModel.findByIdAndUpdate(orderID, req, {
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
  const pageParam = searchParams.get("page");
  const search = searchParams.get("search") || "";
  const orderDate = searchParams.get("orderDate");
  const email = searchParams.get("email");
  console.log("OrdersEmails" + email);
  if (email) {
    // Fetch orders for a specific user
    try {
      const orders = await ordersModel.find({ email });
      console.log("ordersLength" + orders.length);

      return NextResponse.json({ data: orders }, { status: 200 });
    } catch (error) {
      console.error("Error fetching orders for user:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders for user" },
        { status: 500 },
      );
    }
  }

  console.log("Search params:", { search, orderDate }); // Debug log

  const limit = 10;
  const page = pageParam ? parseInt(pageParam) : 1;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {};
  if (search) {
    // Search by order ID, customer name, email, and phone (case-insensitive)
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];

    // Handle _id search separately
    try {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    } catch (error) {
      console.log("Invalid ObjectId format:", search);
    }

    console.log("Search filter:", filter); // Debug log
  }
  if (orderDate) {
    const startOfDay = new Date(orderDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(orderDate);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
    console.log("Date filter:", filter.createdAt); // Debug log
  }

  try {
    const orders = await ordersModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalOrders = await ordersModel.countDocuments(filter);

    console.log("Found orders:", orders.length); // Debug log

    return NextResponse.json(
      {
        data: orders,
        total: totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching orders:", error); // Debug log
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
