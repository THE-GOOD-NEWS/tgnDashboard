import mongoose, { Schema, Document } from "mongoose";

export interface IWorkshopPackageRequest extends Document {
  packageId: mongoose.Types.ObjectId;
  selectedWorkshops: mongoose.Types.ObjectId[];
  name: string;
  phone: string;
  email: string;
  instapayImage: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopPackageRequestSchema = new Schema<IWorkshopPackageRequest>(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "workshopPackages",
      required: true,
    },
    selectedWorkshops: [
      {
        type: Schema.Types.ObjectId,
        ref: "workshops",
      },
    ],
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    instapayImage: { type: String, required: true },
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

const WorkshopPackageRequestModel =
  mongoose.models.workshopPackageRequests ||
  mongoose.model<IWorkshopPackageRequest>(
    "workshopPackageRequests",
    WorkshopPackageRequestSchema
  );

export default WorkshopPackageRequestModel;
