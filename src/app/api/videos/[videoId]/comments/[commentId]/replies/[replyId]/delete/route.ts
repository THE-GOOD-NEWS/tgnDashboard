import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import VideoModel from "@/app/models/videoModel";
import InteractionsModel from "@/app/models/interactionsModel";
import mongoose from "mongoose";

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ videoId: string; commentId: string; replyId: string }>;
  },
) {
  try {
    // Connect to database
    await ConnectDB();

    // Get the current user session

    const { videoId, commentId, replyId } = await params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(commentId) ||
      !mongoose.Types.ObjectId.isValid(replyId)
    ) {
      return NextResponse.json(
        { error: "Invalid video, comment, or reply ID" },
        { status: 400 },
      );
    }

    // Find the video
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

    // Find the reply
    const reply = comment.replies.find(
      (r: any) => r._id.toString() === replyId,
    );

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Check if the user is the owner of the reply

    // Delete the reply from the comment
    await VideoModel.updateOne(
      { _id: videoId, "comments._id": new mongoose.Types.ObjectId(commentId) },
      {
        $pull: {
          "comments.$.replies": { _id: new mongoose.Types.ObjectId(replyId) },
        },
      },
    );

    // Delete the interaction record
    await InteractionsModel.deleteMany({
      targetType: "comment",
      actionType: "reply",
      targetId: commentId,
      replyId: replyId,
    });

    // Also delete any interactions related to this reply (likes)
    await InteractionsModel.deleteMany({
      targetType: "reply",
      targetId: replyId,
    });

    return NextResponse.json(
      { message: "Reply deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 },
    );
  }
}
