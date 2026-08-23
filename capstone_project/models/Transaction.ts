import mongoose, { Model, Schema } from "mongoose";

// Payment method options for ticket purchases
export enum PaymentMethod {
  CARD = "CARD",           // Credit or Debit card
  UPI = "UPI",             // UPI payment
  NET_BANKING = "NET_BANKING", // Net banking transfer
}

// Payment status tracks the payment processing state
export enum PaymentStatus {
  PENDING = "PENDING",     // Payment initiated but not completed
  PAID = "PAID",           // Payment successfully processed
  FAILED = "FAILED",       // Payment failed
  REFUNDED = "REFUNDED",   // Payment refunded to buyer
}

// Transaction status tracks the overall transaction lifecycle
export enum TransactionStatus {
  PENDING = "PENDING",              // Transaction created, awaiting payment
  IN_ESCROW = "IN_ESCROW",          // Payment received, held in escrow
  TICKET_TRANSFERRED = "TICKET_TRANSFERRED", // Seller has transferred ticket
  BUYER_CONFIRMED = "BUYER_CONFIRMED",       // Buyer confirmed receipt
  COMPLETED = "COMPLETED",          // Transaction fully completed
  DISPUTED = "DISPUTED",            // Dispute raised by buyer or seller
  CANCELLED = "CANCELLED",          // Transaction cancelled
}

export enum TransferMethod {
  TICKET_URL = "TICKET_URL",
  TICKET_CODE = "TICKET_CODE",
  PDF_UPLOAD = "PDF_UPLOAD",
}

export enum EscrowStatus {
  PENDING = "PENDING",
  WAITING_FOR_BUYER_CONFIRMATION = "WAITING_FOR_BUYER_CONFIRMATION",
  READY_FOR_RELEASE = "READY_FOR_RELEASE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// TypeScript interface for a Transaction document
export interface ITransaction {
  buyerId: mongoose.Types.ObjectId;   // ID of the buyer (User reference)
  sellerId: mongoose.Types.ObjectId;  // ID of the seller (User reference)
  ticketId: mongoose.Types.ObjectId;  // ID of the ticket being purchased (Ticket reference)
  amount: number;                     // Base ticket price (selling price)
  platformFee: number;                // Platform fee (default: 0, usually 5%)
  tax: number;                        // Tax amount (default: 0, usually 2%)
  totalAmount: number;                // Total amount paid (amount + platformFee + tax)
  paymentMethod: PaymentMethod;       // Payment method used (CARD, UPI, NET_BANKING)
  paymentStatus: PaymentStatus;       // Current payment status
  transactionStatus: TransactionStatus; // Current transaction status
  buyerConfirmed: boolean;            // Has buyer confirmed ticket receipt?
  sellerTransferred: boolean;         // Has seller transferred the ticket?
  transferMethod?: TransferMethod;    // Method seller used to transfer the ticket
  transferValue?: string;             // Value or details for the transfer method
  transferredAt?: Date;               // Timestamp when the ticket transfer was performed
  escrowStatus?: EscrowStatus;        // Escrow workflow state for this transaction
  buyerConfirmedAt?: Date;            // Timestamp when buyer confirmed receipt
  completedAt?: Date;                 // Timestamp when transaction was completed
  releasedAt?: Date;                  // Timestamp when escrow funds were released
  releaseDate?: Date;                 // Release date recorded for escrow settlement
  releasedAmount?: number;            // Amount released from escrow
  soldAt?: Date;                      // Timestamp when ticket was marked sold
  disputeRaised: boolean;             // Has a dispute been raised?
  disputeReason?: string;             // Dispute reason provided by buyer
  disputeCreatedAt?: Date;            // Timestamp when dispute was created
  razorpayOrderId?: string;           // Razorpay order ID
  razorpayPaymentId?: string;         // Razorpay payment ID
  razorpaySignature?: string;         // Razorpay payment signature
  paidAt?: Date;                      // Timestamp when payment was completed
  createdAt?: Date;                   // Timestamp when transaction was created
  updatedAt?: Date;                   // Timestamp when transaction was last updated
}

// Transaction schema manages the complete purchase lifecycle
const transactionSchema = new Schema<ITransaction>(
  {
    // Buyer information - who is purchasing the ticket
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",           // Reference to User model
      required: [true, "Buyer ID is required"],
      index: true,           // Index for faster queries
    },

    // Seller information - who is selling the ticket
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",           // Reference to User model
      required: [true, "Seller ID is required"],
      index: true,           // Index for faster queries
    },

    // Ticket information - which ticket is being purchased
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",         // Reference to Ticket model
      required: [true, "Ticket ID is required"],
      index: true,           // Index for faster queries
    },

    // Pricing information
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // Platform fee (e.g., 5% of ticket price)
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },

    // Tax amount (e.g., 2% of ticket price)
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },

    // Total amount paid by buyer (amount + platformFee + tax)
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // Payment method used for this transaction
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.UPI,
      required: true,
    },

    // Payment status - tracks if payment was successful
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },

    // Transaction status - tracks overall transaction progress
    transactionStatus: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },

    // Has the buyer confirmed they received the ticket?
    buyerConfirmed: {
      type: Boolean,
      default: false,
    },

    // Has the seller transferred the ticket to buyer?
    sellerTransferred: {
      type: Boolean,
      default: false,
    },

    // Ticket transfer details provided by the seller
    transferMethod: {
      type: String,
      enum: Object.values(TransferMethod),
    },
    transferValue: {
      type: String,
    },
    transferredAt: {
      type: Date,
    },

    // Escrow workflow state for this transaction
    escrowStatus: {
      type: String,
      enum: Object.values(EscrowStatus),
      default: EscrowStatus.PENDING,
      index: true,
    },

    buyerConfirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    releasedAt: {
      type: Date,
    },
    releaseDate: {
      type: Date,
    },
    releasedAmount: {
      type: Number,
      min: [0, "Released amount cannot be negative"],
    },
    soldAt: {
      type: Date,
    },

    // Has a dispute been raised for this transaction?
    disputeRaised: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
    },
    disputeCreatedAt: {
      type: Date,
    },

    // Razorpay payment details
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Create indexes for common queries
// This helps speed up database queries
transactionSchema.index({ buyerId: 1, createdAt: -1 }); // Buyer's purchase history
transactionSchema.index({ sellerId: 1, createdAt: -1 }); // Seller's sales history
transactionSchema.index({ ticketId: 1 }); // Find transaction by ticket
transactionSchema.index({ transactionStatus: 1 }); // Filter by status
transactionSchema.index({ escrowStatus: 1 }); // Filter by escrow state
transactionSchema.index({ paymentStatus: 1 }); // Filter by payment status

// Reuse the existing model instance during hot reloads to prevent overwrite errors
// This is important in Next.js development mode
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;