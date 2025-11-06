import mongoose, { Schema } from "mongoose";

export interface IFavorite {
  _id: string;
  title: string;
  image: string;
  link: string;
  clickCount: number;
  category: string;
  subCategory: string;
  brand: string;
  price?: number;
  maxPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    maxPrice: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true },
);

// Create indexes for common queries
FavoriteSchema.index({ category: 1, subCategory: 1 });
FavoriteSchema.index({ clickCount: -1 });

const FavoritesModel =
  mongoose.models.favorites ||
  mongoose.model<IFavorite>("favorites", FavoriteSchema);

export default FavoritesModel;
