import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Ticket, { TicketStatus } from "@/models/Ticket";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/verifications
 * 
 * Fetches tickets for admin verification with filtering and sorting.
 * Only accessible by ADMIN users.
 * 
 * Query Parameters:
 * - filter: pending | verified | rejected | all
 * - sort: newest | oldest | highestTrust | lowestTrust
 * - search: search query for title, event name, or seller name
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

    // Step 2: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "pending";
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search") || "";

    // Step 3: Connect to database
    await connectDB();

    // Step 4: Build query based on filter
    let query: any = {};

    if (filter === "pending") {
      query = {
        isVerified: false,
        status: TicketStatus.ACTIVE,
      };
    } else if (filter === "verified") {
      query = {
        isVerified: true,
      };
    } else if (filter === "rejected") {
      query = {
        isVerified: false,
        status: TicketStatus.REMOVED,
      };
    }
    // "all" shows everything

    // Step 5: Build search query if provided
    if (search) {
      // We need to join with User collection for seller name search
      // For simplicity, we'll fetch all tickets and filter client-side
      // In production, you might use aggregation or text search
      query = {}; // Reset query to fetch all and filter later
    }

    // Step 6: Fetch tickets with seller information
    const tickets = await Ticket.find(query)
      .populate("sellerId", "name email trustScore")
      .sort({ createdAt: -1 })
      .lean();

    // Step 7: Transform data for frontend
    const transformedTickets = tickets.map((ticket: any) => ({
      id: ticket._id.toString(),
      title: ticket.title,
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
        _id: ticket.sellerId._id.toString(),
        name: ticket.sellerId.name,
        email: ticket.sellerId.email,
        trustScore: ticket.sellerId.trustScore,
      },
    }));

    // Step 8: Apply client-side search if provided
    let filteredTickets = transformedTickets;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTickets = transformedTickets.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.eventName.toLowerCase().includes(searchLower) ||
          ticket.sellerId.name.toLowerCase().includes(searchLower)
      );
    }

    // Step 9: Apply sorting
    if (sort === "oldest") {
      filteredTickets.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sort === "highestTrust") {
      filteredTickets.sort((a, b) => b.sellerId.trustScore - a.sellerId.trustScore);
    } else if (sort === "lowestTrust") {
      filteredTickets.sort((a, b) => a.sellerId.trustScore - b.sellerId.trustScore);
    }
    // "newest" is already sorted by default

    // Step 10: Return success response
    return NextResponse.json({
      success: true,
      data: filteredTickets,
      count: filteredTickets.length,
    });

  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch verifications",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}