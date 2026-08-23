import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import VerificationHistory, { VerificationAction } from "@/models/VerificationHistory";
import { updateTrustScore } from "@/lib/trustScore";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/admin/tickets/[id]/approve
 * 
 * Approves a ticket verification.
 * Only accessible by ADMIN users.
 * 
 * Actions:
 * 1. Validates admin permissions
 * 2. Updates ticket isVerified to true
 * 3. Increases seller trust score
 * 4. Creates verification history log
 */

export async function PATCH(
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
    const ticket = await Ticket.findById(ticketId).populate("sellerId", "name email trustScore");

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Step 5: Check if ticket is already verified
    if (ticket.isVerified) {
      return NextResponse.json(
        { success: false, message: "Ticket is already verified" },
        { status: 400 }
      );
    }

    // Step 6: Update ticket verification status
    ticket.isVerified = true;
    await ticket.save();

    // Step 7: Create verification history log
    await VerificationHistory.create({
      ticketId: ticket._id,
      adminId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
      action: VerificationAction.APPROVED,
    });

    // Step 8: Update seller trust score (async, don't block response)
    const sellerId = ticket.sellerId.toString();
    updateTrustScore(sellerId).catch((error) => {
      console.error("Error updating trust score:", error);
    });

    // Step 9: Return success response
    return NextResponse.json({
      success: true,
      message: "Ticket approved successfully",
      data: {
        ticketId: ticket._id,
        isVerified: ticket.isVerified,
        seller: {
          id: ticket.sellerId,
          name: (ticket.sellerId as any).name,
          trustScore: (ticket.sellerId as any).trustScore,
        },
      },
    });

  } catch (error) {
    console.error("Error approving ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to approve ticket",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}