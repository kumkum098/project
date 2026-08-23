import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { confirmTicketReceived } from "@/lib/escrow";

/**
 * POST /api/transactions/[transactionId]/confirm
 * Buyer confirms receipt after seller transfers the ticket.
 */
export async function POST(
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

    const buyerId = session.user.id;
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

    // Step 5: Verify user is the buyer
    if (transaction.buyerId.toString() !== buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the buyer of this transaction",
        },
        { status: 403 }
      );
    }

    // Step 6: Call escrow helper to confirm receipt
    const confirmResult = await confirmTicketReceived(transactionId);

    if (!confirmResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: confirmResult.message,
        },
        { status: confirmResult.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Buyer confirmed ticket receipt successfully",
        data: confirmResult.transaction,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in confirm endpoint:", error);

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

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to confirm receipt." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to confirm receipt." },
    { status: 405 }
  );
}