import ArticleModel from "@/app/models/articleModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - Fetch a single article by slug
export async function GET(
  req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const article = await ArticleModel.findOne({ slug });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data: article }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 },
    );
  }
}

// PATCH - Update view count
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;
    const { action } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (action === "increment_view") {
      const article = await ArticleModel.findOneAndUpdate(
        { slug },
        { $inc: { viewCount: 1 } },
        { new: true },
      );

      if (!article) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: article }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 },
    );
  }
}
