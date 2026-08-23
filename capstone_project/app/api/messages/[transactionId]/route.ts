import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import Transaction from "@/models/Transaction";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/messages/[transactionId]
 * Returns all messages for a specific transaction
 * 
 * URL Parameters:
 * - transactionId: string (required)
 * 
 * Response:
 * - 200: Array of messages
 * - 401: Unauthorized
 * - 403: Forbidden (not buyer or seller)
 * - 404: Transaction not found
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { transactionId } = await params;

    await connectDB();

    // Verify transaction exists and user is a participant
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is buyer or seller
    const isBuyer = transaction.buyerId.toString() === session.user.id;
    const isSeller = transaction.sellerId.toString() === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not a participant in this transaction" },
        { status: 403 }
      );
    }

    // Fetch all messages for this transaction
    const messages = await Message.find({ transactionId })
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: 1 }) // Oldest to newest
      .lean();

    // Transform messages
    const transformedMessages = messages.map((msg: any) => ({
      _id: msg._id.toString(),
      transactionId: msg.transactionId.toString(),
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
 * POST /api/messages/[transactionId]
 * Sends a new message in the transaction
 * 
 * URL Parameters:
 * - transactionId: string (required)
 * 
 * Request Body:
 * - message: string (required)
 * - attachments?: string[]
 * 
 * Response:
 * - 201: Message sent successfully
 * - 400: Validation failed
 * - 401: Unauthorized
 * - 403: Forbidden (not buyer or seller)
 * - 404: Transaction not found
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { transactionId } = await params;
    const body = await request.json();
    const { message, attachments } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify transaction exists
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is buyer or seller
    const isBuyer = transaction.buyerId.toString() === session.user.id;
    const isSeller = transaction.sellerId.toString() === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not a participant in this transaction" },
        { status: 403 }
      );
    }

    // Determine receiver (the other participant)
    const senderId = session.user.id;
    const receiverId = isBuyer ? transaction.sellerId : transaction.buyerId;

    // Create message
    const newMessage = await Message.create({
      transactionId: new (await import("mongoose")).default.Types.ObjectId(transactionId),
      senderId: new (await import("mongoose")).default.Types.ObjectId(senderId),
      receiverId: receiverId,
      message: message.trim(),
      attachments: attachments || [],
    });

    // Populate message with sender/receiver info
    await newMessage.populate("senderId", "name email");
    await newMessage.populate("receiverId", "name email");

    // Transform response
    const transformedMessage = {
      _id: newMessage._id.toString(),
      transactionId: newMessage.transactionId.toString(),
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
    }, { status: 201 });

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

// Only allow GET and POST
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