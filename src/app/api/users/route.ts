import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import subscriptionsModel from "@/app/models/subscriptionsModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// Helper function for consistent error responses
const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

// Helper function for consistent success responses
const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};
console.log(subscriptionsModel);
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = decodeURIComponent(searchParams.get("search") || "");
    const all = searchParams.get("all") === "true";
    const limit = all ? 0 : 10;
    const skip = all ? 0 : (page - 1) * limit;

    // Create search query
    const searchQuery = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    // Get total count
    const totalUsers = await UserModel.countDocuments(searchQuery);

    // Get users with pagination
    const users = await UserModel
      .find(searchQuery)
      .populate({  
        path: "subscription",
        model: "subscriptions", // <-- this matches your model registration and ref
        options: { strictPopulate: false }
      })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("ya rab" + users[1]?.subscription?.subscribed);
    return successResponse({
      users,
      pagination: {
        total: totalUsers,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return errorResponse("Failed to fetch users");
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.username || !data.password || !data.email) {
      return errorResponse("Username, email and password are required", 400);
    }

    // Check if user already exists with same username or email
    const existingUser = await UserModel.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return errorResponse("Username already exists", 400);
      }
      if (existingUser.email === data.email) {
        return errorResponse("Email already exists", 400);
      }
    }

    const newUser = await UserModel.create(data);
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return successResponse(userWithoutPassword);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return errorResponse(error.message);
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    const updateData = await request.json();

    // If email is being updated, check for uniqueness
    if (updateData.email) {
      const existingUser = await UserModel.findOne({
        email: updateData.email,
        _id: { $ne: userId }, // Exclude current user
      });

      if (existingUser) {
        return errorResponse("Email already exists", 400);
      }
    }

    // If password is being updated, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return errorResponse(error.message);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    const deletedUser =
      await UserModel.findByIdAndDelete(userId).select("-password");

    if (!deletedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(deletedUser);
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return errorResponse(error.message);
  }
}
