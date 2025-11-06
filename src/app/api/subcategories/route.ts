import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import subCategoryModel from "@/app/models/subCategoryModel";
import { ConnectDB } from "@/config/db";
import mongoose from "mongoose";
import categoriesModel from "@/app/models/categoriesModel";
const loadDB = async () => {
  await ConnectDB();
};

loadDB();
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryID = searchParams.get("categoryID");
  const subCategoryID = searchParams.get("subCategoryID");
  console.log("Registering categoriesModel"+categoriesModel)

  if (categoryID) {
    try {
      // Convert the categoryID to ObjectId
      const categoryObjectId = new mongoose.Types.ObjectId(categoryID);
      
      // Query using the ObjectId
      const res = await subCategoryModel.find({
        categoryID: categoryObjectId
      });
      console.log("subcategories", res);
      return NextResponse.json({ data: res }, { status: 200 });
    } catch (error) {
      console.error("Error:", error);
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }
  } else if (subCategoryID) {
    try {
      const subcategory = await subCategoryModel.findById(subCategoryID);
      if (!subcategory) {
        return NextResponse.json(
          { error: "Subcategory not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: subcategory });
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      return NextResponse.json(
        { error: "Failed to fetch subcategory with subCategoryID" },
        { status: 500 }
      );
    }
  }
else{
  try {
    const subCategories = await subCategoryModel.find().populate({
          path: "categoryID",
          model: "categories",
          options: { strictPopulate: false }
        });
        
        const processedSubCategories = subCategories.map(subCat => ({
          ...subCat.toObject(),
          categoryID: subCat.categoryID || { categoryName: "Category Deleted" }
        }));
        
        console.log("subCategories", processedSubCategories);
        return NextResponse.json({ data: processedSubCategories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 },
    );
  }
}
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();

    const result = await subCategoryModel.create({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Subcategory created successfully",
      data: { _id: result.insertedId, ...body },
    });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const subCategoryID = searchParams.get("subCategoryID");

    if (!subCategoryID) {
      return NextResponse.json(
        { error: "Subcategory ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = await db.collection("subcategories").updateOne(
      { _id: new ObjectId(subCategoryID) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Subcategory updated successfully",
      data: { _id: subCategoryID, ...body },
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { subCategoryID } = body;

    if (!subCategoryID) {
      return NextResponse.json(
        { error: "Subcategory ID is required" },
        { status: 400 },
      );
    }

    const result = await db.collection("subcategories").deleteOne({
      _id: new ObjectId(subCategoryID),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 },
    );
  }
}
