import mongoose, { Schema, Document } from "mongoose";

export interface LoyaltyBonus extends Document {
  title: string;
  description: string;
  bonusPoints: number;
  active: boolean;
}

const LoyaltyPointsSchema = new Schema<LoyaltyBonus>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  bonusPoints: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

export const LoyaltyPointsModel = mongoose.models.loyaltyPoints || mongoose.model<LoyaltyBonus>("loyaltyPoints", LoyaltyPointsSchema); 