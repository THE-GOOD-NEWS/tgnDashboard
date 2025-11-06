import { NextResponse } from 'next/server';
import { ConnectDB } from '@/config/db';
import { DiscountModel } from '@/models/Discount';
import { Discount } from '@/types/discount';

// GET /api/discounts - List all discounts
export async function GET() {
  try {
    await ConnectDB();
    const discounts = await DiscountModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

// POST /api/discounts - Create a new discount
export async function POST(request: Request) {
  try {
    await ConnectDB();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['code', 'name', 'description', 'applicationType', 'calculationType', 'conditions', 'redeemType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate value field based on calculation type
    if (body.calculationType !== 'FREE_SHIPPING' && body.calculationType !== 'BUY_X_GET_Y' && !body.value) {
      return NextResponse.json(
        { error: 'Value is required for this discount type' },
        { status: 400 }
      );
    }

    // Validate Buy X Get Y fields
    if (body.calculationType === 'BUY_X_GET_Y') {
      if (!body.buyXGetYDetails?.buyQuantity || !body.buyXGetYDetails?.getQuantity) {
        return NextResponse.json(
          { error: 'Buy X Get Y details are required' },
          { status: 400 }
        );
      }
    }

    // Check if discount code already exists
    const existingDiscount = await DiscountModel.findOne({ code: body.code });
    if (existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }

    // Create the discount with proper data structure
    const discountData: Partial<Discount> = {
      code: body.code,
      name: body.name,
      description: body.description,
      applicationType: body.applicationType,
      calculationType: body.calculationType,
      redeemType: body.redeemType,
      conditions: body.conditions,
      isActive: body.isActive ?? true,
    };

    // Add value or buyXGetYDetails based on calculation type
    if (body.calculationType === 'BUY_X_GET_Y') {
      discountData.buyXGetYDetails = {
        buyQuantity: body.buyXGetYDetails.buyQuantity,
        getQuantity: body.buyXGetYDetails.getQuantity,
      };
    } else if (body.calculationType !== 'FREE_SHIPPING') {
      discountData.value = body.value;
    }

    const discount = await DiscountModel.create(discountData);
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
} 