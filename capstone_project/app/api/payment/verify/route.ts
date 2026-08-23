/**
 * Payment Verification API
 *
 * This API verifies Razorpay payment signatures on the backend.
 * It ensures the payment is legitimate before updating database records.
 * 
 * SECURITY: Never trust the frontend. Always verify signatures on the backend.
 */

// Step 1: Import required dependencies
// - NextResponse: For sending JSON responses
// - getServerSession: To get the logged-in user's session
// - authOptions: NextAuth configuration
// - connectDB: MongoDB connection function
// - Transaction: Transaction model for database operations
// - crypto: Node.js built-in module for HMAC SHA256 signature verification
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { PaymentStatus } from "@/models/Transaction";
import crypto from "crypto";

// Step 2: Define the TypeScript interface for the request body
interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  ticketId: string;
}

// Step 3: Define the TypeScript interface for success response
interface VerifyPaymentResponse {
  success: true;
  message: string;
}

// Step 4: Define the TypeScript interface for error responses
interface ErrorResponse {
  success: false;
  message: string;
}

// Step 5: Export a POST handler function
// This function will be called when a POST request is made to /api/payment/verify
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

    // Extract the user ID from the session
    const userId = session.user.id;

    // ============================================
    // REQUEST BODY VALIDATION
    // ============================================

    // Parse the request body
    const body: VerifyPaymentRequest = await request.json();

    // Extract required fields from the request
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ticketId } = body;

    // Validate that all required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !ticketId || !mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Invalid request. All fields are required and ticketId must be a valid MongoDB ObjectId." },
        { status: 400 }
      );
    }

    // ============================================
    // DATABASE CONNECTION
    // ============================================

    // Connect to MongoDB before performing any database operations
    await connectDB();

    // ============================================
    // SIGNATURE VERIFICATION (CRITICAL SECURITY STEP)
    // ============================================

    // Read the Razorpay Key Secret from environment variables
    // This secret is NEVER exposed to the frontend
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    // Validate that the secret exists
    if (!RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Payment verification failed. Server configuration error." },
        { status: 500 }
      );
    }

    // Generate the expected signature using HMAC SHA256
    // Razorpay sends: razorpay_order_id + razorpay_payment_id
    // We need to create the same signature using our secret key
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Create HMAC SHA256 hash
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    // Compare the generated signature with the signature from Razorpay
    // Use timing-safe comparison to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    // If signatures don't match, the payment is fraudulent
    if (!isSignatureValid) {
      // Return 400 Bad Request for invalid signature
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // ============================================
    // FIND TRANSACTION
    // ============================================

    // Find the transaction by ticket ID
    // We use ticketId to find the transaction because the order was created for this ticket
    const transaction = await Transaction.findOne({ ticketId });

    // Check if transaction exists
    if (!transaction) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    // Verify that the user is the buyer of this transaction
    // This prevents users from verifying payments for other users' transactions
    if (transaction.buyerId.toString() !== userId) {
      return NextResponse.json<ErrorResponse>(
        { success: false, message: "Unauthorized. You can only verify your own payments." },
        { status: 401 }
      );
    }

    // ============================================
    // UPDATE TRANSACTION
    // ============================================

    // Update the transaction with payment verification details
    transaction.paymentStatus = PaymentStatus.PAID;
    transaction.razorpayOrderId = razorpay_order_id;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.paidAt = new Date();

    // Save the updated transaction to the database
    await transaction.save();

    // ============================================
    // RESPONSE GENERATION
    // ============================================

    // Return success response
    const response: VerifyPaymentResponse = {
      success: true,
      message: "Payment verified successfully.",
    };

    // Return 200 OK with success message
    return NextResponse.json<VerifyPaymentResponse>(response, { status: 200 });

  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================

    // Log the error for debugging purposes
    console.error("Error verifying payment:", error);

    // Return 500 Internal Server Error for any unexpected errors
    return NextResponse.json<ErrorResponse>(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to verify payment. Please try again." 
      },
      { status: 500 }
    );
  }
}