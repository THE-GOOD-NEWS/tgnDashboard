import mongoose, { Schema } from 'mongoose';
import { DiscountUsage } from '@/types/discount';

const discountUsageSchema = new Schema<DiscountUsage>({
  discountId: {
    type: String,
    ref: 'Discount',
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    ref: 'Order',
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
discountUsageSchema.index({ discountId: 1, userId: 1 });
discountUsageSchema.index({ orderId: 1 });

export const DiscountUsageModel = mongoose.models.DiscountUsage || mongoose.model<DiscountUsage>('DiscountUsage', discountUsageSchema); 