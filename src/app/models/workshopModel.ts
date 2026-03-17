import mongoose, { Schema, Document } from "mongoose";

// ─── Session sub-document ────────────────────────────────────────────────────
export interface ISession {
  title: string;
  sessionStartDate: Date;
  startTime: string;    // "HH:MM" 24-hour format
  duration: number;     // minutes
  includes: string[];
  description?: string;
}

// ─── Attendance Schema ────────────────────────────────────────────────────────
export interface IAttendance {
  name: string;
  email: string;
  phone: string;
}

// ─── Workshop document ────────────────────────────────────────────────────────
export interface IWorkshop extends Document {
  title: string;
  slug: string;
  instructors: string[];
  images: string[];     // ordered Cloudinary URLs
  location: {
    altText: string;
    link: string;
    moreDescription?: string;
  };
  briefy: string;
  description: string;
  policy?: string;
  startDate: Date;
  endDate: Date;
  price: number;
  slots: number;
  attendance: IAttendance[];
  availableSessions: ISession[];
  visits: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Session Schema ───────────────────────────────────────────────────────────
const SessionSchema = new Schema<ISession>(
  {
    title: { type: String, required: true, trim: true },
    sessionStartDate: { type: Date, required: true },
    startTime: { type: String, required: false, trim: true },
    duration: { type: Number, required: false, min: 0, default: 0 },
    includes: { type: [String], default: [] },
    description: { type: String },
  },
  { _id: true },
);

// ─── Attendance Schema ────────────────────────────────────────────────────────
const AttendanceSchema = new Schema<IAttendance>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: true },
);

// ─── Workshop Schema ──────────────────────────────────────────────────────────
const WorkshopSchema = new Schema<IWorkshop>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    instructors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    location: {
      altText: { type: String, trim: true },
      link: { type: String, trim: true },
      moreDescription: { type: String, trim: true },
    },
    briefy: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    policy: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    slots: { type: Number, required: true, min: 0, default: 0 },
    attendance: { type: [AttendanceSchema], default: [] },
    availableSessions: { type: [SessionSchema], default: [] },
    notes: { type: String },
    visits: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

WorkshopSchema.index({ startDate: 1 });

WorkshopSchema.pre("save", function (this: IWorkshop, next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

const WorkshopModel =
  mongoose.models.workshops ||
  mongoose.model<IWorkshop>("workshops", WorkshopSchema);

export default WorkshopModel;
