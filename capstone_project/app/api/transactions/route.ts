import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Ticket, { TicketStatus } from "@/models/Ticket";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/transactions
 * Creates a new transaction when a buyer purchases a ticket
 * 
 * Request Body:
 * - ticketId: string (required) - The ticket being purchased
 * - paymentMethod: string (required) - CARD, UPI, or NET_BANKING
 * 
 * Response:
 * - 201: Transaction created successfully
 * - 400: Validation failed or ticket unavailable
 * - 401: User not authenticated
 * - 404: Ticket not found
 * - 500: Internal server error
 * 
 * Note: This endpoint requires NextAuth authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Check if user is authenticated using NextAuth session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please login to purchase tickets",
        },
        { status: 401 }
      );
    }

    // Get user ID from session
    const buyerId = session.user.id;

    // Step 2: Connect to MongoDB
    await connectDB();

    // Step 3: Parse request body
    const body = await request.json();
    const { ticketId, paymentMethod } = body;

    // Step 4: Validate required fields
    if (!ticketId || typeof ticketId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required",
        },
        { status: 400 }
      );
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method is required",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["CARD", "UPI", "NET_BANKING"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method. Use CARD, UPI, or NET_BANKING",
        },
        { status: 400 }
      );
    }

    // Step 5: Find the ticket
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 }
      );
    }

    // Step 6: Check if ticket is available
    if (ticket.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket is no longer available for purchase",
        },
        { status: 400 }
      );
    }

    // Step 7: Prevent users from buying their own tickets
    if (ticket.sellerId.toString() === buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot purchase your own ticket",
        },
        { status: 400 }
      );
    }

    // Step 8: Calculate pricing
    const amount = ticket.price; // Selling price
    const platformFee = amount * 0.05; // 5% platform fee
    const tax = amount * 0.02; // 2% tax
    const totalAmount = amount + platformFee + tax;

    // Step 9: Create new transaction
    const newTransaction = new Transaction({
      buyerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: ticket.sellerId,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      amount: amount,
      platformFee: platformFee,
      tax: tax,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      paymentStatus: "PENDING", // Will be updated after payment
      transactionStatus: "PENDING", // Will be updated to IN_ESCROW after payment
      buyerConfirmed: false,
      sellerTransferred: false,
      disputeRaised: false,
    });

    // Step 10: Save transaction to MongoDB
    const savedTransaction = await newTransaction.save();

    // Step 11: Update ticket status to PENDING (reserve the ticket)
    ticket.status = TicketStatus.PENDING;
    await ticket.save();

    // Step 12: Return success response with 201 status
    return NextResponse.json(
      {
        success: true,
        message: "Transaction created successfully",
        transaction: {
          id: savedTransaction._id.toString(),
          buyerId: savedTransaction.buyerId.toString(),
          sellerId: savedTransaction.sellerId.toString(),
          ticketId: savedTransaction.ticketId.toString(),
          amount: savedTransaction.amount,
          platformFee: savedTransaction.platformFee,
          tax: savedTransaction.tax,
          totalAmount: savedTransaction.totalAmount,
          paymentMethod: savedTransaction.paymentMethod,
          paymentStatus: savedTransaction.paymentStatus,
          transactionStatus: savedTransaction.transactionStatus,
          createdAt: savedTransaction.createdAt,
        },
        ticket: {
          id: ticket._id.toString(),
          title: ticket.title,
          eventName: ticket.eventName,
          status: ticket.status,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    // Step 13: Handle errors
    console.error("Error creating transaction:", error);

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please login to continue",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = session.user.id;

    const transactions = await Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate({ path: "ticketId", select: "title eventName eventDate eventVenue city category imageUrl price" })
      .populate({ path: "buyerId", select: "name email" })
      .populate({ path: "sellerId", select: "name email" })
      .sort({ createdAt: -1 })
      .lean<any[]>();

    const formattedTransactions = transactions.map((transaction: any) => {
      const ticket = transaction.ticketId as {
        _id?: { toString: () => string } | string;
        title?: string;
        eventName?: string;
        eventDate?: Date | string;
        eventVenue?: string;
        city?: string;
        category?: string;
        imageUrl?: string;
      };

      const buyer = transaction.buyerId as { name?: string } | undefined;
      const seller = transaction.sellerId as { name?: string } | undefined;

      return {
      id: transaction._id.toString(),
      ticketId: ticket?._id?.toString() || transaction.ticketId?.toString(),
      ticketTitle: ticket?.title || "Ticket",
      eventName: ticket?.eventName || "Event",
      eventDate: ticket?.eventDate || transaction.createdAt,
      eventVenue: ticket?.eventVenue || "Venue",
      city: ticket?.city || "City",
      category: ticket?.category || "General",
      imageUrl: ticket?.imageUrl || "",
      buyerName: buyer?.name || "Buyer",
      sellerName: seller?.name || "Seller",
      amount: transaction.amount,
      platformFee: transaction.platformFee,
      tax: transaction.tax,
      totalAmount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
      escrowStatus: transaction.escrowStatus,
      transactionStatus: transaction.transactionStatus,
      buyerConfirmed: transaction.buyerConfirmed,
      sellerTransferred: transaction.sellerTransferred,
      transferredAt: transaction.transferredAt,
      buyerConfirmedAt: transaction.buyerConfirmedAt,
      completedAt: transaction.completedAt,
      releasedAt: transaction.releasedAt,
      releaseDate: transaction.releaseDate,
      releasedAmount: transaction.releasedAmount,
      soldAt: transaction.soldAt,
      razorpayOrderId: transaction.razorpayOrderId,
      razorpayPaymentId: transaction.razorpayPaymentId,
      razorpaySignature: transaction.razorpaySignature,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: formattedTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);

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

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to create a transaction." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to create a transaction." },
    { status: 405 }
  );
}