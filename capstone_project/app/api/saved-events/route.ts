import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SavedEvent from "@/models/SavedEvent";
import Ticket from "@/models/Ticket";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/saved-events
 * Fetches all saved events (wishlist) for the logged-in user with full ticket details
 * 
 * Response:
 * - 200: Array of saved events with populated ticket details
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Fetch saved events with ticket details populated
    const savedEvents = await SavedEvent.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Populate ticket details for each saved event
    const savedEventsWithTickets = await Promise.all(
      savedEvents.map(async (savedEvent) => {
        const ticket = await Ticket.findById(savedEvent.ticketId).lean();
        
        if (!ticket) {
          return null;
        }

        return {
          id: savedEvent._id.toString(),
          userId: savedEvent.userId,
          ticketId: savedEvent.ticketId,
          createdAt: savedEvent.createdAt,
          ticket: {
            _id: ticket._id.toString(),
            id: ticket._id.toString(),
            title: ticket.title,
            eventName: ticket.eventName,
            eventDate: ticket.eventDate,
            eventVenue: ticket.eventVenue,
            city: ticket.city,
            price: ticket.price,
            originalPrice: ticket.originalPrice,
            imageUrl: ticket.imageUrl,
            status: ticket.status,
            isVerified: ticket.isVerified,
            category: ticket.category,
          },
        };
      })
    );

    // Filter out null entries (deleted tickets)
    const validSavedEvents = savedEventsWithTickets.filter(event => event !== null);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Found ${validSavedEvents.length} saved tickets`,
        data: validSavedEvents,
        count: validSavedEvents.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching saved events:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load saved events. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-events
 * Saves an event for the logged-in user
 * 
 * Request Body:
 * - ticketId: string (required)
 * 
 * Response:
 * - 201: Event saved successfully
 * - 400: Validation failed
 * - 401: Not authenticated
 * - 409: Event already saved
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { ticketId } = body;

    // Validate required fields
    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Check if already saved (prevents duplicates)
    const existingSave = await SavedEvent.findOne({
      userId: session.user.id,
      ticketId: ticketId,
    });

    if (existingSave) {
      return NextResponse.json(
        { success: false, message: "Ticket already in wishlist" },
        { status: 409 }
      );
    }

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Create new saved event
    const savedEvent = new SavedEvent({
      userId: session.user.id,
      ticketId: ticketId,
    });

    // Save to database
    await savedEvent.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Ticket added to wishlist",
        data: {
          id: savedEvent._id.toString(),
          userId: savedEvent.userId,
          ticketId: savedEvent.ticketId,
          createdAt: savedEvent.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error saving event:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save event. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}