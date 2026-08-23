import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Transaction, { TransactionStatus, EscrowStatus } from "@/models/Transaction";

/**
 * POST /api/transactions/[transactionId]/dispute
 * Buyer raises a dispute after ticket transfer.
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

    if (transaction.buyerId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the buyer of this transaction",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reason = body?.reason?.toString()?.trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Dispute reason is required" },
        { status: 400 }
      );
    }

    transaction.disputeRaised = true;
    transaction.disputeReason = reason;
    transaction.disputeCreatedAt = new Date();
    transaction.transactionStatus = TransactionStatus.DISPUTED;
    transaction.escrowStatus = EscrowStatus.ON_HOLD;

    await transaction.save();

    return NextResponse.json(
      {
        success: true,
        message: "Dispute raised successfully",
        data: {
          id: transaction._id.toString(),
          disputeRaised: transaction.disputeRaised,
          disputeReason: transaction.disputeReason,
          disputeCreatedAt: transaction.disputeCreatedAt,
          transactionStatus: transaction.transactionStatus,
          escrowStatus: transaction.escrowStatus,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in dispute endpoint:", error);

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
    { message: "Method not allowed. Use POST to raise dispute." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to raise dispute." },
    { status: 405 }
  );
}