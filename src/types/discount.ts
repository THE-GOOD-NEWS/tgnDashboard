export type DiscountApplicationType = 'AUTOMATIC' | 'MANUAL';

export type DiscountCalculationType = 
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'FREE_SHIPPING'
  // | 'BUY_X_GET_Y';

export type CustomerTag = 'VIP' | 'LOYAL' | 'NEW';

export interface BuyXGetYDetails {
  buyQuantity: number;
  getQuantity: number;
}

export interface DiscountCondition {
  minimumOrderAmount?: number;
  productIds?: string[];
  collectionIds?: string[];
  firstTimeCustomerOnly?: boolean;
  customerTags?: CustomerTag[];
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
}

export interface Discount {
  _id?: string;
  code: string;
  name: string;
  description: string;
  applicationType: DiscountApplicationType;
  calculationType: DiscountCalculationType;
  redeemType:string;
  value?: number; // percentage or fixed amount
  buyXGetYDetails?: BuyXGetYDetails;
  conditions: DiscountCondition;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface DiscountUsage {
  _id?: string;
  discountId: string;
  userId: string;
  orderId: string;
  usedAt: Date;
} 