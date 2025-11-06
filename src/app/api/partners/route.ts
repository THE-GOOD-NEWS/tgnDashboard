import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import { PartnerModel } from "@/app/models/partnersModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List all partners with optional filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const brand = searchParams.get("brand");
  
  await loadDB();
  let query: any = {};
  
  if (category) {
    query.category = category;
  }
  if (subCategory) {
    query.subCategory = subCategory;
  }
  if (brand) {
    query.brand = brand;
  }
  
  try {
    const partners = await PartnerModel.find(query);
    return NextResponse.json({ data: partners }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 },
    );
  }
}

// POST: Create a new partner
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const partner = await PartnerModel.create(body);
    return NextResponse.json({ data: partner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create partner" },
      { status: 500 },
    );
  }
}

// PUT: Update a partner
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 },
      );
    }
    
    const partner = await PartnerModel.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });
    
    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 },
      );
    }
    
    return NextResponse.json({ data: partner }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update partner" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a partner
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "Partner ID is required" },
      { status: 400 },
    );
  }
  
  await loadDB();
  try {
    const partner = await PartnerModel.findByIdAndDelete(id);
    
    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 },
      );
    }
    
    return NextResponse.json(
      { message: "Partner deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete partner" },
      { status: 500 },
    );
  }
}