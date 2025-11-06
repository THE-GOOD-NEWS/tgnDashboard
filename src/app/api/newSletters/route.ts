import newSletterModel from "@/app/models/newSletterModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();
export async function POST(request: Request) {
    const data = await request.json();
    console.log('Email'+data.email);

    try {
        const res = await newSletterModel.create({email:data.email});
            return NextResponse.json({ message: "Done Wogo" }, { status: 200 });
   
    }
    catch (error: any) {
        console.error(error);

        // Check if error is related to MongoDB validation
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Validation failed. Please check the data format.' }, { status: 400 });
        }

        // Check for duplicate key error
        if (error.code === 11000) {
            return NextResponse.json({ message: `Duplicate entry: The email ${data.email} already exists.` }, { status: 400 });
        }

        // For other MongoDB errors (e.g., connection issues)
        if (error.name === 'MongoNetworkError') {
            return NextResponse.json({ message: 'Network error while connecting to Database.' }, { status: 503 });
        }

        // General server error
        return NextResponse.json({ message: 'Internal server error please try again later', error: error.message }, { status: 500 });
    }
}
export async function DELETE(request:Request){
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res= await newSletterModel.findByIdAndDelete(req.newSletterID)
        console.log(res);

     return new Response(JSON.stringify(res),{
            headers: { 'Content-Type': 'application/json' },
                status:200
            }
        )
   
    }
    catch(error:any){

        //  return NextResponse.json({msg:'error'}),
        //  {status:500}
        return Response.json({ error: error.message }, { status: 500 });
     }
   

}
export async function PUT(request:Request){
    const { searchParams } = new URL(request.url);
    const newSletterID = searchParams.get("newSletterID") 
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await newSletterModel.findByIdAndUpdate(newSletterID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const newSletter = await newSletterModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalnewSletter = await newSletterModel.countDocuments();

        return NextResponse.json({
            data: newSletter,
            total: totalnewSletter,
            currentPage: page,
            totalPages: Math.ceil(totalnewSletter / limit),
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
