import mongoose, { Model, Schema } from "mongoose";

/**
 * TypeScript shape for a Conversation document stored in MongoDB.
 * Represents a chat conversation between a buyer and seller about a specific ticket.
 */
export interface IConversation {
  participants: mongoose.Types.ObjectId[]; // [buyerId, sellerId]
  ticketId: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for conversations.
 * Stores chat conversations between buyers and sellers.
 * Ensures one conversation per ticket per user pair.
 */
const conversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Participants are required"],
    }],
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
      index: true,
    },
    lastMessage: {
      type: String,
      maxlength: [1000, "Last message cannot exceed 1000 characters"],
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
  },
  {
    // Automatically creates createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create compound indexes for efficient querying
// Ensures only one conversation per ticket between the same two users
conversationSchema.index({ participants: 1, ticketId: 1 }, { unique: true });
// For fetching user's conversations sorted by recent activity
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
// For ticket-based queries
conversationSchema.index({ ticketId: 1 });

// Reuse an existing model during Next.js hot reloads to prevent overwrite errors
const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;