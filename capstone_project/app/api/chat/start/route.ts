import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Ticket from "@/models/Ticket";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/chat/start
 * 
 * Creates a new conversation or returns existing one.
 * Only allows buyer and seller of a ticket to chat.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId, receiverId } = body;

    if (!ticketId || !receiverId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and Receiver ID are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    const senderId = session.user.id;

    // Verify that the user is either the buyer or seller of the ticket
    const isBuyer = ticket.sellerId.toString() === senderId;
    const isSeller = ticket.sellerId.toString() === receiverId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, message: "You can only chat with the buyer or seller of this ticket" },
        { status: 403 }
      );
    }

    // Check if conversation already exists
    const participants = [senderId, receiverId].sort();
    const existingConversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      ticketId: ticketId,
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        data: existingConversation,
        message: "Conversation already exists",
      });
    }

    // Create new conversation
    const mongoose = await import("mongoose");
    const conversation = await Conversation.create({
      participants: participants.map(id => new mongoose.Types.ObjectId(id)),
      ticketId: new mongoose.Types.ObjectId(ticketId),
    });

    await conversation.populate("participants", "name email");
    await conversation.populate("ticketId", "title eventName");

    return NextResponse.json({
      success: true,
      data: conversation,
      message: "Conversation created successfully",
    });

  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to start conversation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}