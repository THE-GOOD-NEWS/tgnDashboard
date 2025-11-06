import mongoose, { Schema, Document } from "mongoose";
import { Ipackage, PackageCard, PackageItem } from "@/interfaces/interfaces";

// Define the Package Card schema
const PackageCardSchema = new Schema<PackageCard>({
  image: { type: String, required: true },
  points: { type: [String], required: true },
});

// Define the Package schema
const PackageSchema = new Schema<Ipackage>(
  {
    name: { type: String, required: true },
    imgUrl: { type: String, required: true },
    images: { type: [String], required: false, default: [] },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: false },
    duration: { type: String, required: true },
    items: {
      type: [{ value: String, included: Boolean }],
      required: true,
      default: [],
    },
    notes: { type: [String], required: true, default: [] },
    cards: { type: [PackageCardSchema], required: false, default: [] },
  },
  {
    timestamps: true,
  },
);

// Create and export the Package model
const packageModel =
  mongoose.models.packages ||
  mongoose.model<Ipackage>("packages", PackageSchema);

export default packageModel;
