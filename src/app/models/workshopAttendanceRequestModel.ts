import mongoose, { Schema, Document } from "mongoose";

export const AREA_OF_RESIDENCE_OPTIONS = [
  "Nasr City",
  "Heliopolis",
  "New Cairo",
  "Madinaty",
  "El-Shorouk",
  "Maadi",
  "Giza (ElMohandiseen, Agouza, Zamalek..etc)",
  "6th of October",
  "Other City",
] as const;

export type AreaOfResidence = (typeof AREA_OF_RESIDENCE_OPTIONS)[number];

export interface IWorkshopAttendanceRequest extends Document {
  workshopId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  howDidYouKnow: "TGN" | "Instructor page" | "Ads" | "Friends and Family";
  areaOfResidence?: string;
  age?: number;
  type: "available" | "waitlist";
  instapayImage: string;
  status?: "pending" | "approved" | "rejected" | "archived";
  notes?: string;
  seen: boolean;
  checkInToken?: string;
  checkedIn?: boolean;
  checkedInAt?: Date;
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
    areaOfResidence: {
      type: String,
      enum: AREA_OF_RESIDENCE_OPTIONS,
      required: false,
    },
    age: {
      type: Number,
      required: false,
      min: 0,
    },
    type: {
      type: String,
      enum: ["available", "waitlist"],
      required: true,
    },
    instapayImage: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      required: false,
    },
    notes: { type: String, trim: true },
    seen: { type: Boolean, default: false },
    checkInToken: { type: String, index: true, sparse: true },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
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
