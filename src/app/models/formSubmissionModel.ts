import mongoose, { Schema, Document } from "mongoose";

export interface IFormSubmission extends Document {
  formType:
    | "join_team"
    | "contact"
    | "partner"
    | "share_news"
    | "join_good_project"
    | "testimonial";
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

  // Join Good Project Fields
  studentName?: string;
  studentEmail?: string;
  projectName?: string;
  faculty?: string;
  university?: string;
  academicYear?: string;
  aboutProject?: string;
  projectCategory?: string;
  projectLogoUrl?: string;
  teamPhotoUrl?: string;
  projectPageLink?: string;

  // Testimonial Fields
  companyName?: string;
  role?: string;
  campaignPurpose?: string;
  professionalismRating?: number;
  clarityRating?: number;
  adaptabilityRating?: number;
  responsivenessRating?: number;
  overallRating?: number;
  continueWorkingRating?: number;
  recommendRating?: number;
  testimonialComment?: string;
  agreeToShare?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    formType: {
      type: String,
      required: true,
      enum: [
        "join_team",
        "contact",
        "partner",
        "share_news",
        "join_good_project",
        "testimonial",
      ],
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

    // Join Good Project
    studentName: { type: String },
    studentEmail: { type: String },
    projectName: { type: String },
    faculty: { type: String },
    university: { type: String },
    academicYear: { type: String },
    aboutProject: { type: String },
    projectCategory: { type: String },
    projectLogoUrl: { type: String },
    teamPhotoUrl: { type: String },
    projectPageLink: { type: String },

    // Testimonial
    companyName: { type: String },
    role: { type: String },
    campaignPurpose: { type: String },
    professionalismRating: { type: Number },
    clarityRating: { type: Number },
    adaptabilityRating: { type: Number },
    responsivenessRating: { type: Number },
    overallRating: { type: Number },
    continueWorkingRating: { type: Number },
    recommendRating: { type: Number },
    testimonialComment: { type: String },
    agreeToShare: { type: Boolean },
  },
  {
    timestamps: true,
  },
);

// Indexes
FormSubmissionSchema.index({ createdAt: -1 });
FormSubmissionSchema.index({ email: 1 });

const FormSubmissionModel =
  mongoose.models.formSubmissions ||
  mongoose.model<IFormSubmission>("formSubmissions", FormSubmissionSchema);

export default FormSubmissionModel;
