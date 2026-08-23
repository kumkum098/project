import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Ticket, { TicketStatus } from "@/models/Ticket";

/**
 * GET /api/events/nearby
 * Finds tickets near a given latitude and longitude
 * 
 * Query Parameters:
 * - latitude: number (required) - User's latitude
 * - longitude: number (required) - User's longitude
 * - radius: number (optional) - Search radius in kilometers, default 25km
 * 
 * Response:
 * - 200: Array of nearby tickets with distance
 * - 400: Missing or invalid parameters
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Get query parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const latitude = parseFloat(searchParams.get("latitude") || "");
    const longitude = parseFloat(searchParams.get("longitude") || "");
    const radius = parseFloat(searchParams.get("radius") || "25"); // Default 25km

    // Step 3: Validate required parameters
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid coordinates. Please provide valid latitude and longitude.",
        },
        { status: 400 }
      );
    }

    // Validate radius is positive
    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid radius. Please provide a positive number.",
        },
        { status: 400 }
      );
    }

    // Step 4: Convert radius from kilometers to meters (MongoDB uses meters)
    const radiusInMeters = radius * 1000;

    // Step 5: Build geospatial query
    // MongoDB geospatial query to find tickets within radius
    const nearbyTickets = await Ticket.find({
      status: TicketStatus.ACTIVE, // Only show active tickets
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // MongoDB uses [lon, lat] order
          },
          $maxDistance: radiusInMeters,
        },
      },
    })
      .limit(50) // Limit to 50 results for performance
      .lean(); // Use lean() for better performance (returns plain objects)

    // Step 6: Calculate distance for each ticket and format response
    const ticketsWithDistance = nearbyTickets.map((ticket: any) => {
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        latitude,
        longitude,
        ticket.location.coordinates[1], // latitude
        ticket.location.coordinates[0]  // longitude
      );

      return {
        id: ticket._id.toString(),
        title: ticket.title,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventVenue: ticket.eventVenue,
        city: ticket.city,
        price: ticket.price,
        originalPrice: ticket.originalPrice,
        imageUrl: ticket.imageUrl,
        isVerified: ticket.isVerified,
        category: ticket.category,
        distance: distance, // Distance in kilometers
      };
    });

    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Found ${ticketsWithDistance.length} nearby events`,
        data: ticketsWithDistance,
      },
      { status: 200 }
    );

  } catch (error) {
    // Step 8: Handle errors
    console.error("Error fetching nearby events:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load nearby events. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { message: "Method not allowed. Use GET to search nearby events." },
    { status: 405 }
  );
}