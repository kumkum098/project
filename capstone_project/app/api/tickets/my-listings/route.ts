import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/tickets/my-listings
 * Fetches ticket listings for the authenticated user with search, filters, and pagination
 * 
 * Query Parameters:
 * - search: string (optional) - Search in eventName and title
 * - status: string (optional) - Filter by status (ACTIVE, SOLD, PENDING, REMOVED)
 * - page: number (optional) - Page number (default: 1)
 * - limit: number (optional) - Items per page (default: 10, max: 50)
 * - sortBy: string (optional) - Sort field (createdAt, eventDate, price)
 * - sortOrder: string (optional) - Sort order (asc, desc)
 * 
 * Response:
 * - 200: Successfully retrieved listings
 * - 401: Unauthorized (not authenticated)
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please log in to view your listings",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 3: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50 per page
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Step 4: Build query filter
    const query: any = { sellerId: userId };

    // Add search filter
    if (search.trim()) {
      query.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status && ["ACTIVE", "SOLD", "PENDING", "REMOVED"].includes(status)) {
      query.status = status;
    }

    // Step 5: Calculate pagination
    const skip = (page - 1) * limit;

    // Step 6: Build sort object
    const sort: any = {};
    const validSortFields = ["createdAt", "eventDate", "price", "eventName"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sort[sortField] = sortOrder === "asc" ? 1 : -1;

    // Step 7: Fetch tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    // Step 8: Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Step 9: Format the response
    const formattedTickets = tickets.map((ticket: any) => ({
      id: ticket._id.toString(),
      title: ticket.title,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      eventVenue: ticket.eventVenue,
      city: ticket.city,
      category: ticket.category,
      originalPrice: ticket.originalPrice,
      sellingPrice: ticket.price,
      imageUrl: ticket.imageUrl,
      status: ticket.status,
      isVerified: ticket.isVerified,
      views: ticket.views || 0,
      savedCount: ticket.savedCount || 0,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));

    // Step 10: Return success response with pagination
    return NextResponse.json(
      {
        success: true,
        message: "Listings retrieved successfully",
        data: formattedTickets,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Step 11: Handle errors
    console.error("Error fetching listings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your listings",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve listings." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve listings." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve listings." },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to retrieve listings." },
    { status: 405 }
  );
}