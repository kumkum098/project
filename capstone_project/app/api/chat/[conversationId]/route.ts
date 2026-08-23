import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/chat/[conversationId]
 * 
 * Returns all messages for a conversation.
 * Sorted oldest to newest.
 */

export async function GET(
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

    // Fetch all messages for this conversation
    const messages = await Message.find({ conversationId: new (await import("mongoose")).default.Types.ObjectId(conversationId) })
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: 1 }) // Oldest to newest
      .lean();

    // Transform messages
    const transformedMessages = messages.map((msg: any) => ({
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId._id.toString(),
      senderName: msg.senderId.name,
      receiverId: msg.receiverId._id.toString(),
      receiverName: msg.receiverId.name,
      message: msg.message,
      attachments: msg.attachments || [],
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedMessages,
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch messages",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/[conversationId]
 * 
 * Sends a new message in the conversation.
 */

export async function POST(
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
    const body = await request.json();
    const { message, attachments } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Determine receiver (the other participant)
    const senderId = session.user.id;
    const receiverId = conversation.participants.find(
      (p: any) => p.toString() !== senderId
    );

    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: "Invalid conversation participants" },
        { status: 400 }
      );
    }

    // Create message
    const newMessage = await Message.create({
      conversationId: new (await import("mongoose")).default.Types.ObjectId(conversationId),
      senderId: new (await import("mongoose")).default.Types.ObjectId(senderId),
      receiverId: receiverId,
      message: message.trim(),
      attachments: attachments || [],
    });

    // Update conversation with last message
    conversation.lastMessage = message.trim().substring(0, 1000);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message with sender/receiver info
    await newMessage.populate("senderId", "name email");
    await newMessage.populate("receiverId", "name email");

    // Transform response
    const transformedMessage = {
      _id: newMessage._id.toString(),
      conversationId: newMessage.conversationId.toString(),
      senderId: newMessage.senderId._id.toString(),
      senderName: (newMessage.senderId as any).name,
      receiverId: newMessage.receiverId.toString(),
      receiverName: (newMessage.receiverId as any).name,
      message: newMessage.message,
      attachments: newMessage.attachments,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedMessage,
      message: "Message sent successfully",
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}