import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/chat
 * 
 * Returns all conversations for the logged-in user.
 * Sorted by most recent activity.
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

    await connectDB();

    const userId = new (await import("mongoose")).default.Types.ObjectId(session.user.id);

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email trustScore")
      .populate("ticketId", "title eventName imageUrl price")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Transform data for frontend
    const transformedConversations = conversations.map((conv: any) => {
      const otherParticipant = conv.participants.find(
        (p: any) => p._id.toString() !== session.user.id
      );

      return {
        _id: conv._id.toString(),
        participants: conv.participants.map((p: any) => ({
          _id: p._id.toString(),
          name: p.name,
          email: p.email,
          trustScore: p.trustScore,
        })),
        ticketId: conv.ticketId?._id.toString() || null,
        ticket: conv.ticketId ? {
          _id: conv.ticketId._id.toString(),
          title: conv.ticketId.title,
          eventName: conv.ticketId.eventName,
          imageUrl: conv.ticketId.imageUrl,
          price: conv.ticketId.price,
        } : null,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        otherUser: otherParticipant ? {
          _id: otherParticipant._id.toString(),
          name: otherParticipant.name,
          email: otherParticipant.email,
          trustScore: otherParticipant.trustScore,
        } : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedConversations,
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch conversations",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}