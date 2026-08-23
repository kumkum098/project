/**
 * Ticket interface representing a ticket listing in the resale marketplace.
 * Contains all necessary information about a ticket including event details,
 * pricing, seller information, and engagement metrics.
 */
export interface Ticket {
  /** MongoDB document identifier for the ticket */
  _id?: string;

  /** Unique identifier for the ticket */
  id: string;

  /** Title of the ticket listing */
  title: string;

  /** Detailed description of the ticket */
  description: string;

  /** Name of the event */
  eventName: string;

  /** Date of the event */
  eventDate: string;

  /** Venue where the event takes place */
  eventVenue: string;

  /** Current selling price of the ticket */
  price: number;

  /** Original price of the ticket */
  originalPrice: number;

  /** Category of the event */
  category: "MUSIC" | "SPORTS" | "THEATRE" | "COMEDY" | "OTHER";

  /** Current status of the ticket listing */
  status: "AVAILABLE" | "SOLD" | "PENDING" | "CANCELLED";

  /** URL of the ticket image */
  imageUrl: string;

  /** Name of the seller */
  sellerName: string;

  /** Trust score of the seller */
  sellerTrustScore: number;

  /** Whether the seller is verified */
  isVerified: boolean;

  /** Number of views the ticket has received */
  views: number;

  /** Number of times the ticket has been saved */
  savedCount: number;

  /** Timestamp when the ticket was created */
  createdAt: string;
}