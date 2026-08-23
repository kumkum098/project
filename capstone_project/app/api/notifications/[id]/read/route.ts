import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/notifications/[id]/read
 * 
 * Marks a single notification as read.
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

  const { id: notificationId } = await params;

    await connectDB();

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notification as read",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}