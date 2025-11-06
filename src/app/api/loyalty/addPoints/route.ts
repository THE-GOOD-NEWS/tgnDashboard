import { NextRequest, NextResponse } from "next/server";
import { LoyaltyTransactionModel } from "@/app/models/loyaltyTransactionModel";
import { LoyaltyPointsModel } from "@/app/models/rewardModel";
import { ConnectDB } from "../../../../config/db";
import UserModel from "@/app/models/userModel";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// POST: Add points to user by email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, points, reason, bonusID, type = "earn" } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required", code: "MISSING_EMAIL" },
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

    if (!points && !bonusID) {
      return NextResponse.json(
        { error: "Either points amount or bonusID is required", code: "MISSING_POINTS_OR_BONUS" },
        { status: 400 }
      );
    }

    // Validate points if provided
    if (points !== undefined) {
      if (typeof points !== 'number' || points <= 0) {
        return NextResponse.json(
          { error: "Points must be a positive number", code: "INVALID_POINTS" },
          { status: 400 }
        );
      }
      if (points > 10000) {
        return NextResponse.json(
          { error: "Points cannot exceed 10,000", code: "POINTS_TOO_LARGE" },
          { status: 400 }
        );
      }
    }

    // Validate type
    if (!["earn", "spend"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be either 'earn' or 'spend'", code: "INVALID_TYPE" },
        { status: 400 }
      );
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

    // Verify user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User with this email not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // If bonusID is provided, verify it exists
    let bonus = null;
    if (bonusID) {
      bonus = await LoyaltyPointsModel.findById(bonusID);
      if (!bonus) {
        return NextResponse.json(
          { error: "Bonus not found", code: "BONUS_NOT_FOUND" },
          { status: 404 }
        );
      }
    }

    // Create transaction data
    const transactionData: any = {
      email,
      type,
      timestamp: new Date(),
    };

    if (points) {
      transactionData.amount = points;
    }

    if (reason) {
      transactionData.reason = reason;
    }

    if (bonusID) {
      transactionData.bonusID = bonusID;
    }

    // Create the transaction
    const newTransaction = await LoyaltyTransactionModel.create(transactionData);
    
    // Populate the bonusID if it exists
    const populatedTransaction = await LoyaltyTransactionModel.findById(newTransaction._id)
      .populate({ path: "bonusID", options: { strictPopulate: false } });

    // Calculate user's total points after this transaction
    const allTransactions = await LoyaltyTransactionModel.find({ email })
      .populate({ path: "bonusID", options: { strictPopulate: false } });
    
    let totalEarned = 0;
    let totalSpent = 0;
    
    for (const tx of allTransactions) {
      if (tx.type === "earn") {
        if (tx.amount) {
          totalEarned += tx.amount;
        } else if (tx.bonusID && tx.bonusID.bonusPoints) {
          totalEarned += tx.bonusID.bonusPoints;
        }
      } else if (tx.type === "spend" && tx.amount) {
        totalSpent += tx.amount;
      }
    }
    
    const currentPoints = totalEarned - totalSpent;

    return NextResponse.json({
      message: "Points added successfully",
      data: {
        transaction: populatedTransaction,
        userPoints: {
          totalEarned,
          totalSpent,
          currentPoints
        },
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error adding points:", error);
    
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

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          error: "Duplicate transaction detected", 
          code: "DUPLICATE_TRANSACTION"
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to add points", 
        code: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}