import mongoose from "mongoose";
import videoModel from "@/app/models/videoModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import UserModel from "@/app/models/userModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Creating video:", data);
    const newVideo = await videoModel.create(data);
    return NextResponse.json({ data: newVideo }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const req = await request.json();
    console.log("Deleting video:", req.videoID);

    const res = await videoModel.findByIdAndDelete(req.videoID);
    if (!res) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoID = searchParams.get("videoID");
    const req = await request.json();

    console.log("Updating video:", videoID, req);

    const res = await videoModel.findByIdAndUpdate(videoID, req, {
      new: true,
      runValidators: true,
    });

    if (!res) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const all = searchParams.get("all") === "true";
  const limit = all ? 0 : 10;
  const skip = all ? 0 : (page - 1) * limit;
  console.log("registering" + UserModel);
  try {
    // Create search query
    const searchQuery = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get total count
    const totalVideos = await videoModel.countDocuments(searchQuery);

    // Check if we should include likes and comments details
    const includeDetails = searchParams.get("includeDetails") === "true";

    // Get videos with pagination and sorting
    let query = videoModel.find(searchQuery);

    // If includeDetails is true, populate likes and comments
    if (includeDetails) {
      query = query.populate("likes").populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "username firstName lastName imageURL",
        },
      });
    }

    const videos = await query.sort({ createdAt: -1 }).skip(skip).limit(limit);

    return NextResponse.json(
      {
        data: videos,
        total: totalVideos,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalVideos / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
