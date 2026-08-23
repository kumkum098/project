import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { cancelTransaction } from "@/lib/escrow";
import { updateTrustScore } from "@/lib/trustScore";

/**
 * PATCH /api/transactions/[id]/cancel
 * Cancels a transaction (only when status is PENDING)
 * 
 * Authentication:
 * - User must be logged in
 * - User must be either buyer or seller of this transaction
 * 
 * Business Logic:
 * - Transaction must be in PENDING status
 * - Calls cancelTransaction() from escrow library
 * - Refunds payment if already paid
 * - Makes ticket available again
 * 
 * Response:
 * - 200: Success
 * - 400: Invalid request or wrong status
 * - 401: Unauthorized
 * - 403: Forbidden (not buyer or seller)
 * - 404: Transaction not found
 * - 500: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Check authentication
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please login to continue",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
  const { id: transactionId } = await params;

    // Step 2: Validate transaction ID
    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction ID is required",
        },
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    await connectDB();

    // Step 4: Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    // Step 5: Verify user is either buyer or seller
    const isBuyer = transaction.buyerId.toString() === userId;
    const isSeller = transaction.sellerId.toString() === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not authorized to cancel this transaction",
        },
        { status: 403 }
      );
    }

    // Step 6: Call escrow helper to cancel transaction
    const result = await cancelTransaction(transactionId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Step 7: Update trust scores for both parties (cancellation affects both)
    await updateTrustScore(transaction.buyerId.toString());
    await updateTrustScore(transaction.sellerId.toString());

    // Step 8: Return success
    return NextResponse.json(
      {
        success: true,
        message: "Transaction cancelled successfully. Ticket is now available for purchase.",
        data: {
          transaction: result.transaction,
          ticket: result.ticket,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in cancel endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow PATCH requests
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to cancel transaction." },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to cancel transaction." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to cancel transaction." },
    { status: 405 }
  );
}