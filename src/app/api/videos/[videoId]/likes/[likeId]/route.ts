import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import videoModel from "@/app/models/videoModel";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// DELETE: Delete a specific like from a video
export async function DELETE(
  request: Request,
  { params }: { params: { videoId: string; likeId: string } }
) {
  try {
    const { videoId, likeId } = params;

    // Find the video and update it by pulling the like with the given ID
    const updatedVideo = await videoModel.findByIdAndUpdate(
      videoId,
      {
        $pull: { likes: likeId },
      },
      { new: true }
    );

    if (!updatedVideo) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Like deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting like:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}