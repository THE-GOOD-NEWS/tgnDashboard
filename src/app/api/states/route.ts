import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import statesModel from "@/app/models/statesModel";
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET ALL states or states by shipping zone
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneID = searchParams.get("zoneID");

  try {
    if (zoneID) {
      // Return only states that belong to a specific shipping zone
      const states = await statesModel.find({ shipping_zone: zoneID }).sort({ name: 1 });
      return NextResponse.json(states, { status: 200 });
    } else {
      // Return all states
      const states = await statesModel.find().sort({ name: 1 });
      return NextResponse.json(states, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch states" }, { status: 500 });
  }
}

export async function PUT(request:Request){
    const { searchParams } = new URL(request.url);
    const stateID = searchParams.get("stateID") 
    console.log('stateID'+stateID);
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await statesModel.findByIdAndUpdate(stateID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}