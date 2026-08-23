/**
 * Razorpay Order Creation API
 *
 * This API creates a Razorpay payment order when a user wants to purchase a ticket.
 * It validates the user, checks ticket availability, and returns order details for payment processing.
 */

// Step 1: Import required dependencies
// - NextResponse: For sending JSON responses
// - getServerSession: To get the logged-in user's session
// - authOptions: NextAuth configuration
// - connectDB: MongoDB connection function
// - Ticket: Ticket model for database queries
// - razorpayInstance: Reusable Razorpay instance
// - RAZORPAY_KEY_ID: Public key for frontend
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import razorpayInstance, { RAZORPAY_KEY_ID } from "@/lib/razorpay";

// Step 2: Define the TypeScript interface for the request body
// This ensures type safety for incoming data
interface CreateOrderRequest {
  ticketId: string;
}

// Step 3: Define the TypeScript interface for the success response
interface CreateOrderResponse {
  success: true;
  orderId: string;
  amount: number;
  currency: string;
  razorpayKey: string;
}

// Step 4: Define the TypeScript interface for error responses
interface ErrorResponse {
  success: false;
  message: string;
}

// Step 5: Export a POST handler function
// This function will be called when a POST request is made to /api/payment/create-order
export async function POST(request: Request) {
  try {
    // ============================================
    // AUTHENTICATION
    // ============================================

    // Get the current user's session
    // If the user is not logged in, session will be null
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      // Return 401 Unauthorized if user is not logged in
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Unauthorized. Please login to continue." },
        { status: 401 }
      );
    }

    // Extract the buyer's ID from the session
    // This is the user who wants to purchase the ticket
    const buyerId = session.user.id;

    // ============================================
    // REQUEST BODY VALIDATION
    // ============================================

    // Parse the request body to get ticketId
    const body: CreateOrderRequest = await request.json();

    // Extract ticketId from the request body
    const { ticketId } = body;

    // Validate that ticketId is provided
    if (!ticketId || typeof ticketId !== "string" || !mongoose.isValidObjectId(ticketId)) {
      // Return 400 Bad Request if ticketId is missing or invalid
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Invalid request. ticketId must be a valid MongoDB ObjectId." },
        { status: 400 }
      );
    }

    // ============================================
    // DATABASE CONNECTION
    // ============================================

    // Connect to MongoDB before performing any database operations
    await connectDB();

    // ============================================
    // TICKET VALIDATION
    // ============================================

    // Find the ticket in the database using the provided ticketId
    const ticket = await Ticket.findById(ticketId);

    // Check if ticket exists
    if (!ticket) {
      // Return 404 Not Found if ticket doesn't exist
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Ticket not found." },
        { status: 404 }
      );
    }

    // Check if ticket is available for purchase
    // The ticket must have ACTIVE status (not SOLD, PENDING, or REMOVED)
    if (ticket.status !== "ACTIVE") {
      // Return 400 Bad Request if ticket is not available
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Ticket is not available for purchase." },
        { status: 400 }
      );
    }

    // Check if ticket price is valid (greater than 0)
    if (!ticket.price || ticket.price <= 0) {
      // Return 400 Bad Request if price is invalid
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Invalid ticket price." },
        { status: 400 }
      );
    }

    // ============================================
    // RAZORPAY ORDER CREATION
    // ============================================

    // Convert amount from rupees to paise
    // Razorpay expects amounts in the smallest currency unit (paise for INR)
    // Example: ₹2500 = 250000 paise
    const amountInPaise = ticket.price * 100;

    // Create a Razorpay order
    // This order will be used to process the payment
    const order = await razorpayInstance.orders.create({
      // Amount in paise (smallest currency unit)
      amount: amountInPaise,
      // Currency code (INR for Indian Rupees)
      currency: "INR",
      // Payment capture method
      // true means payment will be captured automatically
      payment_capture: true,
      // Add useful notes to the order for reference
      // These notes help identify the ticket and users involved
      notes: {
        // Store the ticket ID for reference
        ticketId: ticket._id.toString(),
        // Store the buyer's ID (logged-in user)
        buyerId: buyerId,
        // Store the seller's ID (ticket owner)
        sellerId: ticket.sellerId.toString(),
        // Store the event name for easy identification
        eventName: ticket.eventName,
      },
    });

    // ============================================
    // RESPONSE GENERATION
    // ============================================

    // Prepare the success response with order details
    // This data will be sent to the frontend to initialize Razorpay payment
    const response: CreateOrderResponse = {
      success: true,
      // Razorpay order ID (needed for payment processing)
      orderId: order.id,
      // Amount in paise (same as sent to Razorpay)
      // Convert to number to ensure type safety
      amount: Number(order.amount),
      // Currency code
      currency: order.currency,
      // Razorpay Key ID (public key, safe to expose to frontend)
      razorpayKey: RAZORPAY_KEY_ID,
    };

    // Return 200 OK with the order details
    return NextResponse.json<CreateOrderResponse>(response, { status: 200 });

  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================

    // Log the error for debugging purposes
    console.error("Error creating Razorpay order:", error);

    // Return 500 Internal Server Error for any unexpected errors
    return NextResponse.json<ErrorResponse>(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create payment order. Please try again." 
      },
      { status: 500 }
    );
  }
}