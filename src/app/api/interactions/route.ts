import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import InteractionsModel from "@/app/models/interactionsModel";
import mongoose from "mongoose";
import UserModel from "@/app/models/userModel";
import videoModel from "@/app/models/videoModel";
import blogModel from "@/app/models/blogModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: Get all interactions with pagination and filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const userId = searchParams.get("userId");
  const targetType = searchParams.get("targetType");
  const actionType = searchParams.get("actionType");
  const read = searchParams.get("read");
  const sortField = searchParams.get("sortField") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  await loadDB();
  console.log("register userModel" + UserModel);
  try {
    // Build query based on filters
    let query: any = {};

    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (read !== null && read !== undefined) {
      query.read = read === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortField] = sortOrder === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await InteractionsModel.countDocuments(query);

    // Get interactions with pagination and sorting

    console.log("before fetching" + videoModel);
    // First get all interactions
    let interactions = await InteractionsModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email imageURL");

    // Then populate video references only for video type interactions
    for (let i = 0; i < interactions.length; i++) {
      if (interactions[i].parentType === "video") {
        const videoData = await videoModel
          .findById(interactions[i].parentId)
          .select("title thumbnailUrl _id");

        if (videoData) {
          const data = {
            _id: videoData._id,
            title: videoData.title,
            thumbnail: videoData.thumbnailUrl,
          };
          interactions[i] = interactions[i].toObject();
          interactions[i].parentId = data;
        }
      } else if (interactions[i].parentType === "blog") {
        const blogData = await blogModel
          .findById(interactions[i].parentId)
          .select("title featuredImage _id");

        if (blogData) {
          const data = {
            _id: blogData._id,
            title: blogData.title,
            thumbnail: blogData.featuredImage,
          };
          interactions[i] = interactions[i].toObject();
          interactions[i].parentId = data;
        }
      }
    }
    console.log("problem" + JSON.stringify(interactions));
    return NextResponse.json(
      {
        data: interactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interactions" },
      { status: 500 },
    );
  }
}

// POST: Create a new interaction
export async function POST(request: Request) {
  await loadDB();

  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.userId ||
      !body.targetId ||
      !body.targetType ||
      !body.actionType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create new interaction
    const newInteraction = new InteractionsModel({
      userId: new mongoose.Types.ObjectId(body.userId),
      targetId: new mongoose.Types.ObjectId(body.targetId),
      targetType: body.targetType,
      actionType: body.actionType,
      content: body.content,
      parentId: body.parentId
        ? new mongoose.Types.ObjectId(body.parentId)
        : undefined,
      read: body.read !== undefined ? body.read : false,
    });

    await newInteraction.save();

    return NextResponse.json(
      { message: "Interaction created successfully", data: newInteraction },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating interaction:", error);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 },
    );
  }
}

// PUT: Update interactions in bulk (e.g., mark as read)
export async function PUT(request: Request) {
  await loadDB();

  try {
    const body = await request.json();

    // Check if we have IDs to update
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "No interaction IDs provided" },
        { status: 400 },
      );
    }

    // Convert string IDs to ObjectIds
    const objectIds = body.ids.map(
      (id: string) => new mongoose.Types.ObjectId(id),
    );

    // Build update object
    const updateData: any = {};

    if (body.read !== undefined) {
      updateData.read = body.read;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 },
      );
    }

    // Update interactions
    const result = await InteractionsModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData },
    );

    return NextResponse.json(
      {
        message: "Interactions updated successfully",
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating interactions:", error);
    return NextResponse.json(
      { error: "Failed to update interactions" },
      { status: 500 },
    );
  }
}

// DELETE: Delete interactions
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  await loadDB();

  try {
    if (!id) {
      return NextResponse.json(
        { error: "No interaction ID provided" },
        { status: 400 },
      );
    }

    const result = await InteractionsModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: "Interaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Interaction deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting interaction:", error);
    return NextResponse.json(
      { error: "Failed to delete interaction" },
      { status: 500 },
    );
  }
}
