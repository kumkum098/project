import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type SignupRequestBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    // Step 1: Read the request body sent from the signup form.
    const body = (await request.json()) as SignupRequestBody;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // Step 2: Validate all required fields before touching the database.
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    // Step 3: Connect to MongoDB using the shared Mongoose utility.
    await connectDB();

    // Step 4: Check whether a user already exists with the same email.
    const existingUser = await User.findOne({ email }).select("_id");

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        {
          status: 409,
        }
      );
    }

    // Step 5: Hash the plain-text password before saving the user.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 6: Create a new user document with safe defaults from the model.
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Step 7: Save the user document to MongoDB.
    await user.save();

    // Step 8: Return a success response without exposing the password hash.
    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    // Step 9: Catch unexpected errors and return a generic server response.
    console.error("Signup API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
