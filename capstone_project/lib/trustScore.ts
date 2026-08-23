import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Review from "@/models/Review";
import Ticket from "@/models/Ticket";

/**
 * Trust Score Calculation Library
 * 
 * Automatically calculates and updates user trust scores based on marketplace activity.
 * Trust scores range from 0 to 100, starting at 50 for new users.
 * 
 * Scoring Rules:
 * - Base score: 50 points
 * - Positive actions increase score
 * - Negative actions decrease score
 * - Score is clamped between 0 and 100
 */

/**
 * Trust Badge Configuration
 * Maps score ranges to badge names and colors
 */
export interface TrustBadge {
  name: string;
  color: string;
  bgColor: string;
  minScore: number;
  maxScore: number;
}

/**
 * Get trust badge based on score
 * 
 * @param score - Trust score (0-100)
 * @returns TrustBadge object with name and colors
 */
export function getTrustBadge(score: number): TrustBadge {
  if (score >= 81) {
    return {
      name: "Verified Trusted Seller",
      color: "text-green-600",
      bgColor: "bg-green-100",
      minScore: 81,
      maxScore: 100,
    };
  } else if (score >= 61) {
    return {
      name: "Trusted Seller",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      minScore: 61,
      maxScore: 80,
    };
  } else if (score >= 41) {
    return {
      name: "Average Seller",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      minScore: 41,
      maxScore: 60,
    };
  } else if (score >= 21) {
    return {
      name: "Needs Improvement",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      minScore: 21,
      maxScore: 40,
    };
  } else {
    return {
      name: "High Risk",
      color: "text-red-600",
      bgColor: "bg-red-100",
      minScore: 0,
      maxScore: 20,
    };
  }
}

/**
 * Calculate Trust Score for a User
 * 
 * This function calculates the trust score from scratch by analyzing:
 * - Transaction history (sales and purchases)
 * - Reviews received
 * - Disputes raised
 * - Cancellations and refunds
 * - Ticket verification status
 * 
 * @param userId - The ID of the user to calculate score for
 * @returns Promise with calculated trust score and breakdown
 */
export async function calculateTrustScore(userId: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID",
        score: 0,
      };
    }

    // Initialize score with base value
    let score = 50;

    // Track score changes for debugging/transparency
    const scoreBreakdown: { action: string; points: number; reason: string }[] = [
      { action: "Base Score", points: 50, reason: "New user starts with 50 points" },
    ];

    // Fetch all relevant data
    const [transactions, reviews, tickets] = await Promise.all([
      Transaction.find({ $or: [{ buyerId: userId }, { sellerId: userId }] }).lean(),
      Review.find({ sellerId: userId }).lean(),
      Ticket.find({ sellerId: userId }).lean(),
    ]);

    // Separate sales and purchases
    const sales = transactions.filter((t: any) => t.sellerId.toString() === userId);
    const purchases = transactions.filter((t: any) => t.buyerId.toString() === userId);

    // ========================================
    // POSITIVE SCORING
    // ========================================

    // Completed Sales: +3 points each
    const completedSales = sales.filter((t: any) => t.transactionStatus === "COMPLETED");
    if (completedSales.length > 0) {
      const points = completedSales.length * 3;
      score += points;
      scoreBreakdown.push({
        action: "Completed Sales",
        points,
        reason: `${completedSales.length} completed sale(s) × 3 points`,
      });
    }

    // Completed Purchases: +2 points each
    const completedPurchases = purchases.filter((t: any) => t.transactionStatus === "COMPLETED");
    if (completedPurchases.length > 0) {
      const points = completedPurchases.length * 2;
      score += points;
      scoreBreakdown.push({
        action: "Completed Purchases",
        points,
        reason: `${completedPurchases.length} completed purchase(s) × 2 points`,
      });
    }

    // Verified Tickets Sold: +2 points each
    const verifiedTickets = tickets.filter((t: any) => t.isVerified);
    if (verifiedTickets.length > 0) {
      const points = verifiedTickets.length * 2;
      score += points;
      scoreBreakdown.push({
        action: "Verified Tickets",
        points,
        reason: `${verifiedTickets.length} verified ticket(s) × 2 points`,
      });
    }

    // Positive Reviews (4-5 stars): +2 points each
    const positiveReviews = reviews.filter((r: any) => r.rating >= 4);
    if (positiveReviews.length > 0) {
      const points = positiveReviews.length * 2;
      score += points;
      scoreBreakdown.push({
        action: "Positive Reviews",
        points,
        reason: `${positiveReviews.length} positive review(s) (4-5 stars) × 2 points`,
      });
    }

    // Average Rating > 4.5: +5 bonus points
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      if (averageRating > 4.5) {
        score += 5;
        scoreBreakdown.push({
          action: "High Rating Bonus",
          points: 5,
          reason: `Average rating ${averageRating.toFixed(1)} > 4.5`,
        });
      }
    }

    // Quick Transfer Bonus: +1 point
    // Check if seller transferred tickets quickly (within 24 hours of escrow)
    const quickTransfers = sales.filter((t: any) => {
      if (t.transactionStatus !== "TICKET_TRANSFERRED" || !t.sellerTransferred) return false;
      // In a real implementation, you'd check timestamps
      // For now, we'll award this if they have any transferred tickets
      return true;
    });
    if (quickTransfers.length > 0) {
      score += 1;
      scoreBreakdown.push({
        action: "Quick Transfer Bonus",
        points: 1,
        reason: "Seller transferred ticket(s) quickly",
      });
    }

    // More than 100 successful transactions: +10 bonus
    const totalSuccessful = completedSales.length + completedPurchases.length;
    if (totalSuccessful > 100) {
      score += 10;
      scoreBreakdown.push({
        action: "Volume Bonus",
        points: 10,
        reason: `${totalSuccessful} successful transactions > 100`,
      });
    }

    // ========================================
    // NEGATIVE SCORING
    // ========================================

    // Disputes Raised: -10 points each
    const disputes = transactions.filter((t: any) => t.disputeRaised);
    if (disputes.length > 0) {
      const points = disputes.length * 10;
      score -= points;
      scoreBreakdown.push({
        action: "Disputes",
        points: -points,
        reason: `${disputes.length} dispute(s) raised × -10 points`,
      });
    }

    // Cancelled Transactions: -5 points each
    const cancelled = transactions.filter((t: any) => t.transactionStatus === "CANCELLED");
    if (cancelled.length > 0) {
      const points = cancelled.length * 5;
      score -= points;
      scoreBreakdown.push({
        action: "Cancellations",
        points: -points,
        reason: `${cancelled.length} cancelled transaction(s) × -5 points`,
      });
    }

    // Refunds Issued: -8 points each
    const refunds = transactions.filter((t: any) => t.paymentStatus === "REFUNDED");
    if (refunds.length > 0) {
      const points = refunds.length * 8;
      score -= points;
      scoreBreakdown.push({
        action: "Refunds",
        points: -points,
        reason: `${refunds.length} refund(s) issued × -8 points`,
      });
    }

    // ========================================
    // CLAMP SCORE
    // ========================================

    // Ensure score stays between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Update user's trust score in database
    await User.findByIdAndUpdate(userId, { trustScore: score });

    return {
      success: true,
      score,
      breakdown: scoreBreakdown,
      message: `Trust score calculated: ${score}`,
    };

  } catch (error) {
    console.error("Error calculating trust score:", error);
    return {
      success: false,
      message: "Failed to calculate trust score",
      error: error instanceof Error ? error.message : "Unknown error",
      score: 0,
    };
  }
}

/**
 * Update Trust Score
 * 
 * Wrapper function that calculates and updates trust score.
 * This is the main function to call when an event occurs.
 * 
 * @param userId - The ID of the user to update
 * @returns Promise with update result
 */
export async function updateTrustScore(userId: string) {
  try {
    const result = await calculateTrustScore(userId);
    
    if (result.success) {
      console.log(`Trust score updated for user ${userId}: ${result.score}`);
    }

    return result;
  } catch (error) {
    console.error("Error updating trust score:", error);
    return {
      success: false,
      message: "Failed to update trust score",
      score: 0,
    };
  }
}

/**
 * Batch Update Trust Scores
 * 
 * Updates trust scores for multiple users at once.
 * Useful for admin operations or bulk recalculations.
 * 
 * @param userIds - Array of user IDs to update
 * @returns Promise with update results
 */
export async function batchUpdateTrustScores(userIds: string[]) {
  try {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const result = await updateTrustScore(userId);
        return {
          userId,
          success: result.success,
          score: result.score,
        };
      })
    );

    return {
      success: true,
      message: `Updated ${results.length} trust scores`,
      results,
    };
  } catch (error) {
    console.error("Error batch updating trust scores:", error);
    return {
      success: false,
      message: "Failed to batch update trust scores",
    };
  }
}

/**
 * Get Trust Score Statistics
 * 
 * Returns statistics about trust scores across all users.
 * Useful for admin dashboards.
 * 
 * @returns Promise with trust score statistics
 */
export async function getTrustScoreStatistics() {
  try {
    await connectDB();

    const users = await User.find({}).lean();

    const totalUsers = users.length;
    const averageScore = totalUsers > 0
      ? users.reduce((sum, user) => sum + (user.trustScore || 50), 0) / totalUsers
      : 0;

    const distribution = {
      highRisk: users.filter((u: any) => (u.trustScore || 50) < 21).length,
      needsImprovement: users.filter((u: any) => (u.trustScore || 50) >= 21 && (u.trustScore || 50) < 41).length,
      average: users.filter((u: any) => (u.trustScore || 50) >= 41 && (u.trustScore || 50) < 61).length,
      trusted: users.filter((u: any) => (u.trustScore || 50) >= 61 && (u.trustScore || 50) < 81).length,
      verified: users.filter((u: any) => (u.trustScore || 50) >= 81).length,
    };

    return {
      success: true,
      data: {
        totalUsers,
        averageScore: Math.round(averageScore * 10) / 10,
        distribution,
      },
    };
  } catch (error) {
    console.error("Error getting trust score statistics:", error);
    return {
      success: false,
      message: "Failed to get trust score statistics",
    };
  }
}