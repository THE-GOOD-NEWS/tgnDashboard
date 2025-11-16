import mongoose, { Schema, Document } from "mongoose";

// Define the Article interface
// Define block-based content types
export type BlockLayout = "img-left" | "img-block";

export interface IContentBlock {
  type: "text" | "image" | "imageText";
  textHtml?: string;
  imageUrl?: string;
  caption?: string;
  alt?: string;
  layout?: BlockLayout; // img-left = image beside text, img-block = image above text
  arabicContent?: string; // New optional field for Arabic content
}

export interface IArticle extends Document {
  _id: string;
  title: string;
  titleAR?: string;
  slug: string;
  content?: string; // Rich text content (HTML)
  blocks?: IContentBlock[]; // Optional structured blocks for future designs
  excerpt: string;
  excerptAR?: string;
  featuredImage?: string;
  tikTokVideoUrl?: string;
  author?: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  tags: string[];
  categories: mongoose.Types.ObjectId[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
  viewCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Article schema
const ArticleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleAR: {
      type: String,
      required: false,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: false,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9\s-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    content: {
      type: String,
      required: false,
    },
    blocks: [
      new Schema<IContentBlock>(
        {
          type: {
            type: String,
            enum: ["text", "image", "imageText"],
            required: true,
          },
          textHtml: { type: String },
          imageUrl: { type: String },
          caption: { type: String },
          arabicContent: { type: String },
          alt: { type: String },
          layout: {
            type: String,
            enum: ["img-left", "img-block"],
            default: "img-block",
          },
        },
        { _id: false },
      ),
    ],
    excerpt: {
      type: String,
      required: false,
    },
    excerptAR: {
      type: String,
      required: false,
    },
    featuredImage: {
      type: String,
      required: false,
    },
    tikTokVideoUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty values
          // Validate TikTok URL format
          return (
            /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/.test(v) ||
            /^https:\/\/vm\.tiktok\.com\/[\w]+/.test(v)
          );
        },
        message: "Please enter a valid TikTok video URL",
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: false,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 30;
        },
        message: "Maximum 30 tags allowed",
      },
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "articleCategories",
      },
    ],
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create indexes for better performance
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ featured: 1, status: 1 });

// Pre-save middleware to auto-generate slug if not provided
ArticleSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

// Virtual for reading time estimation (assuming 200 words per minute)
ArticleSchema.virtual("readingTime").get(function () {
  let text = "";
  if (this.content && typeof this.content === "string") {
    text = this.content;
  } else if (Array.isArray(this.blocks) && this.blocks.length > 0) {
    text = this.blocks
      .map((b: IContentBlock) => (b.textHtml ? b.textHtml : ""))
      .join(" ");
  }
  const wordCount = text
    .replace(/<[^>]*>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return readingTime;
});

// Virtual for formatted publish date
ArticleSchema.virtual("formattedPublishDate").get(function () {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return null;
});

// Create and export the Article model
const ArticleModel =
  mongoose.models.articles ||
  mongoose.model<IArticle>("articles", ArticleSchema);

export default ArticleModel;
