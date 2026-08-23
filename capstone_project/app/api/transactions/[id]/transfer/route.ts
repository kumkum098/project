import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Transaction, { TransferMethod } from "@/models/Transaction";
import { markTicketTransferred } from "@/lib/escrow";

/**
 * POST /api/transactions/[transactionId]/transfer
 * Seller confirms ticket transfer details for the buyer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please login to continue" },
        { status: 401 }
      );
    }

    const sellerId = session.user.id;
    const { id: transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const payload = await request.json();
    const transferMethod = payload?.transferMethod;
    const transferValue = payload?.transferValue;

    if (!transferMethod || !transferValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide transferMethod and transferValue for ticket delivery",
        },
        { status: 400 }
      );
    }

    if (!Object.values(TransferMethod).includes(transferMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid transferMethod. Allowed values: ${Object.values(TransferMethod).join(", ")}`,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.sellerId.toString() !== sellerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not the seller of this transaction",
        },
        { status: 403 }
      );
    }

    const result = await markTicketTransferred(transactionId, transferMethod, transferValue);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Ticket transfer registered successfully",
        data: result.transaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in transfer endpoint:", error);

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
    { message: "Method not allowed. Use POST to transfer tickets." },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to transfer tickets." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to transfer tickets." },
    { status: 405 }
  );
}