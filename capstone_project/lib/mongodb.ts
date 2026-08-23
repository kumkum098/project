// lib/mongodb.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ticket-resale-marketplace";

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already Connected");
      return;
    }

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error);

    throw new Error("Database Connection Failed");
  }
}