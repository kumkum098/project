import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/settings
 * Returns the logged-in user's settings
 * 
 * Response:
 * - 200: User settings
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

    // Fetch user settings
    const user = await User.findById(session.user.id).select("settings").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return settings with defaults if not set
    const settings = user.settings || {
      notifications: {
        email: true,
        push: true,
      },
      appearance: {
        theme: "system",
        layoutDensity: "comfortable",
      },
      privacy: {
        profileVisibility: "public",
        searchVisibility: true,
        allowDataSharing: false,
      },
      security: {
        twoFactorAuth: "disabled",
        sessionTimeout: "never",
      },
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch settings",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Updates the logged-in user's settings
 * 
 * Request Body:
 * - notifications?: { email?: boolean, push?: boolean }
 * - appearance?: { theme?: string, layoutDensity?: string }
 * - privacy?: { profileVisibility?: string, searchVisibility?: boolean, allowDataSharing?: boolean }
 * - security?: { twoFactorAuth?: string, sessionTimeout?: string }
 * 
 * Response:
 * - 200: Updated settings
 * - 400: Validation failed
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("=== SETTINGS PATCH DEBUG ===");
    console.log("Session user ID:", session?.user?.id);
    console.log("Session exists:", !!session);

    if (!session || !session.user?.id) {
      console.log("Unauthorized: No session or user ID");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request payload:", JSON.stringify(body, null, 2));
    const { notifications, appearance, privacy, security } = body;

    // Validate input
    const updates: any = {};

    // Validate notifications
    if (notifications !== undefined) {
      if (typeof notifications !== "object" || notifications === null) {
        return NextResponse.json(
          { success: false, message: "Invalid notifications format" },
          { status: 400 }
        );
      }
      updates["settings.notifications"] = {};
      if (notifications.email !== undefined) {
        if (typeof notifications.email !== "boolean") {
          return NextResponse.json(
            { success: false, message: "Invalid email notification value" },
            { status: 400 }
          );
        }
        updates["settings.notifications.email"] = notifications.email;
      }
      if (notifications.push !== undefined) {
        if (typeof notifications.push !== "boolean") {
          return NextResponse.json(
            { success: false, message: "Invalid push notification value" },
            { status: 400 }
          );
        }
        updates["settings.notifications.push"] = notifications.push;
      }
    }

    // Validate appearance
    if (appearance !== undefined) {
      if (typeof appearance !== "object" || appearance === null) {
        return NextResponse.json(
          { success: false, message: "Invalid appearance format" },
          { status: 400 }
        );
      }
      updates["settings.appearance"] = {};
      if (appearance.theme !== undefined) {
        const validThemes = ["dark", "light", "system"];
        if (!validThemes.includes(appearance.theme)) {
          return NextResponse.json(
            { success: false, message: "Invalid theme value" },
            { status: 400 }
          );
        }
        updates["settings.appearance.theme"] = appearance.theme;
      }
      if (appearance.layoutDensity !== undefined) {
        const validDensities = ["comfortable", "compact"];
        if (!validDensities.includes(appearance.layoutDensity)) {
          return NextResponse.json(
            { success: false, message: "Invalid layout density value" },
            { status: 400 }
          );
        }
        updates["settings.appearance.layoutDensity"] = appearance.layoutDensity;
      }
    }

    // Validate privacy
    if (privacy !== undefined) {
      if (typeof privacy !== "object" || privacy === null) {
        return NextResponse.json(
          { success: false, message: "Invalid privacy format" },
          { status: 400 }
        );
      }
      updates["settings.privacy"] = {};
      if (privacy.profileVisibility !== undefined) {
        const validVisibilities = ["public", "private", "connections"];
        if (!validVisibilities.includes(privacy.profileVisibility)) {
          return NextResponse.json(
            { success: false, message: "Invalid profile visibility value" },
            { status: 400 }
          );
        }
        updates["settings.privacy.profileVisibility"] = privacy.profileVisibility;
      }
      if (privacy.searchVisibility !== undefined) {
        if (typeof privacy.searchVisibility !== "boolean") {
          return NextResponse.json(
            { success: false, message: "Invalid search visibility value" },
            { status: 400 }
          );
        }
        updates["settings.privacy.searchVisibility"] = privacy.searchVisibility;
      }
      if (privacy.allowDataSharing !== undefined) {
        if (typeof privacy.allowDataSharing !== "boolean") {
          return NextResponse.json(
            { success: false, message: "Invalid data sharing value" },
            { status: 400 }
          );
        }
        updates["settings.privacy.allowDataSharing"] = privacy.allowDataSharing;
      }
    }

    // Validate security
    if (security !== undefined) {
      if (typeof security !== "object" || security === null) {
        return NextResponse.json(
          { success: false, message: "Invalid security format" },
          { status: 400 }
        );
      }
      updates["settings.security"] = {};
      if (security.twoFactorAuth !== undefined) {
        const valid2FA = ["disabled", "sms", "authenticator"];
        if (!valid2FA.includes(security.twoFactorAuth)) {
          return NextResponse.json(
            { success: false, message: "Invalid two-factor authentication value" },
            { status: 400 }
          );
        }
        updates["settings.security.twoFactorAuth"] = security.twoFactorAuth;
      }
      if (security.sessionTimeout !== undefined) {
        const validTimeouts = ["never", "15min", "30min", "1hour"];
        if (!validTimeouts.includes(security.sessionTimeout)) {
          return NextResponse.json(
            { success: false, message: "Invalid session timeout value" },
            { status: 400 }
          );
        }
        updates["settings.security.sessionTimeout"] = security.sessionTimeout;
      }
    }

    await connectDB();
    console.log("Connected to MongoDB");

    // Update user settings
    console.log("Updating user:", session.user.id);
    console.log("Update payload:", JSON.stringify(updates, null, 2));
    
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true, select: "settings" }
    );

    console.log("Update result:", updatedUser ? "Success" : "Failed");
    console.log("Updated settings:", updatedUser?.settings);

    if (!updatedUser) {
      console.log("User not found:", session.user.id);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("=== END SETTINGS PATCH DEBUG ===");

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedUser.settings,
    });

  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update settings",
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