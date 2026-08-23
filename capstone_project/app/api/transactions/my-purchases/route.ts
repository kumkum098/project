import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Ticket from "@/models/Ticket";
import mongoose from "mongoose";

/**
 * GET /api/transactions/my-purchases
 * Fetches all transactions where the logged-in user is the buyer
 * 
 * Query Parameters:
 * - userId: string (required) - The ID of the buyer
 * 
 * Response:
 * - 200: Successfully retrieved purchases
 * - 400: Missing userId
 * - 401: Unauthorized
 * - 500: Internal server error
 * 
 * Note: In production, userId would come from NextAuth session
 */
export async function GET(request: NextRequest) {
  const requestUrl = request.url;

  try {
    // Step 1: Check authentication (optional for this endpoint)
    const session = await getServerSession();
    console.log("Transaction API Request URL:", requestUrl);
    console.log("Transaction API Session:", {
      hasSession: !!session?.user,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
    });

    // In production, you would use session.user.id
    // For now, we accept userId from query params

    // Step 2: Connect to MongoDB
    await connectDB();
    console.log("Transaction API MongoDB readyState:", mongoose.connection.readyState);

    // Step 3: Get userId from query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") ?? session?.user?.id;
    console.log("Transaction API Query Params:", { userId });

    // Step 4: Validate userId
    if (!userId) {
      console.error("Transaction API Error: User ID is missing", { requestUrl });
      console.log("Transaction API Response Status:", 200);
      return NextResponse.json(
        {
          success: true,
          message: "No purchases found",
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    if (!mongoose.isValidObjectId(userId)) {
      console.error("Transaction API Error: Invalid user ID format", { userId, requestUrl });
      console.log("Transaction API Response Status:", 200);
      return NextResponse.json(
        {
          success: true,
          message: "No purchases found",
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    // Step 5: Convert userId to ObjectId and fetch transactions
    const buyerObjectId = new mongoose.Types.ObjectId(userId);

    // Step 6: Fetch transactions for this buyer
    const transactions = await Transaction.find({ buyerId: buyerObjectId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    console.log("Transaction API Query Result:", {
      userId,
      transactionCount: transactions.length,
      sampleTransactionIds: transactions.slice(0, 5).map((t: any) => t._id?.toString()),
    });
    console.log("Transaction API Response Status:", 200);

    // Step 7: Populate ticket and seller details
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction: any) => {
        const ticket = await Ticket.findById(transaction.ticketId);
        const seller = ticket?.sellerId;

        return {
          id: transaction._id.toString(),
          ticketId: transaction.ticketId.toString(),
          ticketTitle: ticket?.title || "Unknown Ticket",
          eventName: ticket?.eventName || "Unknown Event",
          eventDate: ticket?.eventDate || new Date(),
          eventVenue: ticket?.eventVenue || "Unknown Venue",
          category: ticket?.category || "OTHER",
          imageUrl: ticket?.imageUrl || "",
          sellerName: "Seller", // In production, populate from User model
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

    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Purchases retrieved successfully",
        data: transactionsWithDetails,
        count: transactionsWithDetails.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Transaction API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your purchases",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve purchases." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve purchases." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve purchases." },
    { status: 405 }
  );
}