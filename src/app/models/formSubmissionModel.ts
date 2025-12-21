import mongoose, { Schema, Document } from "mongoose";

export interface IFormSubmission extends Document {
  formType: "join_team" | "contact" | "partner" | "share_news";
  status: "pending" | "reviewed" | "archived";
  
  // Common Fields
  name?: string;
  email?: string;
  phoneNumber?: string;
  
  // Join Team Fields
  interestedFields?: string[];
  experience?: string;
  workStyle?: string[];
  cvUrl?: string;
  resumeAs?: string;
  notes?: string;

  // Contact Fields
  subject?: string;
  message?: string;

  // Partner Fields
  businessName?: string;
  industry?: string;
  collaborationIdea?: string;
  campaignDetails?: string;
  socialMediaAccounts?: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactMethod?: string[];

  // Share News Fields
  story?: string;
  mediaUrls?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    formType: {
      type: String,
      required: true,
      enum: ["join_team", "contact", "partner", "share_news"],
      index: true,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "reviewed", "archived"],
    },
    
    // Common
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    
    // Join Team
    interestedFields: { type: [String] },
    experience: { type: String },
    workStyle: { type: [String] },
    cvUrl: { type: String },
    resumeAs: { type: String },
    notes: { type: String },

    // Contact
    subject: { type: String },
    message: { type: String },

    // Partner
    businessName: { type: String },
    industry: { type: String },
    collaborationIdea: { type: String },
    campaignDetails: { type: String },
    socialMediaAccounts: { type: String },
    contactName: { type: String },
    contactNumber: { type: String },
    contactEmail: { type: String },
    contactMethod: { type: [String] },

    // Share News
    story: { type: String },
    mediaUrls: { type: [String] },
  },
  {
    timestamps: true,
  }
);

// Indexes
FormSubmissionSchema.index({ createdAt: -1 });
FormSubmissionSchema.index({ email: 1 });

const FormSubmissionModel =
  mongoose.models.formSubmissions ||
  mongoose.model<IFormSubmission>("formSubmissions", FormSubmissionSchema);

export default FormSubmissionModel;
