import mongoose, { Model, Schema } from "mongoose";

/**
 * Notification types supported by the marketplace
 */
export enum NotificationType {
  SYSTEM = "SYSTEM",
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  PAYMENT = "PAYMENT",
  ESCROW = "ESCROW",
  REVIEW = "REVIEW",
  VERIFICATION = "VERIFICATION",
  DISPUTE = "DISPUTE",
  INFO = "INFO",
}

/**
 * TypeScript shape for a Notification document stored in MongoDB.
 * Tracks all notifications sent to users across the marketplace.
 */
export interface INotification {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for notifications.
 * Stores all user notifications with type, read status, and metadata.
 */
const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, "Notification type is required"],
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    // Automatically creates createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create compound indexes for efficient querying
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Reuse an existing model during Next.js hot reloads to prevent overwrite errors
const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;