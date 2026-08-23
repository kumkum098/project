import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Notification, { NotificationType } from "@/models/Notification";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/notifications
 * 
 * Returns all notifications for the logged-in user.
 * Sorted by newest first.
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") as NotificationType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    await connectDB();

    const query: any = {
      recipientId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    if (type && Object.values(NotificationType).includes(type)) {
      query.type = type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("senderId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    const transformedNotifications = notifications.map((notification: any) => ({
      _id: notification._id.toString(),
      recipientId: notification.recipientId.toString(),
      senderId: notification.senderId?._id?.toString() || null,
      senderName: notification.senderId?.name || "System",
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      link: notification.link,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      total,
      hasMore: skip + notifications.length < total,
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}