import { NextRequest, NextResponse } from "next/server";
import videoModel from "@/app/models/videoModel";
import UserModel from "@/app/models/userModel";
import InteractionsModel from "@/app/models/interactionsModel";
import { ConnectDB } from "@/config/db";

// GET - Get all comments for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;
    await ConnectDB();

    // Find the video with populated user data
    const video = await videoModel
      .findById(videoId)
      .populate({
        path: "comments.userId",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.likes",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.replies.userId",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.replies.likes",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .lean();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Transform populated data to maintain API compatibility
    const videoData = video as any; // Type assertion to access comments
    const commentsWithUserDetails = (videoData.comments || []).map(
      (comment: any) => {
        const userData = comment.userId || {};

        // Process replies to add user details
        const repliesWithUserDetails = (comment.replies || []).map(
          (reply: any) => {
            const replyUserData = reply.userId || {};
            return {
              ...reply,
              userImage: replyUserData.imageURL || "",
              firstName: replyUserData.firstName || "",
              lastName: replyUserData.lastName || "",
              // Keep userId as a string reference for backward compatibility
              userId: reply.userId?._id?.toString() || reply.userId,
            };
          },
        );

        return {
          ...comment,
          userImage: userData.imageURL || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          // Keep userId as a string reference for backward compatibility
          userId: comment.userId?._id?.toString() || comment.userId,
          // Replace replies with the processed ones
          replies: repliesWithUserDetails,
        };
      },
    );

    return NextResponse.json({
      success: true,
      comments: commentsWithUserDetails || [],
    });
  } catch (error: any) {
    console.error("Error getting video comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Add a comment to a video
