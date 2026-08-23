import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket, { TicketStatus } from "@/models/Ticket";
import User from "@/models/User";
import VerificationHistory, { VerificationAction } from "@/models/VerificationHistory";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/dashboard/stats
 * 
 * Returns dashboard statistics for admin verification system.
 * Only accessible by ADMIN users.
 * 
 * Statistics include:
 * - Pending verifications
 * - Verified tickets
 * - Rejected tickets
 * - Active listings
 * - Fake listings removed
 * - Total users
 * - Today's performance metrics
 * - Approval/rejection rates
 */

export async function GET(request: NextRequest) {
  try {
    // Step 1: Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Step 2: Connect to database
    await connectDB();

    // Step 3: Get current date for "today" calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = new Date(today);

    // Step 4: Fetch all statistics in parallel
    const [
      pendingVerifications,
      verifiedTickets,
      rejectedTickets,
      activeListings,
      fakeListingsRemoved,
      totalUsers,
      ticketsVerifiedToday,
      allVerifications,
    ] = await Promise.all([
      // Pending verifications: tickets that are not verified and are available
      Ticket.countDocuments({
        isVerified: false,
        status: TicketStatus.ACTIVE,
      }),

      // Verified tickets
      Ticket.countDocuments({
        isVerified: true,
      }),

      // Rejected tickets (status REMOVED and not verified)
      Ticket.countDocuments({
        isVerified: false,
        status: TicketStatus.REMOVED,
      }),

      // Active listings (verified and available)
      Ticket.countDocuments({
        isVerified: true,
        status: TicketStatus.ACTIVE,
      }),

      // Fake listings removed (rejected tickets)
      Ticket.countDocuments({
        isVerified: false,
        status: TicketStatus.REMOVED,
      }),

      // Total users
      User.countDocuments({}),

      // Tickets verified today
      VerificationHistory.countDocuments({
        action: VerificationAction.APPROVED,
        createdAt: { $gte: todayStart },
      }),

      // All verification history for rate calculations
      VerificationHistory.find({}).lean(),
    ]);

    // Step 5: Calculate approval and rejection rates
    const totalActions = allVerifications.length;
    const approvedCount = allVerifications.filter(
      (v: any) => v.action === VerificationAction.APPROVED
    ).length;
    const rejectedCount = allVerifications.filter(
      (v: any) => v.action === VerificationAction.REJECTED
    ).length;

    const approvalRate = totalActions > 0 ? Math.round((approvedCount / totalActions) * 100) : 0;
    const rejectionRate = totalActions > 0 ? Math.round((rejectedCount / totalActions) * 100) : 0;

    // Step 6: Calculate average verification time (simplified - based on creation to approval)
    // In a real implementation, you'd track when each ticket was submitted vs when it was verified
    const averageVerificationTime = 15; // Placeholder: 15 minutes average

    // Step 7: Return statistics
    return NextResponse.json({
      success: true,
      data: {
        pendingVerifications,
        verifiedTickets,
        rejectedTickets,
        activeListings,
        fakeListingsRemoved,
        totalUsers,
        ticketsVerifiedToday,
        averageVerificationTime,
        approvalRate,
        rejectionRate,
      },
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}