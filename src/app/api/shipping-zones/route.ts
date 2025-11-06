import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import shippingZonesModel from "@/app/models/shippingZonesModel";
import statesModel from "@/app/models/statesModel";
import countriesModel from "@/app/models/countriesModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET ALL or GET ONE by ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneID = searchParams.get("zoneID");

  try {
    if (!zoneID) {
      const zones = await shippingZonesModel.find().sort({ createdAt: -1 });
      return NextResponse.json(zones, { status: 200 });
    } else {
      const zone = await shippingZonesModel.findById(zoneID);
      return NextResponse.json({ data: zone }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch zones" }, { status: 500 });
  }
}

// CREATE
export async function POST(req: Request) {
  const body = await req.json();
  console.log('POST body:', body);

  try {
    const newZone = await shippingZonesModel.create(body);
    
    // Update states to link to this zone
    if (body.states && body.states.length > 0) {
      await statesModel.updateMany(
        { _id: { $in: body.states } },
        { shipping_zone: newZone._id.toString() }
      );
    }
    
    // Update countries to link to this zone
    if (body.countries && body.countries.length > 0) {
      await countriesModel.updateMany(
        { _id: { $in: body.countries } },
        { shipping_zone: newZone._id }
      );
    }
    
    return NextResponse.json(newZone, { status: 201 });
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: error.message || "Failed to create zone" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  const body = await req.json();

  try {
    const res = await shippingZonesModel.findByIdAndDelete(body.zoneID);
    
    // Remove shipping_zone references from states and countries
    await statesModel.updateMany(
      { shipping_zone: body.zoneID },
      { shipping_zone: "x" }
    );
    await countriesModel.updateMany(
      { shipping_zone: body.zoneID },
      { shipping_zone: null }
    );
    
    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneID = searchParams.get("zoneID");
  const body = await req.json();
  console.log('PUT body:', body);

  try {
    const updated = await shippingZonesModel.findByIdAndUpdate(zoneID, body, {
      new: true,
      runValidators: true,
    });
    
    // First, remove all states and countries from this zone
    await statesModel.updateMany(
      { shipping_zone: zoneID },
      { shipping_zone: "x" }
    );
    await countriesModel.updateMany(
      { shipping_zone: zoneID },
      { shipping_zone: null }
    );
    
    // Then, update the selected states to link to this zone
    if (body.states && body.states.length > 0) {
      await statesModel.updateMany(
        { _id: { $in: body.states } },
        { shipping_zone: zoneID }
      );
    }
    
    // Update the selected countries to link to this zone
    if (body.countries && body.countries.length > 0) {
      await countriesModel.updateMany(
        { _id: { $in: body.countries } },
        { shipping_zone: zoneID }
      );
    }
    
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
