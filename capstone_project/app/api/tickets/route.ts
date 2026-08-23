import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Ticket, { TicketStatus } from "@/models/Ticket";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureSeedTickets } from "@/lib/seedTickets";
import { z } from "zod";
import { sanitizeString } from "@/lib/sanitize";

/**
 * POST /api/tickets
 * Creates a new ticket listing in MongoDB
 * 
 * Request Body:
 * - title: string (required)
 * - eventName: string (required)
 * - description: string (required)
 * - eventDate: string (required, ISO date format)
 * - eventTime: string (required)
 * - eventVenue: string (required)
 * - city: string (required)
 * - category: string (required, must be valid TicketCategory)
 * - originalPrice: number (required, must be > 0)
 * - sellingPrice: number (required, must be > 0)
 * - numberOfTickets: number (required, must be >= 1)
 * - seatInformation: string (required)
 * - imageUrl: string (required)
 * 
 * Response:
 * - 201: Ticket created successfully
 * - 400: Validation failed
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 2: Connect to MongoDB
    await connectDB();

    // Step 3: Parse and validate request body with Zod
    const body = await request.json();
    
    const TicketSchema = z.object({
      title: z.string().min(1, "Title is required").max(120, "Title cannot exceed 120 characters"),
      eventName: z.string().min(1, "Event name is required").max(200, "Event name too long"),
      description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
      eventDate: z.string().min(1, "Event date is required"),
      eventTime: z.string().min(1, "Event time is required"),
      eventVenue: z.string().min(1, "Event venue is required").max(200, "Venue name too long"),
      city: z.string().min(1, "City is required").max(50, "City name too long"),
      category: z.enum(["MUSIC", "SPORTS", "THEATRE", "COMEDY", "OTHER"], {
        message: "Valid category is required (MUSIC, SPORTS, THEATRE, COMEDY, OTHER)"
      }),
      originalPrice: z.number().positive("Original price must be greater than 0"),
      sellingPrice: z.number().positive("Selling price must be greater than 0"),
      numberOfTickets: z.number().int().min(1, "Number of tickets must be at least 1"),
      seatInformation: z.string().min(1, "Seat information is required").max(500, "Seat information too long"),
      imageUrl: z.string().url("Invalid image URL").min(1, "Image URL is required"),
    });

    const validatedData = TicketSchema.safeParse(body);

    if (!validatedData.success) {
      const errors = validatedData.error.issues.map(err => err.message);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: errors,
        },
        { status: 400 }
      );
    }

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
    } = validatedData.data;

    // Validate event date is not in the past
    const eventDateTime = new Date(eventDate);
    const now = new Date();
    if (eventDateTime < now) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: ["Event date cannot be in the past"],
        },
        { status: 400 }
      );
    }

    // Validate selling price doesn't exceed 130% of original price
    if (sellingPrice > originalPrice * 1.3) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: ["Selling price cannot exceed 130% of original price"],
        },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent XSS
    const sanitizedTitle = sanitizeString(title);
    const sanitizedEventName = sanitizeString(eventName);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedEventVenue = sanitizeString(eventVenue);
    const sanitizedCity = sanitizeString(city);
    const sanitizedImageUrl = sanitizeString(imageUrl);

    // Step 4: Create new ticket document
    // Note: The Ticket model uses 'price' for selling price
    const newTicket = new Ticket({
      title: sanitizedTitle,
      eventName: sanitizedEventName,
      description: sanitizedDescription,
      eventDate: new Date(eventDate),
      eventVenue: sanitizedEventVenue,
      city: sanitizedCity,
      category: category,
      originalPrice: originalPrice,
      price: sellingPrice, // Model uses 'price' for selling price
      imageUrl: sanitizedImageUrl,
      isVerified: false, // New tickets are not verified by default
      status: "ACTIVE", // Default status
      sellerId: session.user.id, // Use authenticated user's ID
    });

    // Step 5: Save ticket to MongoDB
    const savedTicket = await newTicket.save();

    // Step 6: Return success response with 201 status
    return NextResponse.json(
      {
        success: true,
        message: "Ticket created successfully",
        data: {
          id: savedTicket._id.toString(),
          title: savedTicket.title,
          eventName: savedTicket.eventName,
          description: savedTicket.description,
          eventDate: savedTicket.eventDate,
          eventVenue: savedTicket.eventVenue,
          city: city,
          category: savedTicket.category,
          originalPrice: savedTicket.originalPrice,
          sellingPrice: savedTicket.price,
          imageUrl: savedTicket.imageUrl,
          status: savedTicket.status,
          createdAt: savedTicket.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    // Step 7: Handle errors
    console.error("Error creating ticket:", error);

    // Return 500 for internal server errors
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

export async function GET() {
  try {
    await connectDB();
    await ensureSeedTickets();

    const tickets = await Ticket.find({ status: TicketStatus.ACTIVE })
      .populate("sellerId", "name trustScore")
      .sort({ createdAt: -1 })
      .lean();

    const formattedTickets = tickets.map((ticket: any) => {
      const seller = ticket.sellerId || {};

      return {
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
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tickets retrieved successfully",
        data: formattedTickets,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching tickets:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load tickets",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}