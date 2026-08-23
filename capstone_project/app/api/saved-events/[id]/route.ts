import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SavedEvent from "@/models/SavedEvent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * DELETE /api/saved-events/[id]
 * Deletes a saved event for the logged-in user
 * 
 * Response:
 * - 200: Event deleted successfully
 * - 401: Not authenticated
 * - 404: Saved event not found
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: savedEventId } = await params;

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

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(savedEventId)) {
      return NextResponse.json(
        { success: false, message: "Invalid saved event ID" },
        { status: 400 }
      );
    }

    // Find and delete the saved event
    const deletedEvent = await SavedEvent.findOneAndDelete({
      _id: savedEventId,
      userId: session.user.id, // Ensure user can only delete their own saves
    });

    if (!deletedEvent) {
      return NextResponse.json(
        { success: false, message: "Saved event not found" },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Event removed from saved events",
        data: deletedEvent,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting saved event:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete saved event. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}