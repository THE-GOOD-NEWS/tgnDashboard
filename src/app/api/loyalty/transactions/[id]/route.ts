import { NextRequest, NextResponse } from "next/server";
import { LoyaltyTransactionModel } from "@/app/models/loyaltyTransactionModel";
import { ConnectDB } from "../../../../../config/db";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET: Fetch single loyalty transaction by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const transaction = await LoyaltyTransactionModel.findById(params.id)
      .populate({ path: "bonusID", options: { strictPopulate: false } });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: error },
      { status: 500 }
    );
  }
}

// PUT: Update loyalty transaction
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, type, amount, reason, bonusID } = body;

    // Validate required fields
    if (!email || !type) {
      return NextResponse.json(
        { error: "email and type are required", code: "MISSING_REQUIRED_FIELDS" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    if (!["earn", "spend"].includes(type)) {
      return NextResponse.json(
        { error: "type must be either 'earn' or 'spend'", code: "INVALID_TYPE" },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number", code: "INVALID_AMOUNT" },
          { status: 400 }
        );
      }
      if (amount > 10000) {
        return NextResponse.json(
          { error: "Amount cannot exceed 10,000 points", code: "AMOUNT_TOO_LARGE" },
          { status: 400 }
        );
      }
    }

    // Validate bonusID if provided
    if (bonusID && !mongoose.Types.ObjectId.isValid(bonusID)) {
      return NextResponse.json(
        { error: "Invalid bonusID format", code: "INVALID_BONUS_ID" },
        { status: 400 }
      );
    }

    // Validate reason length if provided
    if (reason && reason.length > 500) {
      return NextResponse.json(
        { error: "Reason cannot exceed 500 characters", code: "REASON_TOO_LONG" },
        { status: 400 }
      );
    }

    const updateData: any = {
      email,
      type,
    };

    if (amount !== undefined) updateData.amount = amount;
    if (reason !== undefined) updateData.reason = reason;
    if (bonusID !== undefined) updateData.bonusID = bonusID;

    const updatedTransaction = await LoyaltyTransactionModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate({ path: "bonusID", options: { strictPopulate: false } });

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Transaction not found", code: "TRANSACTION_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      data: updatedTransaction,
      message: "Transaction updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating loyalty transaction:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationErrors,
          code: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to update transaction", 
        code: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete loyalty transaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    // Check if transaction exists before deletion
    const existingTransaction = await LoyaltyTransactionModel.findById(params.id);
    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found", code: "TRANSACTION_NOT_FOUND" },
        { status: 404 }
      );
    }

    const deletedTransaction = await LoyaltyTransactionModel.findByIdAndDelete(
      params.id
    );

    return NextResponse.json(
      { 
        message: "Transaction deleted successfully", 
        data: deletedTransaction,
        code: "SUCCESS"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting loyalty transaction:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete transaction", 
        code: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}