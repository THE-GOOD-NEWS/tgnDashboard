import mongoose, { Schema, Document } from "mongoose";
import { Video, VideoComment, VideoReply } from "@/interfaces/interfaces";

// Define the VideoReply schema
const VideoReplySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  username: { type: String, required: true }, // Keep for backward compatibility
  text: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "users" }], // Array of user references who liked this reply
  createdAt: { type: Date, default: Date.now },
});

// Define the VideoComment schema
const VideoCommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  username: { type: String, required: true }, // Keep for backward compatibility
  text: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "users" }], // Array of user references who liked this comment
  replies: [VideoReplySchema], // Array of replies to this comment
  createdAt: { type: Date, default: Date.now },
});

// Define the Video schema
const VideoSchema = new Schema<Video>(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "users" }], // Array of user references who liked the video
    comments: [VideoCommentSchema], // Array of comments
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
  },
);

// Create and export the Video model
const videoModel =
  mongoose.models.videos || mongoose.model<Video>("videos", VideoSchema);
export default videoModel;
