import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Ticket from "@/models/Ticket";

/**
 * GET /api/transactions/my-sales
 * Fetches all transactions where the logged-in user is the seller
 * 
 * Query Parameters:
 * - sellerId: string (required) - The ID of the seller
 * 
 * Response:
 * - 200: Successfully retrieved sales
 * - 400: Missing sellerId
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get sellerId from query parameters
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get("sellerId");

    // Step 3: Validate sellerId
    if (!sellerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Seller ID is required",
        },
        { status: 400 }
      );
    }

    // Step 4: Fetch transactions for this seller
    const transactions = await Transaction.find({ sellerId: sellerId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Step 5: Populate ticket and buyer details
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction: any) => {
        const ticket = await Ticket.findById(transaction.ticketId);
        const buyer = transaction.buyerId;

        return {
          id: transaction._id.toString(),
          ticketId: transaction.ticketId.toString(),
          ticketTitle: ticket?.title || "Unknown Ticket",
          eventName: ticket?.eventName || "Unknown Event",
          eventDate: ticket?.eventDate || new Date(),
          eventVenue: ticket?.eventVenue || "Unknown Venue",
          category: ticket?.category || "OTHER",
          imageUrl: ticket?.imageUrl || "",
          buyerName: "Buyer", // In production, populate from User model
          buyerTrustScore: 75, // Mock data - in production, get from User model
          amount: transaction.amount,
          platformFee: transaction.platformFee,
          tax: transaction.tax,
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod,
          paymentStatus: transaction.paymentStatus,
          transactionStatus: transaction.transactionStatus,
          buyerConfirmed: transaction.buyerConfirmed,
          sellerTransferred: transaction.sellerTransferred,
          disputeRaised: transaction.disputeRaised,
          createdAt: transaction.createdAt,
        };
      })
    );

    // Step 6: Calculate statistics
    const stats = {
      total: transactionsWithDetails.length,
      pendingTransfers: transactionsWithDetails.filter(t => t.transactionStatus === "IN_ESCROW").length,
      inEscrow: transactionsWithDetails.filter(t => ["IN_ESCROW", "TICKET_TRANSFERRED", "BUYER_CONFIRMED"].includes(t.transactionStatus)).length,
      completed: transactionsWithDetails.filter(t => t.transactionStatus === "COMPLETED").length,
      disputed: transactionsWithDetails.filter(t => t.transactionStatus === "DISPUTED").length,
      totalEarnings: transactionsWithDetails
        .filter(t => t.transactionStatus === "COMPLETED")
        .reduce((sum, t) => sum + t.amount, 0),
    };

    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Sales retrieved successfully",
        data: transactionsWithDetails,
        stats: stats,
        count: transactionsWithDetails.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching sales:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your sales",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve sales." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve sales." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve sales." },
    { status: 405 }
  );
}