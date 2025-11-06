import mongoose, { Schema, Document } from "mongoose";
import { LoyaltyPointsModel } from "./rewardModel";
console.log("registering" + LoyaltyPointsModel);

export interface ILoyaltyTransactionSchema extends Document {
  email: string;
  type: "earn" | "spend";
  reason?: string;
  amount?: number;
  timestamp: Date;
  bonusID?: mongoose.Schema.Types.ObjectId;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransactionSchema>({
  email: { type: String, required: true },
  type: { type: String, enum: ["earn", "spend"], required: true },
  timestamp: { type: Date, default: Date.now },
  amount: { type: Number, required: false },
  reason: {
    type: String,
    required: false,
  },
  bonusID: { type: mongoose.Schema.Types.ObjectId, ref: "loyaltyPoints" },
});

export const LoyaltyTransactionModel =
  mongoose.models.LoyaltyTransaction ||
  mongoose.model<ILoyaltyTransactionSchema>(
    "LoyaltyTransaction",
    LoyaltyTransactionSchema,
  );
