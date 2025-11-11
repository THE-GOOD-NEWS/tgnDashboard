import ArticleCategoryModel from "@/app/models/articleCategoryModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - Fetch single category by id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const category = await ArticleCategoryModel.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ data: category }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching article category:", error);
    return NextResponse.json({ error: "Failed to fetch article category" }, { status: 500 });
  }
}