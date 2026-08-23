import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import VerificationHistory from "@/models/VerificationHistory";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/verifications/[id]
 * 
 * Fetches detailed information about a specific ticket for verification.
 * Only accessible by ADMIN users.
 * 
 * Returns:
 * - Ticket information
 * - Seller information
 * - Verification history
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Step 2: Validate ticket ID
    const { id: ticketId } = await params;
    if (!ticketId || !/^[0-9a-fA-F]{24}$/.test(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    await connectDB();

    // Step 4: Fetch ticket with seller information
    const ticket = await Ticket.findById(ticketId).populate(
      "sellerId",
      "name email trustScore"
    );

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Step 5: Fetch verification history for this ticket
    const verificationHistory = await VerificationHistory.find({ ticketId: ticket._id })
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Step 6: Transform verification history
    const transformedHistory = verificationHistory.map((entry: any) => ({
      _id: entry._id.toString(),
      action: entry.action,
      reason: entry.reason,
      adminMessage: entry.adminMessage,
      createdAt: entry.createdAt,
      adminId: {
        name: entry.adminId?.name || "Unknown Admin",
        email: entry.adminId?.email || "",
      },
    }));

    // Step 7: Transform ticket data
    const seller = ticket.sellerId as any;
    const transformedTicket = {
      id: ticket._id.toString(),
      title: ticket.title,
      description: ticket.description,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      eventVenue: ticket.eventVenue,
      imageUrl: ticket.imageUrl,
      price: ticket.price,
      originalPrice: ticket.originalPrice,
      isVerified: ticket.isVerified,
      status: ticket.status,
      createdAt: ticket.createdAt,
      sellerId: {
        _id: seller._id.toString(),
        name: seller.name,
        email: seller.email,
        trustScore: seller.trustScore,
      },
      verificationHistory: transformedHistory,
    };

    // Step 8: Return success response
    return NextResponse.json({
      success: true,
      data: transformedTicket,
    });

  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch ticket details",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}