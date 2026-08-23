import mongoose, { Model, Schema } from "mongoose";

// TypeScript interface for a SavedEvent document
export interface ISavedEvent {
  userId: mongoose.Types.ObjectId;  // Reference to User who saved the event
  ticketId: mongoose.Types.ObjectId; // Reference to Ticket that was saved
  createdAt?: Date;                  // Timestamp when event was saved
}

// SavedEvent schema for tracking user saved events
const savedEventSchema = new Schema<ISavedEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
      index: true,
    },
  },
  {
    // Automatically add createdAt timestamp
    timestamps: true,
  }
);

// Create compound index to prevent duplicate saves
savedEventSchema.index({ userId: 1, ticketId: 1 }, { unique: true });

// Reuse the existing model instance during hot reloads to prevent overwrite errors
const SavedEvent: Model<ISavedEvent> =
  mongoose.models.SavedEvent || mongoose.model<ISavedEvent>("SavedEvent", savedEventSchema);

export default SavedEvent;