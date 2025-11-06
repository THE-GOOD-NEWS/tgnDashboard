import { NextResponse } from 'next/server';
import { ConnectDB } from '@/config/db';
import { DiscountModel } from '@/models/Discount';

// GET /api/discounts/[id] - Get a single discount
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ConnectDB();
    const discount = await DiscountModel.findById(params.id);
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    );
  }
}

// PUT /api/discounts/[id] - Update a discount
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ConnectDB();
    const body = await request.json();

    // Check if discount exists
    const existingDiscount = await DiscountModel.findById(params.id);
    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check for duplicates
    if (body.code && body.code !== existingDiscount.code) {
      const duplicateCode = await DiscountModel.findOne({ code: body.code });
      if (duplicateCode) {
        return NextResponse.json(
          { error: 'Discount code already exists' },
          { status: 400 }
        );
      }
    }

    // Allow updating redeemType as part of the discount update
    // (Handled automatically by $set: body if redeemType is present)
    const updatedDiscount = await DiscountModel.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

// DELETE /api/discounts/[id] - Delete a discount
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ConnectDB();
    const discount = await DiscountModel.findByIdAndDelete(params.id);
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
} 