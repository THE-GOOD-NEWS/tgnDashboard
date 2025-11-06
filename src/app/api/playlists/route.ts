import mongoose from "mongoose";
import playlistModel from "@/app/models/playlistModel";
import videoModel from "@/app/models/videoModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();
console.log("reagistering" + videoModel)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Creating playlist:", data);
    const newPlaylist = await playlistModel.create(data);
    return NextResponse.json({ data: newPlaylist }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating playlist:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const req = await request.json();
    console.log("Deleting playlist:", req.playlistID);
    
    const res = await playlistModel.findByIdAndDelete(req.playlistID);
    if (!res) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistID = searchParams.get("playlistID");
    const req = await request.json();
    
    console.log("Updating playlist:", playlistID, req);
    
    const res = await playlistModel.findByIdAndUpdate(playlistID, req, {
      new: true,
      runValidators: true,
    });
    
    if (!res) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: res }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating playlist:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const all = searchParams.get("all") === "true";
  // const limit = all ? 0 : 10;
  // const skip = all ? 0 : (page - 1) * limit;

  try {
    // Create search query
    const searchQuery = search
      ? { 
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    // Get total count
    const totalPlaylists = await playlistModel.countDocuments(searchQuery);

    // Get playlists with populated videos and pagination
    const playlists = await playlistModel
      .find(searchQuery)
      .populate({
        path: "videos",
        model: "videos",
        select: "title description thumbnailUrl duration isPublished"
      })
      .sort({ order: 1, createdAt: -1 })
      // .skip(skip)
      // .limit(limit);

    return NextResponse.json(
      {
        data: playlists,
        total: totalPlaylists,
        // currentPage: page,
        // totalPages: all ? 1 : Math.ceil(totalPlaylists / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderedIds } = await request.json();
    console.log("order"+orderedIds)
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
    }
    // Update each playlist's order field
    const bulkOps = orderedIds.map((id: string, idx: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: idx },
      },
    }));
    await playlistModel.bulkWrite(bulkOps);
    console.log("patch success")
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating playlist order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 