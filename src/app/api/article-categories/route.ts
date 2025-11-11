import ArticleCategoryModel from "@/app/models/articleCategoryModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - List categories with pagination, search, status filter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const all = searchParams.get("all") === "true";
    const limit = all ? 0 : 10;
    const skip = all ? 0 : (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { titleEn: { $regex: search, $options: "i" } },
        { titleAr: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const total = await ArticleCategoryModel.countDocuments(query);
    const categories = await ArticleCategoryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        data: categories,
        total,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching article categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch article categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { titleEn, titleAr, slug: incomingSlug, status } = data || {};

    if (!titleEn || !titleAr) {
      return NextResponse.json(
        { error: "Both English and Arabic titles are required" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let slug = incomingSlug;
    if (!slug) {
      slug = String(titleEn)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    // Ensure slug uniqueness
    const existing = await ArticleCategoryModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const newCategory = await ArticleCategoryModel.create({
      titleEn,
      titleAr,
      slug,
      status: status || "active",
    });

    return NextResponse.json({ data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating article category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a category
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const data = await req.json();

    // If slug changed, ensure uniqueness
    if (data.slug) {
      const conflict = await ArticleCategoryModel.findOne({ slug: data.slug, _id: { $ne: id } });
      if (conflict) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const updated = await ArticleCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating article category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a category
export async function DELETE(req: Request) {
  try {
    const { categoryId } = await req.json();
    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const deleted = await ArticleCategoryModel.findByIdAndDelete(categoryId);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted", data: deleted }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting article category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}