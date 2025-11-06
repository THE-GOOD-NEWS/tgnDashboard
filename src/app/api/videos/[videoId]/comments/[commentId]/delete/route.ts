import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import VideoModel from "@/app/models/videoModel";
import InteractionsModel from "@/app/models/interactionsModel";
import mongoose from "mongoose";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ videoId: string; commentId: string }> },
) {
  try {
    // Connect to database
    await ConnectDB();

    // Get the current user session

    const { videoId, commentId } = await params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json(
        { error: "Invalid video or comment ID" },
        { status: 400 },
      );
    }

    // Find the video and comment
    const video = await VideoModel.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Find the comment
    const comment = video.comments.find(
      (c: any) => c._id.toString() === commentId,
    );

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if the user is the owner of the comment

    // Delete the comment from the video
    await VideoModel.findByIdAndUpdate(videoId, {
      $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } },
    });

    // Delete the interaction record
    await InteractionsModel.deleteMany({
      targetType: "video",
      actionType: "comment",
      targetId: videoId,
      "metadata.commentId": commentId,
    });

    // Also delete any interactions related to this comment (likes, replies)
    await InteractionsModel.deleteMany({
      targetType: "comment",
      targetId: commentId,
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
