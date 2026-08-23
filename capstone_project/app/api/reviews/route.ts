import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import Transaction from "@/models/Transaction";
import { updateTrustScore } from "@/lib/trustScore";
import { z } from "zod";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/reviews
 * Creates a new review for a completed transaction
 * 
 * Request Body:
 * - transactionId: string (required)
 * - rating: number (required, 1-5)
 * - comment: string (required, min 10 characters)
 * 
 * Response:
 * - 201: Review created successfully
 * - 400: Validation failed
 * - 401: Unauthorized
 * - 404: Transaction not found
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Check authentication
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please login to leave a review",
        },
        { status: 401 }
      );
    }

    const buyerId = session.user.id;

    // Step 2: Connect to MongoDB
    await connectDB();

    // Step 3: Parse and validate request body with Zod
    const body = await request.json();
    
    const ReviewSchema = z.object({
      transactionId: z.string().min(1, "Transaction ID is required"),
      rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
      comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment cannot exceed 1000 characters"),
    });

    const validatedData = ReviewSchema.safeParse(body);

    if (!validatedData.success) {
      const errors = validatedData.error.issues.map(err => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: errors,
        },
        { status: 400 }
      );
    }

    const { transactionId, rating, comment } = validatedData.data;

    // Step 5: Find the transaction
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

    // Step 6: Verify buyer owns this transaction
    if (transaction.buyerId.toString() !== buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only review transactions you purchased",
        },
        { status: 403 }
      );
    }

    // Step 7: Verify transaction is completed
    if (transaction.transactionStatus !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "You can only review completed transactions",
        },
        { status: 400 }
      );
    }

    // Step 8: Check if review already exists
    const existingReview = await Review.findOne({ transactionId: transactionId });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this transaction",
        },
        { status: 400 }
      );
    }

    // Sanitize comment to prevent XSS
    const sanitizedComment = sanitizeString(comment);

    // Step 9: Create new review
    const newReview = new Review({
      transactionId: transaction._id,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      ticketId: transaction.ticketId,
      rating: rating,
      comment: sanitizedComment,
    });

    // Step 10: Save review to MongoDB
    const savedReview = await newReview.save();

    // Step 11: Update trust score for seller (they received a review)
    await updateTrustScore(transaction.sellerId.toString());

    // Step 12: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        data: {
          id: savedReview._id.toString(),
          transactionId: savedReview.transactionId.toString(),
          rating: savedReview.rating,
          comment: savedReview.comment,
          createdAt: savedReview.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating review:", error);

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
    { message: "Method not allowed. Use POST to create a review." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to create a review." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use POST to create a review." },
    { status: 405 }
  );
}