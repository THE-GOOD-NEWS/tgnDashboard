import mongoose, { Schema, Document } from "mongoose";

export interface ILogin extends Document {
  userId?: string; // Make userId optional
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  fingerprint?: string;
  sessionId?: string;
}

const LoginSchema = new Schema<ILogin>({
  userId: { type: String, required: false, index: true }, // Make userId optional
  email: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  deviceType: { type: String },
  deviceBrand: { type: String },
  deviceModel: { type: String },
  browserName: { type: String },
  browserVersion: { type: String },
  osName: { type: String },
  osVersion: { type: String },
  fingerprint: { type: String },
  sessionId: { type: String },
});

// Create indexes for common queries
LoginSchema.index({ userId: 1, timestamp: -1 });
LoginSchema.index({ email: 1, timestamp: -1 });
LoginSchema.index({ fingerprint: 1 });

// Create a TTL index to expire documents after 90 days
LoginSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const LoginModel =
  mongoose.models.logins || mongoose.model<ILogin>("logins", LoginSchema);

export default LoginModel;
