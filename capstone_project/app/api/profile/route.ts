import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sanitizeString, isValidPhone } from "@/lib/sanitize";

/**
 * GET /api/profile
 * Returns the logged-in user's profile information
 * 
 * Response:
 * - 200: User profile data
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch user profile (exclude password)
    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Transform user data
    const userProfile = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      city: user.city,
      state: user.state,
      country: user.country,
      profilePicture: user.profilePicture,
      role: user.role,
      trustScore: user.trustScore,
      verificationStatus: user.verificationStatus,
      memberSince: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Updates the logged-in user's profile information
 * 
 * Request Body:
 * - name?: string
 * - phone?: string
 * - city?: string
 * - state?: string
 * - country?: string
 * - profilePicture?: string
 * 
 * Response:
 * - 200: Updated profile data
 * - 400: Validation failed
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate with Zod
    const ProfileSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name cannot exceed 80 characters").optional(),
      phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format").optional().nullable(),
      city: z.string().max(50, "City name too long").optional().nullable(),
      state: z.string().max(50, "State name too long").optional().nullable(),
      country: z.string().max(50, "Country name too long").optional().nullable(),
      profilePicture: z.string().url("Invalid profile picture URL").optional().nullable(),
    });

    const validatedData = ProfileSchema.safeParse(body);

    if (!validatedData.success) {
      const errors = validatedData.error.issues.map(err => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: errors,
        },
        { status: 400 }
      );
    }

    console.log("📝 [API Profile] Request body:", body);
    console.log("👤 [API Profile] Authenticated user ID:", session.user.id);

    // Sanitize and prepare updates
    const updates: any = {};

    if (validatedData.data.name !== undefined) {
      updates.name = sanitizeString(validatedData.data.name);
    }

    if (validatedData.data.phone !== undefined) {
      updates.phone = validatedData.data.phone ? sanitizeString(validatedData.data.phone) : undefined;
    }

    if (validatedData.data.city !== undefined) {
      updates.city = validatedData.data.city ? sanitizeString(validatedData.data.city) : undefined;
    }

    if (validatedData.data.state !== undefined) {
      updates.state = validatedData.data.state ? sanitizeString(validatedData.data.state) : undefined;
    }

    if (validatedData.data.country !== undefined) {
      updates.country = validatedData.data.country ? sanitizeString(validatedData.data.country) : undefined;
    }

    if (validatedData.data.profilePicture !== undefined) {
      updates.profilePicture = validatedData.data.profilePicture ? sanitizeString(validatedData.data.profilePicture) : undefined;
    }

    await connectDB();
    console.log("💾 [API Profile] Database connected, attempting update with:", updates);

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true, select: "-password" }
    );

    console.log("✅ [API Profile] Database update result:", updatedUser);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify the update by fetching the user again
    const verifyUser = await User.findById(session.user.id).select("-password");
    console.log("🔍 [API Profile] Verification fetch:", verifyUser);
    
    if (!verifyUser) {
      console.error("❌ [API Profile] Verification failed - user not found after update");
      return NextResponse.json(
        { success: false, message: "Update verification failed" },
        { status: 500 }
      );
    }

    // Transform user data
    const userProfile = {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      phone: updatedUser.phone,
      city: updatedUser.city,
      state: updatedUser.state,
      country: updatedUser.country,
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
      trustScore: updatedUser.trustScore,
      verificationStatus: updatedUser.verificationStatus,
      memberSince: updatedUser.createdAt,
    };

    console.log("✅ [API Profile] Returning updated profile:", userProfile);
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: userProfile,
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Only allow GET and PATCH
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}