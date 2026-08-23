import mongoose, { Model, Schema } from "mongoose";

/**
 * Verification actions that can be performed by admins
 */
export enum VerificationAction {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REQUEST_INFO = "REQUEST_INFO",
}

/**
 * Rejection reasons for ticket verification
 */
export enum RejectionReason {
  FAKE_TICKET = "FAKE_TICKET",
  IMAGE_NOT_CLEAR = "IMAGE_NOT_CLEAR",
  WRONG_EVENT = "WRONG_EVENT",
  SUSPICIOUS_LISTING = "SUSPICIOUS_LISTING",
  DUPLICATE_TICKET = "DUPLICATE_TICKET",
  OTHER = "OTHER",
}

/**
 * TypeScript shape for a VerificationHistory document stored in MongoDB.
 * Tracks all verification actions performed by admins on tickets.
 */
export interface IVerificationHistory {
  ticketId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: VerificationAction;
  reason?: RejectionReason;
  adminMessage?: string;
  createdAt: Date;
}

/**
 * Mongoose schema for verification history tracking.
 * Stores audit trail of all admin verification actions.
 */
const verificationHistorySchema = new Schema<IVerificationHistory>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin ID is required"],
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(VerificationAction),
      required: [true, "Action is required"],
    },
    reason: {
      type: String,
      enum: Object.values(RejectionReason),
    },
    adminMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Admin message cannot exceed 500 characters"],
    },
  },
  {
    // Automatically creates createdAt timestamp
    timestamps: true,
  }
);

// Create compound index for efficient querying by ticket and action
verificationHistorySchema.index({ ticketId: 1, createdAt: -1 });
verificationHistorySchema.index({ adminId: 1, createdAt: -1 });

// Reuse an existing model during Next.js hot reloads to prevent overwrite errors.
const VerificationHistory: Model<IVerificationHistory> =
  mongoose.models.VerificationHistory ||
  mongoose.model<IVerificationHistory>("VerificationHistory", verificationHistorySchema);

export default VerificationHistory;