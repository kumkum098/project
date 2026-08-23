import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * PATCH /api/tickets/[id]/mark-sold
 * Marks a ticket listing as sold
 * 
 * URL Parameters:
 * - id: string (required) - The ticket ID to mark as sold
 * 
 * Request Body:
 * - userId: string (required) - For authorization
 * 
 * Response:
 * - 200: Ticket marked as sold successfully
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (user doesn't own ticket)
 * - 404: Ticket not found
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please log in to update listings",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 3: Get ticket ID from URL parameters
    const { id: ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required",
        },
        { status: 400 }
      );
    }

    // Step 4: Parse request body
    const body = await request.json();
    const { userId: bodyUserId } = body;

    // Step 5: Verify user authorization
    if (bodyUserId && bodyUserId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID mismatch",
        },
        { status: 401 }
      );
    }

    // Step 6: Find the ticket
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 }
      );
    }

    // Step 7: Verify the user owns this ticket
    if (ticket.sellerId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You can only update your own listings",
        },
        { status: 403 }
      );
    }

    // Step 8: Check if ticket is already sold
    if (ticket.status === "SOLD") {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket is already marked as sold",
        },
        { status: 400 }
      );
    }

    // Step 9: Update ticket status to SOLD
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status: "SOLD",
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Step 10: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Ticket marked as sold successfully",
        data: {
          id: updatedTicket!._id.toString(),
          title: updatedTicket!.title,
          eventName: updatedTicket!.eventName,
          status: updatedTicket!.status,
          updatedAt: updatedTicket!.updatedAt,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Step 11: Handle errors
    console.error("Error marking ticket as sold:", error);

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

// Only allow PATCH requests
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to mark ticket as sold." },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to mark ticket as sold." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to mark ticket as sold." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use PATCH to mark ticket as sold." },
    { status: 405 }
  );
}