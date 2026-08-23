import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { ensureSeedTickets } from "@/lib/seedTickets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    await connectDB();
    await ensureSeedTickets(ticketId);

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID. Expected a valid MongoDB ObjectId.",
        },
        { status: 400 }
      );
    }

    console.log("[ticket-detail] frontend ticket id:", ticketId);

    const ticket = await Ticket.findById(ticketId).populate("sellerId", "name trustScore").lean();

    console.log("[ticket-detail] Ticket.findById result:", ticket ? ticket._id?.toString() : null);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 }
      );
    }

    const seller = (ticket.sellerId as { name?: string; trustScore?: number } | null | undefined) ?? {};

    return NextResponse.json(
      {
        success: true,
        message: "Ticket retrieved successfully",
        data: {
          _id: ticket._id.toString(),
          id: ticket._id.toString(),
          title: ticket.title,
          description: ticket.description,
          eventName: ticket.eventName,
          eventDate: ticket.eventDate,
          eventVenue: ticket.eventVenue,
          city: ticket.city,
          price: ticket.price,
          originalPrice: ticket.originalPrice,
          category: ticket.category,
          status: ticket.status,
          imageUrl: ticket.imageUrl,
          sellerName: seller.name || "Seller",
          sellerTrustScore: seller.trustScore ?? 0,
          isVerified: ticket.isVerified,
          views: ticket.views || 0,
          savedCount: ticket.savedCount || 0,
          createdAt: ticket.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving ticket:", error);

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

/**
 * PUT /api/tickets/[id]
 * Updates an existing ticket listing in MongoDB
 * 
 * URL Parameters:
 * - id: string (required) - The ticket ID to update
 * 
 * Request Body:
 * - title: string (required)
 * - eventName: string (required)
 * - description: string (required)
 * - eventDate: string (required)
 * - eventTime: string (required)
 * - eventVenue: string (required)
 * - city: string (required)
 * - category: string (required)
 * - originalPrice: number (required)
 * - sellingPrice: number (required)
 * - numberOfTickets: number (required)
 * - seatInformation: string (required)
 * - imageUrl: string (required)
 * - userId: string (required) - For authorization
 * 
 * Response:
 * - 200: Ticket updated successfully
 * - 400: Validation failed
 * - 401: Unauthorized (user doesn't own ticket)
 * - 404: Ticket not found
 * - 500: Internal server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get ticket ID from URL parameters
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

    if (!mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID. Expected a valid MongoDB ObjectId.",
        },
        { status: 400 }
      );
    }

    // Step 3: Parse request body
    const body = await request.json();
    const {
      title,
      eventName,
      description,
      eventDate,
      eventTime,
      eventVenue,
      city,
      category,
      originalPrice,
      sellingPrice,
      numberOfTickets,
      seatInformation,
      imageUrl,
      userId,
    } = body;

    // Step 4: Validate required fields
    const errors: string[] = [];

    if (!title || typeof title !== "string" || title.trim() === "") {
      errors.push("Title is required");
    }

    if (!eventName || typeof eventName !== "string" || eventName.trim() === "") {
      errors.push("Event name is required");
    }

    if (!description || typeof description !== "string" || description.trim() === "") {
      errors.push("Description is required");
    }

    if (!eventDate || typeof eventDate !== "string") {
      errors.push("Event date is required");
    } else {
      const eventDateTime = new Date(eventDate);
      const now = new Date();
      if (eventDateTime < now) {
        errors.push("Event date cannot be in the past");
      }
    }

    if (!eventTime || typeof eventTime !== "string") {
      errors.push("Event time is required");
    }

    if (!eventVenue || typeof eventVenue !== "string" || eventVenue.trim() === "") {
      errors.push("Event venue is required");
    }

    if (!city || typeof city !== "string" || city.trim() === "") {
      errors.push("City is required");
    }

    const validCategories = ["MUSIC", "SPORTS", "THEATRE", "COMEDY", "OTHER"];
    if (!category || !validCategories.includes(category)) {
      errors.push("Valid category is required");
    }

    if (originalPrice === undefined || originalPrice === null || originalPrice === "") {
      errors.push("Original price is required");
    } else if (typeof originalPrice !== "number" || originalPrice <= 0) {
      errors.push("Original price must be greater than 0");
    }

    if (sellingPrice === undefined || sellingPrice === null || sellingPrice === "") {
      errors.push("Selling price is required");
    } else if (typeof sellingPrice !== "number" || sellingPrice <= 0) {
      errors.push("Selling price must be greater than 0");
    } else if (originalPrice && sellingPrice > originalPrice * 1.3) {
      errors.push("Selling price cannot exceed 130% of original price");
    }

    if (numberOfTickets === undefined || numberOfTickets === null || numberOfTickets === "") {
      errors.push("Number of tickets is required");
    } else if (typeof numberOfTickets !== "number" || numberOfTickets < 1) {
      errors.push("Number of tickets must be at least 1");
    }

    if (!seatInformation || typeof seatInformation !== "string" || seatInformation.trim() === "") {
      errors.push("Seat information is required");
    }

    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      errors.push("Image URL is required");
    }

    if (!userId) {
      errors.push("User ID is required for authorization");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: errors,
        },
        { status: 400 }
      );
    }

    // Step 5: Find the ticket
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

    // Step 6: Verify the user owns this ticket
    if (ticket.sellerId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: You can only edit your own listings",
        },
        { status: 401 }
      );
    }

    // Step 7: Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        title: title.trim(),
        eventName: eventName.trim(),
        description: description.trim(),
        eventDate: new Date(eventDate),
        eventVenue: eventVenue.trim(),
        category: category,
        originalPrice: originalPrice,
        price: sellingPrice, // Model uses 'price' for selling price
        imageUrl: imageUrl.trim(),
        updatedAt: new Date(),
      },
      { new: true } // Return the updated document
    );

    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Ticket updated successfully",
        data: {
          id: updatedTicket!._id.toString(),
          title: updatedTicket!.title,
          eventName: updatedTicket!.eventName,
          description: updatedTicket!.description,
          eventDate: updatedTicket!.eventDate,
          eventVenue: updatedTicket!.eventVenue,
          category: updatedTicket!.category,
          originalPrice: updatedTicket!.originalPrice,
          sellingPrice: updatedTicket!.price,
          imageUrl: updatedTicket!.imageUrl,
          status: updatedTicket!.status,
          createdAt: updatedTicket!.createdAt,
          updatedAt: updatedTicket!.updatedAt,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating ticket:", error);

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

/**
 * DELETE /api/tickets/[id]
 * Deletes a ticket listing from MongoDB
 * 
 * URL Parameters:
 * - id: string (required) - The ticket ID to delete
 * 
 * Request Body:
 * - userId: string (required) - For authorization
 * 
 * Response:
 * - 200: Ticket deleted successfully
 * - 401: Unauthorized (user not logged in)
 * - 403: Forbidden (user doesn't own ticket)
 * - 404: Ticket not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get ticket ID from URL parameters
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

    if (!mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID. Expected a valid MongoDB ObjectId.",
        },
        { status: 400 }
      );
    }

    // Step 3: Parse request body to get userId
    const body = await request.json();
    const { userId } = body;

    // Step 4: Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User ID is required",
        },
        { status: 401 }
      );
    }

    // Step 5: Find the ticket
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

    // Step 6: Verify the user owns this ticket
    if (ticket.sellerId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You can only delete your own listings",
        },
        { status: 403 }
      );
    }

    // Step 7: Delete the ticket
    await Ticket.findByIdAndDelete(ticketId);

    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Ticket deleted successfully",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting ticket:", error);

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

export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use DELETE to delete a ticket." },
    { status: 405 }
  );
}
