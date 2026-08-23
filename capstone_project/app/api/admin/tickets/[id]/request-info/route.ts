import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import VerificationHistory, { VerificationAction } from "@/models/VerificationHistory";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/admin/tickets/[id]/request-info
 * 
 * Requests more information from the seller about a ticket.
 * Only accessible by ADMIN users.
 * 
 * Actions:
 * 1. Validates admin permissions
 * 2. Validates admin message
 * 3. Creates verification history log
 * 4. (Future: Send notification to seller)
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
    const { adminMessage } = body;

    // Step 4: Validate admin message
    if (!adminMessage || adminMessage.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Admin message is required" },
        { status: 400 }
      );
    }

    if (adminMessage.length > 500) {
      return NextResponse.json(
        { success: false, message: "Admin message cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Step 5: Connect to database
    await connectDB();

    // Step 6: Fetch ticket
    const ticket = await Ticket.findById(ticketId).populate("sellerId", "name email");

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Step 7: Check if ticket is already verified
    if (ticket.isVerified) {
      return NextResponse.json(
        { success: false, message: "Cannot request info for a verified ticket" },
        { status: 400 }
      );
    }

    // Step 8: Create verification history log
    await VerificationHistory.create({
      ticketId: ticket._id,
      adminId: new (await import("mongoose")).default.Types.ObjectId(session.user.id),
      action: VerificationAction.REQUEST_INFO,
      adminMessage: adminMessage.trim(),
    });

    // Step 9: TODO: Send notification to seller
    // In a production app, you would send an email or in-app notification here
    // Example: await sendNotificationToSeller(ticket.sellerId, adminMessage);

    // Step 10: Return success response
    return NextResponse.json({
      success: true,
      message: "Information request sent to seller successfully",
      data: {
        ticketId: ticket._id,
        adminMessage: adminMessage.trim(),
        seller: {
          id: ticket.sellerId,
          name: (ticket.sellerId as any).name,
          email: (ticket.sellerId as any).email,
        },
      },
    });

  } catch (error) {
    console.error("Error requesting info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to request information",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}