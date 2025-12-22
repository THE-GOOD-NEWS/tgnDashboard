import mongoose, { Schema, Document } from "mongoose";

export interface IInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  notifyUserId?: mongoose.Types.ObjectId;
  broadcast: boolean;
  targetId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  parentType?: "video" | "article";
  replyId?: mongoose.Types.ObjectId;
  targetType: "video" | "comment" | "reply" | "article";
  actionType: "like" | "unlike" | "comment" | "reply";
  link: string;
  content?: string; // For comments/replies
  read: boolean; // For notification tracking
  createdAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    notifyUserId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
      index: true,
    },
    broadcast: {
      type: Boolean,
      default: false,
      required: false,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    link: {
      type: String,
      required: false,
    },
    targetType: {
      type: String,
      enum: ["video", "comment", "reply", "article"],
      required: true,
    },
    actionType: {
      type: String,
      enum: ["like", "unlike", "comment", "reply"],
      required: true,
    },
    parentType: {
      type: String,
      enum: ["video", "article"],
      required: false,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for efficient querying
InteractionSchema.index({ userId: 1, createdAt: -1 });
InteractionSchema.index({ targetId: 1, targetType: 1 });
InteractionSchema.index({ read: 1, createdAt: -1 });
InteractionSchema.index({ actionType: 1 });

// Create a TTL index to expire old interactions after 90 days
// You can adjust this based on how long you want to keep the history
InteractionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

const InteractionsModel =
  mongoose.models.interactions ||
  mongoose.model<IInteraction>("interactions", InteractionSchema);

export default InteractionsModel;
