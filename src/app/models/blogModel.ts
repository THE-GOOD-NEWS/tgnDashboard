import mongoose, { Schema, Document } from "mongoose";

// Define the Blog interface
export interface IBlog extends Document {
  _id: string;
  title: string;
  slug: string;
  content: string; // Rich text content (HTML)
  excerpt: string;
  featuredImage?: string;
  tikTokVideoUrl?: string;
  author: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  tags: string[];
  categories: string[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
  viewCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Blog schema
const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: false,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
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
          return /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/.test(v) ||
                 /^https:\/\/vm\.tiktok\.com\/[\w]+/.test(v);
        },
        message: "Please enter a valid TikTok video URL",
      },
    },
    // author: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "users",
    //   required: true
    // },
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
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 15;
        },
        message: "Maximum 15 categories allowed",
      },
    },
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
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ categories: 1 });
BlogSchema.index({ featured: 1, status: 1 });

// Pre-save middleware to auto-generate slug if not provided
BlogSchema.pre("save", function (next) {
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
BlogSchema.virtual("readingTime").get(function () {
  const wordCount = this.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  return readingTime;
});

// Virtual for formatted publish date
BlogSchema.virtual("formattedPublishDate").get(function () {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return null;
});

// Create and export the Blog model
const BlogModel =
  mongoose.models.blogs || mongoose.model<IBlog>("blogs", BlogSchema);

export default BlogModel;
