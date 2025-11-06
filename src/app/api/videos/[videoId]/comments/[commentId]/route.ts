import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import videoModel from "@/app/models/videoModel";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// DELETE: Delete a specific comment from a video
export async function DELETE(
  request: Request,
  { params }: { params: { videoId: string; commentId: string } }
) {
  try {
    const { videoId, commentId } = params;

    // Find the video and update it by pulling the comment with the given ID
    const updatedVideo = await videoModel.findByIdAndUpdate(
      videoId,
      {
        $pull: { comments: { _id: commentId } },
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
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}