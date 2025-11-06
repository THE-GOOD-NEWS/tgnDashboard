// lib/mongodb.ts or utils/db.ts

import mongoose from "mongoose";

const MONGODB_URI = `mongodb+srv://wifeyforlifey:${process.env.MONGO_PASSWORD}@wifeyforlifey.j0pm4vx.mongodb.net/wifeyforlifey?retryWrites=true&w=majority&appName=WifeyForLifey`;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_PASSWORD environment variable");
}

export const ConnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
