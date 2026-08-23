import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction, { TransactionStatus } from "@/models/Transaction";
import Ticket from "@/models/Ticket";
import User, { UserRole } from "@/models/User";

export async function GET() {
  try {
    // Requires admin authentication (check session)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin privileges required." },
        { status: 401 }
      );
    }

    // Ensure database connection is established
    await connectDB();

    // Run aggregations in parallel for better performance
    const [
      revenueAnalytics,
      categoryDistribution,
      topSellers,
      trustScoreDistribution
    ] = await Promise.all([
      
      // Pipeline 1: Revenue analytics
      // Groups completed transactions by month and year, summing the amounts
      Transaction.aggregate([
        { $match: { transactionStatus: TransactionStatus.COMPLETED } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            revenue: { $sum: "$amount" },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // Pipeline 2: Category distribution
      // Groups tickets by category, providing counts and average prices
      Ticket.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Pipeline 3: Top sellers
      // Joins transactions with users to find top sellers by total sales
      Transaction.aggregate([
        { $match: { transactionStatus: TransactionStatus.COMPLETED } },
        {
          $group: {
            _id: "$sellerId",
            totalSales: { $sum: "$amount" },
            ticketsSold: { $sum: 1 }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users", // The User collection name in MongoDB
            localField: "_id",
            foreignField: "_id",
            as: "sellerInfo"
          }
        },
        { $unwind: "$sellerInfo" },
        {
          $project: {
            _id: 1,
            totalSales: 1,
            ticketsSold: 1,
            name: "$sellerInfo.name",
            email: "$sellerInfo.email",
            trustScore: "$sellerInfo.trustScore"
          }
        }
      ]),

      // Pipeline 4: Trust score distribution
      // Buckets users into trust score ranges (0-20, 20-40, etc.)
      User.aggregate([
        {
          $bucket: {
            groupBy: "$trustScore",
            boundaries: [0, 20, 40, 60, 80, 100],
            default: "100+", // For scores equal to 100
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ])
    ]);

    return NextResponse.json({
      revenueAnalytics,
      categoryDistribution,
      topSellers,
      trustScoreDistribution
    });

  } catch (error) {
    console.error("Admin Analytics API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}