import mongoose, { Model, Schema } from "mongoose";

// Ticket lifecycle states used by the marketplace.
export enum TicketStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  PENDING = "PENDING",
  REMOVED = "REMOVED",
}

// Broad ticket categories for filtering and UI grouping.
export enum TicketCategory {
  CONCERT = "CONCERT",
  SPORTS = "SPORTS",
  THEATRE = "THEATRE",
  FESTIVAL = "FESTIVAL",
  COMEDY = "COMEDY",
  CONFERENCE = "CONFERENCE",
}

// TypeScript shape for a ticket document stored in MongoDB.
export interface ITicket {
  title: string;
  description: string;
  eventName: string;
  eventDate: Date;
  eventVenue: string;
  price: number;
  originalPrice: number;
  category: TicketCategory;
  status: TicketStatus;
  sellerId: mongoose.Types.ObjectId;
  imageUrl: string;
  isVerified: boolean;
  views?: number;
  savedCount?: number;
  soldAt?: Date;
  // Location fields for geospatial queries
  location?: {
    type: string;
    coordinates: [number, number];
  };
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ticket schema stores the full resale listing data shown across the app.
const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      index: true,
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },
    eventVenue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0, "Original price cannot be negative"],
    },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.ACTIVE,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
    min: [0, "Views cannot be negative"],
  },
  savedCount: {
    type: Number,
    default: 0,
    min: [0, "Saved count cannot be negative"],
  },
  soldAt: {
    type: Date,
  },
  // Location fields for geospatial queries
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
    index: true,
  },
},
{
  // Automatically add createdAt and updatedAt timestamps for each listing.
  timestamps: true,
}
);

// Create geospatial index for location-based queries
ticketSchema.index({ location: "2dsphere" });

// Reuse the existing model instance during hot reloads to prevent overwrite errors.
const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", ticketSchema);

export default Ticket;
