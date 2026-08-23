import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";

/**
 * GET /api/reviews/seller/[sellerId]
 * Fetches all reviews for a specific seller
 * 
 * URL Parameters:
 * - sellerId: string (required) - The ID of the seller
 * 
 * Response:
 * - 200: Successfully retrieved reviews
 * - 400: Missing sellerId
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get sellerId from URL parameters
  const { sellerId } = await params;

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

    // Step 4: Fetch all reviews for this seller
    const reviews = await Review.find({ sellerId: sellerId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Step 5: Calculate statistics
    const totalReviews = reviews.length;
    
    // Calculate average rating
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    // Step 6: Format reviews for response
    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      transactionId: review.transactionId.toString(),
      buyerId: review.buyerId.toString(),
      ticketId: review.ticketId.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Reviews retrieved successfully",
        data: {
          reviews: formattedReviews,
          stats: {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            ratingDistribution,
          },
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching reviews:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load reviews",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve reviews." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve reviews." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve reviews." },
    { status: 405 }
  );
}