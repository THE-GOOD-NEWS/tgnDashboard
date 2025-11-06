import mongoose, { Schema } from 'mongoose';
import { Discount, DiscountApplicationType, DiscountCalculationType } from '@/types/discount';

const discountSchema = new Schema<Discount>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  applicationType: {
    type: String,
    enum: ['AUTOMATIC', 'MANUAL'],
    required: true,
  },
  redeemType:{
    type:String,
    enum:["Purchase","Subscription","All"],
    required:false
  },
  calculationType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'],
    // enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y'],
    required: true,
  },
  value: {
    type: Number,
    required: function(this: Discount) {
      // return this.calculationType !== 'FREE_SHIPPING' && this.calculationType !== 'BUY_X_GET_Y';
      return this.calculationType !== 'FREE_SHIPPING' ;
    },
  },
  // buyXGetYDetails: {
  //   buyQuantity: {
  //     type: Number,
  //     required: function(this: Discount) {
  //       return this.calculationType === 'BUY_X_GET_Y';
  //     },
  //   },
  //   getQuantity: {
  //     type: Number,
  //     required: function(this: Discount) {
  //       return this.calculationType === 'BUY_X_GET_Y';
  //     },
  //   },
  // },
  conditions: {
    minimumOrderAmount: Number,
    productIds: [String],
    collectionIds: [String],
    firstTimeCustomerOnly: Boolean,
    customerTags: [String],
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: Number,
    usageLimitPerCustomer: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ 'conditions.validFrom': 1, 'conditions.validUntil': 1 });

// Delete the model if it exists to prevent schema conflicts
if (mongoose.models.Discount) {
  delete mongoose.models.Discount;
}

export const DiscountModel = mongoose.model<Discount>('Discount', discountSchema); 