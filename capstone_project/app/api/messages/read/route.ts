import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import Transaction from "@/models/Transaction";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/messages/read
 * Marks messages as read for a transaction
 * 
 * Request Body:
 * - transactionId: string (required)
 * 
 * Response:
 * - 200: Messages marked as read
 * - 401: Unauthorized
 * - 403: Forbidden (not buyer or seller)
 * - 404: Transaction not found
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
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: "Transaction ID is required" },
        { status: 400 }
      );
    }

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

    // Mark all unread messages as read (except messages sent by current user)
    const result = await Message.updateMany(
      {
        transactionId: transactionId,
        receiverId: session.user.id,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
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

// Only allow PATCH
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

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