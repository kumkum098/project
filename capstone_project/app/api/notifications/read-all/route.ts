import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/notifications/read-all
 * 
 * Marks all notifications as read for the logged-in user.
 */

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await Notification.updateMany(
      {
        recipientId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      message: "Marked all notifications as read",
      count: result.modifiedCount,
    });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notifications as read",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}