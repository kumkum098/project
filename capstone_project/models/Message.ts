import mongoose, { Model, Schema } from "mongoose";

/**
 * TypeScript shape for a Message document stored in MongoDB.
 * Represents individual messages within either a transaction or a conversation.
 */
export interface IMessage {
  transactionId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  attachments?: string[]; // URLs to attached files
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for messages.
 * Stores individual chat messages between participants in either a transaction or a conversation.
 */
const messageSchema = new Schema<IMessage>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
      sparse: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
      sparse: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    attachments: [{
      type: String,
      trim: true,
    }],
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    // Automatically creates createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create compound indexes for efficient querying
messageSchema.index({ transactionId: 1, createdAt: 1 }); // For fetching messages in a transaction
messageSchema.index({ conversationId: 1, createdAt: 1 }); // For fetching messages in a conversation
messageSchema.index({ senderId: 1, createdAt: -1 }); // For fetching user's sent messages
messageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 }); // For fetching unread messages

// Reuse an existing model during Next.js hot reloads to prevent overwrite errors
const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", messageSchema);

export default Message;