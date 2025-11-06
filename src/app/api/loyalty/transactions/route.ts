import { NextRequest, NextResponse } from "next/server";
import { LoyaltyTransactionModel } from "@/app/models/loyaltyTransactionModel";
import { ConnectDB } from "../../../../config/db";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET: Fetch loyalty transactions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // "earn" or "spend"
    
    let query: any = {};
    
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }
    
    if (type && ["earn", "spend"].includes(type)) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      LoyaltyTransactionModel.find(query)
        .populate({ path: "bonusID", options: { strictPopulate: false } })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      LoyaltyTransactionModel.countDocuments(query)
    ]);
    
    return NextResponse.json({ 
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error },
      { status: 500 }
    );
  }
}

// POST: Create new loyalty transaction
export async function POST(req: NextRequest) {
  try {
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

    // Either amount or bonusID should be provided
    if (!amount && !bonusID) {
      return NextResponse.json(
        { error: "Either amount or bonusID is required", code: "MISSING_AMOUNT_OR_BONUS" },
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

    // Validate reason length if provided
    if (reason && reason.length > 500) {
      return NextResponse.json(
        { error: "Reason cannot exceed 500 characters", code: "REASON_TOO_LONG" },
        { status: 400 }
      );
    }

    const transactionData: any = {
      email,
      type,
      timestamp: new Date(),
    };

    if (amount) transactionData.amount = amount;
    if (reason) transactionData.reason = reason;
    if (bonusID) transactionData.bonusID = bonusID;

    const newTransaction = await LoyaltyTransactionModel.create(transactionData);
    
    // Populate the bonusID if it exists
    const populatedTransaction = await LoyaltyTransactionModel.findById(newTransaction._id)
      .populate({ path: "bonusID", options: { strictPopulate: false } });

    return NextResponse.json({ 
      data: populatedTransaction,
      message: "Transaction created successfully"
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating loyalty transaction:", error);
    
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
        error: "Failed to create transaction", 
        code: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}
