import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import VerificationHistory, { VerificationAction, RejectionReason } from "@/models/VerificationHistory";
import { updateTrustScore } from "@/lib/trustScore";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/admin/tickets/[id]/reject
 * 
 * Rejects a ticket verification with a reason.
 * Only accessible by ADMIN users.
 * 
 * Actions:
 * 1. Validates admin permissions
 * 2. Validates rejection reason
 * 3. Updates ticket status to REMOVED
 * 4. Decreases seller trust score
 * 5. Creates verification history log
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

    // Step 3: Parse request body
    const body = await request.json();
    const { reason, adminMessage } = body;

    // Step 4: Validate rejection reason
    if (!reason || !Object.values(RejectionReason).includes(reason)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid rejection reason",
          validReasons: Object.values(RejectionReason)
        },
        { status: 400 }
      );
    }

    // Step 5: Connect to database
    await connectDB();

    // Step 6: Fetch ticket with seller information
    const ticket = await Ticket.findById(ticketId).populate("sellerId", "name email trustScore");

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Step 7: Check if ticket is already verified
    if (ticket.isVerified) {
      return NextResponse.json(
        { success: false, message: "Cannot reject a verified ticket" },
        { status: 400 }
      );
    }

    // Step 8: Update ticket status to REMOVED
    ticket.status = "REMOVED" as any;
    await ticket.save();

    // Step 9: Create verification history log
    await VerificationHistory.create({
      ticketId: ticket._id,
      adminId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
      action: VerificationAction.REJECTED,
      reason: reason as RejectionReason,
      adminMessage: adminMessage || undefined,
    });

    // Step 10: Update seller trust score (async, don't block response)
    const sellerId = ticket.sellerId.toString();
    updateTrustScore(sellerId).catch((error) => {
      console.error("Error updating trust score:", error);
    });

    // Step 11: Return success response
    return NextResponse.json({
      success: true,
      message: "Ticket rejected successfully",
      data: {
        ticketId: ticket._id,
        status: ticket.status,
        reason: reason,
        seller: {
          id: ticket.sellerId,
          name: (ticket.sellerId as any).name,
          trustScore: (ticket.sellerId as any).trustScore,
        },
      },
    });

  } catch (error) {
    console.error("Error rejecting ticket:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reject ticket",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}