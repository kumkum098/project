import mongoose from "mongoose";
import Ticket, { TicketCategory, TicketStatus } from "@/models/Ticket";

type SeedTicketInput = {
  _id?: string | mongoose.Types.ObjectId;
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
  city: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
};

const seedTicketData: SeedTicketInput[] = [
  {
    _id: "507f1f77bcf86cd799439011",
    title: "MongoDB Seeded Ticket",
    description: "Seeded from the app to verify the ticket details flow.",
    eventName: "Seeded Ticket Event",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    eventVenue: "MongoDB Atlas",
    price: 120,
    originalPrice: 150,
    category: TicketCategory.CONCERT,
    status: TicketStatus.ACTIVE,
    sellerId: new mongoose.Types.ObjectId(),
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    isVerified: true,
    city: "Indore",
    location: {
      type: "Point",
      coordinates: [75.8577, 22.7196],
    },
  },
  {
    _id: "507f1f77bcf86cd799439012",
    title: "Live Concert Experience",
    description: "A second seeded ticket to validate the browse listing flow.",
    eventName: "Live Concert Experience",
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    eventVenue: "Holkar Stadium",
    price: 220,
    originalPrice: 300,
    category: TicketCategory.CONCERT,
    status: TicketStatus.ACTIVE,
    sellerId: new mongoose.Types.ObjectId(),
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800",
    isVerified: true,
    city: "Indore",
    location: {
      type: "Point",
      coordinates: [75.8605, 22.7212],
    },
  },
  {
    _id: "507f1f77bcf86cd799439013",
    title: "Sports Night Premium",
    description: "A seeded sports listing so the marketplace shows real data immediately.",
    eventName: "Sports Night Premium",
    eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    eventVenue: "Maharaja Yeshwantrao Stadium",
    price: 180,
    originalPrice: 240,
    category: TicketCategory.SPORTS,
    status: TicketStatus.ACTIVE,
    sellerId: new mongoose.Types.ObjectId(),
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    isVerified: true,
    city: "Indore",
    location: {
      type: "Point",
      coordinates: [75.8548, 22.7198],
    },
  },
];

export async function ensureSeedTickets(requestedId?: string) {
  if (requestedId) {
    const existingRequestedTicket = await Ticket.findById(requestedId).lean();
    if (existingRequestedTicket) {
      return [];
    }
  }

  const existingCount = await Ticket.countDocuments();
  if (existingCount > 0) {
    return [];
  }

  const ticketsToInsert = seedTicketData.map((ticket) => ({
    ...ticket,
    _id: typeof ticket._id === "string" ? new mongoose.Types.ObjectId(ticket._id) : ticket._id,
  }));

  await Ticket.insertMany(ticketsToInsert, { ordered: false });
  return ticketsToInsert;
}
