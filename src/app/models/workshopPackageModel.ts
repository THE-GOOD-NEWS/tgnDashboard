import mongoose, { Schema, Document } from "mongoose";

export interface IWorkshopPackage extends Document {
  thumbnail: string;
  slug: string;
  title: string;
  price: number;
  maxWorkshops: number;
  // if true, this package includes all available workshops
  isAllWorkshopsIncluded: boolean;
  // if isAllWorkshopsIncluded is false, this is the array of allowed workshop ObjectIds
  includedWorkshops: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopPackageSchema = new Schema<IWorkshopPackage>(
  {
    thumbnail: { type: String, required: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    maxWorkshops: { type: Number, required: true, min: 1 },
    isAllWorkshopsIncluded: { type: Boolean, default: false },
    includedWorkshops: { type: [String], default: [] },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

WorkshopPackageSchema.pre("save", function (this: IWorkshopPackage, next) {
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

const WorkshopPackageModel =
  mongoose.models.workshopPackages ||
  mongoose.model<IWorkshopPackage>("workshopPackages", WorkshopPackageSchema);

export default WorkshopPackageModel;
