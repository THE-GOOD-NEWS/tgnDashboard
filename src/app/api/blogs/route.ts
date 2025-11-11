import ArticleModel from "@/app/models/articleModel";
import UserModel from "@/app/models/userModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - Fetch all articles with pagination, search, and filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const tag = searchParams.get("tag") || "";
    const featured = searchParams.get("featured");
    const all = searchParams.get("all") === "true";

    const limit = all ? 0 : 10;
    const skip = all ? 0 : (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};

    // Text search in title, content, and excerpt
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { "blocks.textHtml": { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      searchQuery.status = status;
    }

    // Filter by category
    if (category) {
      searchQuery.categories = { $in: [category] };
    }

    // Filter by tag
    if (tag) {
      searchQuery.tags = { $in: [tag] };
    }

    // Filter by author

    // Filter by featured
    if (featured !== null && featured !== undefined) {
      searchQuery.featured = featured === "true";
    }

    // Get total count
    const totalArticles = await ArticleModel.countDocuments(searchQuery);

    // Get articles with population
    const articles = await ArticleModel.find(searchQuery)

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        data: articles,
        total: totalArticles,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalArticles / limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}

// POST - Create a new article
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validate required fields: title and either content or blocks
    // const hasContent = !!(data.content && typeof data.content === "string" && data.content.trim().length);
    const hasBlocks = Array.isArray(data.blocks) && data.blocks.length > 0;
    if (!data.title || !hasBlocks) {
      return NextResponse.json(
        { error: "Title and content (rich text or blocks) are required" },
        { status: 400 },
      );
    }

    // Check if author exists
    // const authorExists = await UserModel.findById(data.author);
    // if (!authorExists) {
    //   return NextResponse.json(
    //     { error: "Author not found" },
    //     { status: 404 }
    //   );
    // }

    // Generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    // Check if slug already exists
    const existingArticle = await ArticleModel.findOne({ slug: data.slug });
    if (existingArticle) {
      // Append timestamp to make it unique
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Auto-generate excerpt if not provided
    // if (!data.excerpt) {
    //   const baseText = hasContent
    //     ? String(data.content)
    //     : String((data.blocks || []).map((b: any) => b.textHtml || '').join(' '));
    //   const stripped = baseText.replace(/<[^>]*>/g, '').trim();
    //   data.excerpt = stripped.slice(0, 300);
    // }

    // Fallback: generate content HTML from blocks if missing (compat with older schemas)
    // if (!hasContent && hasBlocks) {
    //   const contentHtml = String((data.blocks || [])
    //     .map((b: any) => b.textHtml || '')
    //     .filter((s: string) => s && s.trim().length)
    //     .join('\n<hr/>\n'));
    //   data.content = contentHtml || '<p></p>';
    // }

    const newArticle = await ArticleModel.create(data);

    // Populate author information
    // await newArticle.populate({
    //   path: "author",
    //   model: "users",
    //   select: "username firstName lastName email imageURL"
    // });

    return NextResponse.json({ data: newArticle }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a article
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("id");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 },
      );
    }

    const data = await req.json();

    // If slug is being updated, check for uniqueness
    if (data.slug) {
      const existingArticle = await ArticleModel.findOne({
        slug: data.slug,
        _id: { $ne: articleId },
      });
      if (existingArticle) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 },
        );
      }
    }

    // If excerpt provided as empty and content/blocks present, regenerate
    if (!data.excerpt && (data.content || data.blocks)) {
      const hasContent = !!(
        data.content &&
        typeof data.content === "string" &&
        data.content.trim().length
      );
      const baseText = hasContent
        ? String(data.content)
        : String(
            (data.blocks || []).map((b: any) => b.textHtml || "").join(" "),
          );
      const stripped = baseText.replace(/<[^>]*>/g, "").trim();
      data.excerpt = stripped.slice(0, 300);
    }

    // Fallback: generate content HTML from blocks if missing
    if (
      (!data.content || !String(data.content).trim().length) &&
      Array.isArray(data.blocks) &&
      data.blocks.length
    ) {
      const contentHtml = String(
        (data.blocks || [])
          .map((b: any) => b.textHtml || "")
          .filter((s: string) => s && s.trim().length)
          .join("\n<hr/>\n"),
      );
      data.content = contentHtml || "<p></p>";
    }

    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      articleId,
      data,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedArticle }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a article
export async function DELETE(req: Request) {
  try {
    const data = await req.json();
    const { articleId } = data;

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 },
      );
    }

    const deletedArticle = await ArticleModel.findByIdAndDelete(articleId);

    if (!deletedArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Article deleted successfully", data: deletedArticle },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
