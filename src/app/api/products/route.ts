import ordersModel from "@/app/models/ordersModel";
import mongoose from "mongoose";
import productsModel from "@/app/models/productsModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import subCategoryModel from "@/app/models/subCategoryModel"; // must import so it's registered
import categoriesModel from "@/app/models/categoriesModel";

const loadDB = async () => {
  await ConnectDB();
};
console.log("subCategoryModel + categoriesModel registered:", subCategoryModel ,categoriesModel);
loadDB();
export async function POST(req: Request, res: Response) {
  console.log("working");
  try {
    const data = await req.json();
    console.log(data);
    const newProduct = await productsModel.create(data);
    return NextResponse.json({ data: newProduct }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await productsModel.findByIdAndDelete(req.productID);
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
  const productID = searchParams.get("productID");
  console.log("working");
  const req = await request.json();
  console.log(req);

  console.log("working");
  try {
    const res = await productsModel.findByIdAndUpdate(productID, req, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    console.log(error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const all = searchParams.get("all") === "true";
  const limit = all ? 0 : 10; // If all is true, don't limit the results
  const skip = all ? 0 : (page - 1) * limit;

  try {
    // Create search query
    const searchQuery = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    // First get total count with search filter
    const totalProducts = await productsModel.countDocuments(searchQuery);

    // Then get products with search filter and proper sorting
    console.log("Registered models:", Object.keys(mongoose.models));
    const products = await productsModel
      .find(searchQuery)
      .populate({
        path: "subCategoryID",
        model: "subCategories",
        options: { strictPopulate: false },
        // Handle orphaned subcategories by using match to filter out invalid references
        // match: { _id: { $exists: true } },
        populate: {
          path: "categoryID",
          model: "categories", 
          options: { strictPopulate: false },
          // Handle orphaned categories as well
          // match: { _id: { $exists: true } }
        },
      })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out products with null/undefined subCategoryID after populate
    const validProducts = products.filter(product => 
      product.subCategoryID && 
      product.subCategoryID._id && 
      product.subCategoryID.categoryID
    );

    console.log("Valid products count:", validProducts.length);
    if (validProducts.length > 0) {
      console.log("Sample product subCategoryID:", validProducts[0].subCategoryID);
    }

    return NextResponse.json(
      {
        data: products,
        total: totalProducts,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalProducts / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
