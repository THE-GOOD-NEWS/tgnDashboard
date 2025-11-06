import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import InteractionsModel from "@/app/models/interactionsModel";
import VideoModel from "@/app/models/videoModel";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

// GET: Get a single interaction by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await loadDB();

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid interaction ID" },
        { status: 400 },
      );
    }

    const interaction = await InteractionsModel.findById(id)
      .populate("userId", "name email")
      .lean();

    if (!interaction) {
      return NextResponse.json(
        { error: "Interaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: interaction }, { status: 200 });
  } catch (error) {
    console.error("Error fetching interaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch interaction" },
      { status: 500 },
    );
  }
}

// PATCH: Update a single interaction
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await loadDB();

  try {
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid interaction ID" },
        { status: 400 },
      );
    }

    // Build update object
    const updateData: any = {};

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    if (body.read !== undefined) {
      updateData.read = body.read;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 },
      );
    }

    const updatedInteraction = await InteractionsModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    if (!updatedInteraction) {
      return NextResponse.json(
        { error: "Interaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Interaction updated successfully", data: updatedInteraction },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating interaction:", error);
    return NextResponse.json(
      { error: "Failed to update interaction" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a single interaction and its corresponding action
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await loadDB();

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid interaction ID" },
        { status: 400 },
      );
    }

    // Find the interaction first to get its details
    const interaction = await InteractionsModel.findById(id);

    if (!interaction) {
      return NextResponse.json(
        { error: "Interaction not found" },
        { status: 404 },
      );
    }

    // Handle cascading deletion based on interaction type
    if (interaction.targetType === "video") {
      if (
        interaction.actionType === "like" ||
        interaction.actionType === "unlike"
      ) {
        // Remove user from video likes array
        await VideoModel.findByIdAndUpdate(interaction.targetId, {
          $pull: { likes: interaction.userId },
        });
      } else if (interaction.actionType === "comment") {
        // Remove comment from video based on userId and content
        await VideoModel.findByIdAndUpdate(interaction.targetId, {
          $pull: {
            comments: { userId: interaction.userId, text: interaction.content },
          },
        });
      }
    } else if (interaction.targetType === "comment") {
      if (
        interaction.actionType === "like" ||
        interaction.actionType === "unlike"
      ) {
        // Remove user from comment likes array
        await VideoModel.findOneAndUpdate(
          { "comments._id": interaction.targetId },
          { $pull: { "comments.$.likes": interaction.userId } },
        );
      } else if (interaction.actionType === "reply") {
        console.log("hereeee");
        // Remove reply from comment
        await VideoModel.findOneAndUpdate(
          { "comments._id": interaction.targetId },
          { $pull: { "comments.$.replies": { _id: interaction.replyId } } },
        );
      }
    } else if (interaction.targetType === "reply") {
      if (
        interaction.actionType === "like" ||
        interaction.actionType === "unlike"
      ) {
        // Find the video containing the comment with the reply
        const video = await VideoModel.findOne({
          "comments.replies._id": interaction.targetId,
        });

        if (video) {
          // Find the comment containing the reply
          const comment = video.comments.find((comment: any) =>
            comment.replies.some(
              (reply: any) =>
                reply._id.toString() === interaction.targetId.toString(),
            ),
          );

          if (comment) {
            // Find the reply and remove the user from its likes
            const replyIndex = comment.replies.findIndex(
              (reply: any) =>
                reply._id.toString() === interaction.targetId.toString(),
            );

            if (replyIndex !== -1) {
              // Remove the user from the reply's likes
              comment.replies[replyIndex].likes = comment.replies[
                replyIndex
              ].likes.filter(
                (userId: any) =>
                  userId.toString() !== interaction.userId.toString(),
              );

              await video.save();
            }
          }
        }
      } else if (interaction.actionType === "reply") {
        console.log("it's reply");
        // Remove the reply itself from the comment
        await VideoModel.updateOne(
          { "comments.replies._id": interaction.targetId },
          { $pull: { "comments.$.replies": { _id: interaction.targetId } } },
        );
      }
    }

    // Delete the interaction
    await InteractionsModel.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Interaction and corresponding action deleted successfully" },
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
