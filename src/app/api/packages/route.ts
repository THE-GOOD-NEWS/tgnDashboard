import mongoose from "mongoose";
import packageModel from "@/app/models/packageModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// CREATE - POST
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Creating package:", data);
    const newPackage = await packageModel.create(data);
    return NextResponse.json({ data: newPackage }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// READ - GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const all = searchParams.get("all") === "true";
  const limit = all ? 0 : 10;
  const skip = all ? 0 : (page - 1) * limit;

  try {
    // Create search query
    const searchQuery = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    // Get total count with search filter
    const totalPackages = await packageModel.countDocuments(searchQuery);

    // Get packages with search filter and proper sorting
    const packages = await packageModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        data: packages,
        total: totalPackages,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalPackages / limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}

// UPDATE - PUT
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageID = searchParams.get("packageID");
  
  if (!packageID) {
    return NextResponse.json(
      { error: "Package ID is required" },
      { status: 400 }
    );
  }

  try {
    const req = await request.json();
    console.log("Updating package:", packageID, req);

    const updatedPackage = await packageModel.findByIdAndUpdate(
      packageID,
      req,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedPackage }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageID = searchParams.get("packageID");

  if (!packageID) {
    return NextResponse.json(
      { error: "Package ID is required" },
      { status: 400 }
    );
  }

  try {
    console.log("Deleting package:", packageID);
    const deletedPackage = await packageModel.findByIdAndDelete(packageID);

    if (!deletedPackage) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Package deleted successfully", data: deletedPackage },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 