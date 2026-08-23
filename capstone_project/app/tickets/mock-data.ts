/**
 * Mock data for the Browse Tickets page.
 * This file contains sample ticket listings to demonstrate the UI.
 * In production, this would be replaced with actual database queries.
 */

import { TicketCategory, TicketStatus } from "@/models/Ticket";

/**
 * Extended ticket type for UI display with additional computed fields.
 */
export interface MockTicket {
  _id?: string;
  id: string;
  eventName: string;
  eventVenue: string;
  eventDate: Date;
  category: TicketCategory;
  imageUrl: string;
  originalPrice: number;
  sellingPrice: number;
  isVerified: boolean;
  sellerTrustScore: number;
  sellerName: string;
  status: TicketStatus;
  createdAt: Date;
}

/**
 * Generate mock ticket data for demonstration purposes.
 */
export const mockTickets: MockTicket[] = [
  {
    _id: "507f1f77bcf86cd799439021",
    id: "507f1f77bcf86cd799439021",
    eventName: "Taylor Swift - Eras Tour",
    eventVenue: "SoFi Stadium, Los Angeles",
    eventDate: new Date("2025-03-15T19:00:00"),
    category: TicketCategory.CONCERT,
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
    originalPrice: 450,
    sellingPrice: 520,
    isVerified: true,
    sellerTrustScore: 95,
    sellerName: "MusicFan2024",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-10T10:30:00"),
  },
  {
    _id: "507f1f77bcf86cd799439022",
    id: "507f1f77bcf86cd799439022",
    eventName: "Lakers vs Warriors - NBA Playoffs",
    eventVenue: "Crypto.com Arena, Los Angeles",
    eventDate: new Date("2025-04-20T20:00:00"),
    category: TicketCategory.SPORTS,
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    originalPrice: 280,
    sellingPrice: 350,
    isVerified: true,
    sellerTrustScore: 88,
    sellerName: "SportsTickets",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-12T14:20:00"),
  },
  {
    _id: "507f1f77bcf86cd799439023",
    id: "507f1f77bcf86cd799439023",
    eventName: "Hamilton - Broadway Musical",
    eventVenue: "Richard Rodgers Theatre, New York",
    eventDate: new Date("2025-05-05T14:00:00"),
    category: TicketCategory.THEATRE,
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80",
    originalPrice: 300,
    sellingPrice: 275,
    isVerified: false,
    sellerTrustScore: 72,
    sellerName: "TheatreLover",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-08T09:15:00"),
  },
  {
    _id: "507f1f77bcf86cd799439024",
    id: "507f1f77bcf86cd799439024",
    eventName: "Coachella Valley Music Festival",
    eventVenue: "Empire Polo Club, Indio",
    eventDate: new Date("2025-04-11T12:00:00"),
    category: TicketCategory.FESTIVAL,
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    originalPrice: 500,
    sellingPrice: 650,
    isVerified: true,
    sellerTrustScore: 92,
    sellerName: "FestivalGoer",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-05T16:45:00"),
  },
  {
    _id: "507f1f77bcf86cd799439025",
    id: "507f1f77bcf86cd799439025",
    eventName: "Dave Chappelle - Stand Up Comedy",
    eventVenue: "Hollywood Bowl, Los Angeles",
    eventDate: new Date("2025-03-28T20:00:00"),
    category: TicketCategory.COMEDY,
    imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80",
    originalPrice: 150,
    sellingPrice: 180,
    isVerified: true,
    sellerTrustScore: 98,
    sellerName: "ComedyCentral",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-14T11:00:00"),
  },
  {
    _id: "507f1f77bcf86cd799439026",
    id: "507f1f77bcf86cd799439026",
    eventName: "TechCrunch Disrupt 2025",
    eventVenue: "Moscone Center, San Francisco",
    eventDate: new Date("2025-10-06T09:00:00"),
    category: TicketCategory.CONFERENCE,
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    originalPrice: 2000,
    sellingPrice: 1800,
    isVerified: true,
    sellerTrustScore: 85,
    sellerName: "TechEvents",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-02T08:30:00"),
  },
  {
    _id: "507f1f77bcf86cd799439027",
    id: "507f1f77bcf86cd799439027",
    eventName: "Beyoncé - Renaissance World Tour",
    eventVenue: "MetLife Stadium, New Jersey",
    eventDate: new Date("2025-05-29T19:30:00"),
    category: TicketCategory.CONCERT,
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    originalPrice: 400,
    sellingPrice: 480,
    isVerified: true,
    sellerTrustScore: 91,
    sellerName: "QueenBeyFan",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-11T13:20:00"),
  },
  {
    _id: "507f1f77bcf86cd799439028",
    id: "507f1f77bcf86cd799439028",
    eventName: "World Cup Qualifier - USA vs Mexico",
    eventVenue: "Rose Bowl, Pasadena",
    eventDate: new Date("2025-03-23T16:00:00"),
    category: TicketCategory.SPORTS,
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    originalPrice: 200,
    sellingPrice: 250,
    isVerified: false,
    sellerTrustScore: 68,
    sellerName: "SoccerFanatic",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-09T15:10:00"),
  },
  {
    _id: "507f1f77bcf86cd799439029",
    id: "507f1f77bcf86cd799439029",
    eventName: "The Lion King - Musical",
    eventVenue: "Minskoff Theatre, New York",
    eventDate: new Date("2025-06-15T14:30:00"),
    category: TicketCategory.THEATRE,
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80",
    originalPrice: 250,
    sellingPrice: 220,
    isVerified: true,
    sellerTrustScore: 87,
    sellerName: "BroadwayTickets",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-13T10:45:00"),
  },
  {
    _id: "507f1f77bcf86cd79943902a",
    id: "507f1f77bcf86cd79943902a",
    eventName: "Lollapalooza 2025",
    eventVenue: "Grant Park, Chicago",
    eventDate: new Date("2025-07-31T12:00:00"),
    category: TicketCategory.FESTIVAL,
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    originalPrice: 450,
    sellingPrice: 550,
    isVerified: true,
    sellerTrustScore: 94,
    sellerName: "FestivalVibes",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-07T12:00:00"),
  },
  {
    _id: "507f1f77bcf86cd79943902b",
    id: "507f1f77bcf86cd79943902b",
    eventName: "Kevin Hart - Comedy Tour",
    eventVenue: "Madison Square Garden, New York",
    eventDate: new Date("2025-04-12T19:00:00"),
    category: TicketCategory.COMEDY,
    imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80",
    originalPrice: 175,
    sellingPrice: 200,
    isVerified: true,
    sellerTrustScore: 90,
    sellerName: "LaughFactory",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-06T14:30:00"),
  },
  {
    _id: "507f1f77bcf86cd79943902c",
    id: "507f1f77bcf86cd79943902c",
    eventName: "AI Summit 2025",
    eventVenue: "Moscone Center, San Francisco",
    eventDate: new Date("2025-11-15T09:00:00"),
    category: TicketCategory.CONFERENCE,
    imageUrl: "https://images.unsplash.com/photo-1485182708500-e8f1f318ba72?w=800&q=80",
    originalPrice: 1500,
    sellingPrice: 1400,
    isVerified: true,
    sellerTrustScore: 96,
    sellerName: "AIConference",
    status: TicketStatus.ACTIVE,
    createdAt: new Date("2025-01-04T07:20:00"),
  },
];

/**
 * Helper function to calculate the fair price percentage.
 * Returns a value between 0 and 100 indicating how fair the price is.
 * 100 = original price (best deal), 0 = 2x original price (worst deal)
 */
export function calculateFairPricePercentage(originalPrice: number, sellingPrice: number): number {
  if (originalPrice === 0) return 100;
  
  const ratio = sellingPrice / originalPrice;
  
  // If selling price is less than or equal to original, it's a great deal (100%)
  // If selling price is 2x or more, it's a poor deal (0%)
  // Linear interpolation between these points
  if (ratio <= 1) return 100;
  if (ratio >= 2) return 0;
  
  return Math.round(100 - ((ratio - 1) * 100));
}

/**
 * Get color class based on fair price percentage.
 */
export function getFairPriceColor(percentage: number): string {
  if (percentage >= 80) return "text-semantic-success";
  if (percentage >= 50) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Get label based on fair price percentage.
 */
export function getFairPriceLabel(percentage: number): string {
  if (percentage >= 80) return "Great Deal";
  if (percentage >= 50) return "Fair Price";
  if (percentage >= 30) return "Above Average";
  return "Overpriced";
}