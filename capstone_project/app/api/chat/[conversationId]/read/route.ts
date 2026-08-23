import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/chat/[conversationId]/read
 * 
 * Marks all messages in a conversation as read for the current user.
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

  const { conversationId } = await params;

    await connectDB();

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Mark all messages where current user is receiver as read
    const result = await Message.updateMany(
      {
        conversationId: conversationId,
        receiverId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
      count: result.modifiedCount,
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark messages as read",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}