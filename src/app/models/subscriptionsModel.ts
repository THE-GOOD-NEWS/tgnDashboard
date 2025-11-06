import mongoose, { Schema, Document, Types } from "mongoose";

// Define the Subscription interface
export interface ISubscription extends Document {
  paymentID: string;
  packageID: Types.ObjectId;
  email?: string;
  subscribed: boolean;
  // Gift information
  isGift: boolean;
  giftRecipientEmail: string;
  specialMessage: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date; // Because of timestamps: true
}

// Define the Subscription schema with TTL
const SubscriptionSchema = new Schema(
  {
    paymentID: {
      type: String,
      required: true,
    },
    packageID: { type: mongoose.Schema.Types.ObjectId, ref: "packages" },
    email: { type: String },
    subscribed: { type: Boolean, default: false },
    redeemedLoyaltyPoints: { type: Number, required: false },
    appliedDiscount: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "discounts",
    },
    appliedDiscountAmount: { type: Number, required: false },
    // User information
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    whatsAppNumber: { type: String, required: false },
    // Gift information
    isGift: { type: Boolean, default: false },
    giftRecipientEmail: { type: String, required: false },
    specialMessage: { type: String, required: false },
    giftCardName: { type: String, required: false },

    // Address information
    country: { type: String, required: false },
    address: { type: String, required: false },
    apartment: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalZip: { type: String, required: false },
    // Billing information
    billingCountry: { type: String, required: false },
    billingFirstName: { type: String, required: false },
    billingLastName: { type: String, required: false },
    billingState: { type: String, required: false },
    billingAddress: { type: String, required: false },
    billingApartment: { type: String, required: false },
    billingPostalZip: { type: String, required: false },
    billingCity: { type: String, required: false },
    billingPhone: { type: String, required: false },
    // Payment information
    total: { type: Number, required: false },
    subTotal: { type: Number, required: false },
    shipping: { type: Number, required: false },
    currency: { type: String, required: false },
    expiryDate: { type: Date, default: Date.now },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Add static filter methods
SubscriptionSchema.statics.filterBySubscribed = function (subscribed) {
  return this.find({ subscribed });
};

SubscriptionSchema.statics.filterByType = function (type) {
  if (type === "real") {
    return this.find({ subTotal: { $gt: 1000 } });
  } else if (type === "gift") {
    return this.find({
      $or: [{ subTotal: { $lt: 1000 } }, { subTotal: { $exists: false } }],
    });
  } else {
    return this.find();
  }
};

const subscriptionsModel =
  mongoose.models.subscriptions ||
  mongoose.model("subscriptions", SubscriptionSchema);

export default subscriptionsModel;
