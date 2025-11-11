import mongoose, { Schema, Document } from "mongoose";

export interface IArticleCategory extends Document {
  _id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const ArticleCategorySchema = new Schema<IArticleCategory>(
  {
    titleEn: { type: String, required: true, trim: true },
    titleAr: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: true,
  }
);

ArticleCategorySchema.index({ slug: 1 }, { unique: true });
ArticleCategorySchema.index({ titleEn: 1 });
ArticleCategorySchema.index({ titleAr: 1 });

ArticleCategorySchema.pre("save", function (next) {
  if (!this.slug && this.titleEn) {
    this.slug = this.titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

const ArticleCategoryModel =
  mongoose.models.articleCategories ||
  mongoose.model<IArticleCategory>("articleCategories", ArticleCategorySchema);

export default ArticleCategoryModel;