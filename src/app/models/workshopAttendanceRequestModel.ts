import mongoose, { Schema, Document } from "mongoose";

export interface IWorkshopAttendanceRequest extends Document {
  workshopId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  howDidYouKnow: "TGN" | "Instructor page" | "Ads" | "Friends and Family";
  type: "available" | "waitlist";
  instapayImage: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopAttendanceRequestSchema = new Schema<IWorkshopAttendanceRequest>(
  {
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: "workshops",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    howDidYouKnow: {
      type: String,
      enum: ["TGN", "Instructor page", "Ads", "Friends and Family"],
      required: true,
    },
    type: {
      type: String,
      enum: ["available", "waitlist"],
      required: true,
    },
    instapayImage: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: { type: String, trim: true },
    seen: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const WorkshopAttendanceRequestModel =
  mongoose.models.workshopAttendanceRequests ||
  mongoose.model<IWorkshopAttendanceRequest>(
    "workshopAttendanceRequests",
    WorkshopAttendanceRequestSchema
  );

export default WorkshopAttendanceRequestModel;
