
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import collectionsModel from "@/app/models/collectionsModel";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const collectionID = searchParams.get("collectionID")!;
    console.log('collectionID'+collectionID)


    try {
        if (!collectionID ) {
            const collections = await collectionsModel.find().sort({ createdAt: -1 });
            console.log("collections", collections)
            return NextResponse.json(collections, { status: 200 });
        }
        else{

            const collection = await collectionsModel.findById(collectionID)
            return NextResponse.json({
                data: collection,
                // total: totalProducts,
                // currentPage: page,
                // totalPages: Math.ceil(totalProducts / limit),
            }, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    console.log('body', body)

    try {
        const newCollection = await collectionsModel.create(body);
        return NextResponse.json(newCollection, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }
}

export async function DELETE(request:Request){
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res= await collectionsModel.findByIdAndDelete(req.collectionID)
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
    const collectionID = searchParams.get("collectionID") 
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await collectionsModel.findByIdAndUpdate(collectionID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}