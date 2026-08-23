import mongoose, { Model, Schema } from "mongoose";

// TypeScript interface for a Review document
export interface IReview {
  transactionId: mongoose.Types.ObjectId; // Reference to Transaction
  buyerId: mongoose.Types.ObjectId;       // Reference to User (buyer)
  sellerId: mongoose.Types.ObjectId;      // Reference to User (seller)
  ticketId: mongoose.Types.ObjectId;      // Reference to Ticket
  rating: number;                         // Rating from 1 to 5
  comment: string;                        // Review comment (min 10 characters)
  createdAt?: Date;                       // Timestamp when review was created
  updatedAt?: Date;                       // Timestamp when review was last updated
}

// Review schema for storing buyer reviews of sellers
const reviewSchema = new Schema<IReview>(
  {
    // Transaction reference - ensures one review per transaction
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction ID is required"],
      unique: true, // One review per transaction
      index: true,
    },

    // Buyer reference - who wrote the review
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer ID is required"],
      index: true,
    },

    // Seller reference - who is being reviewed
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },

    // Ticket reference - which ticket was purchased
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
      index: true,
    },

    // Rating from 1 to 5 stars
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    // Review comment
    comment: {
      type: String,
      required: [true, "Comment is required"],
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Create indexes for common queries
// This helps speed up database queries
reviewSchema.index({ sellerId: 1, createdAt: -1 }); // Seller's reviews sorted by date
reviewSchema.index({ buyerId: 1, createdAt: -1 });  // Buyer's review history
reviewSchema.index({ transactionId: 1 });            // Find review by transaction
reviewSchema.index({ sellerId: 1, rating: -1 });    // Seller rating statistics

// Reuse the existing model instance during hot reloads to prevent overwrite errors
// This is important in Next.js development mode
const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

export default Review;