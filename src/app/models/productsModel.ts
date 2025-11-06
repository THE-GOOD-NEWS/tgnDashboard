// models/product.ts
import mongoose, { Schema, Document } from "mongoose";
import {
  Product,
  Variant,
  attribute,
  media,
  mediaType,
  price,
} from "@/interfaces/interfaces";
import path from "path";

// Define the media schema
const mediaSchema = new Schema<media>({
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ["image", "video"] as mediaType[],
    required: true,
  },
});

// Define the attribute schema (replacing sizeSchema)
const attributeSchema = new Schema<attribute>({
  name: { type: String, required: true }, // e.g., "Color" or "Size"
  stock: { type: Number, required: true, min: 0 },
});

// Define the Variant schema
const VariantSchema = new Schema<Variant>({
  name: { type: String, required: false }, // e.g., "Default Variant"
  attributeName: { type: String, required: true }, // e.g., "Color" or "Size"
  attributes: {
    type: [attributeSchema],
    required: true,
    validate: {
      validator: function (v: attribute[]) {
        return v.length > 0;
      },
      message: "At least one attribute is required",
    },
  },
  images: {
    type: [mediaSchema],
    required: true,
    validate: {
      validator: function (v: media[]) {
        return v.length > 0;
      },
      message: "At least one image is required",
    },
  },
});

// Define the price schema
const priceSchema = new Schema<price>({
  local: { type: Number, required: true, min: 0 },
  global: { type: Number, required: false, min: 0, default: 0 },
});

// Define the Product schema
// const ProductSchema = new Schema<Product>({
const ProductSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subCategoryID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "subCategories",
    options: { strictPopulate: false },
  },

  season: { type: String, required: false },
  price: { type: priceSchema, required: true },
  comparedPrice: { type: Number, required: false, min: 0 },
  productDimensions: { type: [String], default: [] },
  productDetails: { type: [String], default: [] },
  productCare: { type: [String], default: [] },
  variations: {
    type: [VariantSchema],
    required: true,
    validate: {
      validator: function (v: Variant[]) {
        return v.length > 0;
      },
      message: "At least one variation is required",
    },
  },
  featured: { type: Boolean, default: false },
  ratings: { type: Number, default: 0, min: 0 },
});

// Create and export the Product model
const productsModel =
  mongoose.models.products ||
  mongoose.model<Product>("products", ProductSchema);
export default productsModel;
