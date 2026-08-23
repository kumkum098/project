/**
 * Database Seeding Script for Nearby Events
 * 
 * This script inserts 20 sample tickets around Indore, India with valid location coordinates.
 * Run this script to populate the database with test data for the nearby events feature.
 * 
 * Usage: npx tsx scripts/seed-nearby-tickets.ts
 */

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";

// Indore city center coordinates
const INDORE_CENTER = {
  latitude: 22.7196,
  longitude: 75.8577,
};

// Sample ticket data generator
const generateSampleTickets = () => {
  const tickets = [
    {
      title: "Coldplay World Tour - Mumbai Concert",
      description: "Experience the magic of Coldplay live in concert at DY Patil Stadium.",
      eventName: "Coldplay World Tour",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      eventTime: "19:00",
      eventVenue: "DY Patil Stadium",
      city: "Indore",
      price: 185,
      originalPrice: 250,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8577, 22.7196], // [longitude, latitude]
      },
    },
    {
      title: "IPL Cricket Match - RCB vs CSK",
      description: "Watch the thrilling IPL match live at Holkar Stadium.",
      eventName: "IPL 2026 - RCB vs CSK",
      eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      eventTime: "15:30",
      eventVenue: "Holkar Stadium",
      city: "Indore",
      price: 320,
      originalPrice: 400,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8600, 22.7210],
      },
    },
    {
      title: "Broadway Premiere Night",
      description: "Enjoy a spectacular Broadway premiere night at the local theater.",
      eventName: "Broadway Premiere Night",
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      eventTime: "20:00",
      eventVenue: "New York Theatre",
      city: "Indore",
      price: 96,
      originalPrice: 150,
      category: "THEATRE",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8550, 22.7180],
      },
    },
    {
      title: "Summer Jazz Festival Tonight",
      description: "Don't miss the Summer Jazz Festival tonight at Riverfront Arena!",
      eventName: "Summer Jazz Festival",
      eventDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      eventTime: "20:00",
      eventVenue: "Riverfront Arena",
      city: "Indore",
      price: 42,
      originalPrice: 60,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8620, 22.7200],
      },
    },
    {
      title: "FC City Derby - Football Match",
      description: "Experience the thrill of the FC City Derby at National Stadium.",
      eventName: "FC City Derby",
      eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      eventTime: "18:30",
      eventVenue: "National Stadium",
      city: "Indore",
      price: 58,
      originalPrice: 80,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8580, 22.7170],
      },
    },
    {
      title: "Comedy Night with Zakir Khan",
      description: "Laugh out loud with Zakir Khan's hilarious comedy show.",
      eventName: "Zakir Khan Live",
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      eventTime: "21:00",
      eventVenue: "Indore Convention Center",
      city: "Indore",
      price: 75,
      originalPrice: 100,
      category: "COMEDY",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8560, 22.7220],
      },
    },
    {
      title: "Rock Concert - Local Bands",
      description: "Discover amazing local rock bands at this exciting concert.",
      eventName: "Rock Night Indore",
      eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      eventTime: "19:30",
      eventVenue: "Rock Arena",
      city: "Indore",
      price: 35,
      originalPrice: 50,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8590, 22.7190],
      },
    },
    {
      title: "Basketball Tournament Finals",
      description: "Watch the exciting basketball tournament finals live!",
      eventName: "State Basketball Finals",
      eventDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      eventTime: "17:00",
      eventVenue: "Sports Complex",
      city: "Indore",
      price: 120,
      originalPrice: 150,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8610, 22.7230],
      },
    },
    {
      title: "Theatre Play - Hamlet",
      description: "Classic Shakespeare's Hamlet performed by renowned theatre group.",
      eventName: "Hamlet - The Play",
      eventDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      eventTime: "19:00",
      eventVenue: "Ravindra Natya Grah",
      city: "Indore",
      price: 55,
      originalPrice: 80,
      category: "THEATRE",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8540, 22.7160],
      },
    },
    {
      title: "Electronic Music Festival",
      description: "Dance the night away at the biggest electronic music festival in Indore!",
      eventName: "EDM Night Indore",
      eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      eventTime: "22:00",
      eventVenue: "Open Air Ground",
      city: "Indore",
      price: 150,
      originalPrice: 200,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8630, 22.7180],
      },
    },
    {
      title: "Tech Conference 2026",
      description: "Learn about the latest technologies at this comprehensive tech conference.",
      eventName: "TechCon 2026",
      eventDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      eventTime: "09:00",
      eventVenue: "Convention Center",
      city: "Indore",
      price: 299,
      originalPrice: 499,
      category: "OTHER",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1540575467068-1d4392e9c62c?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8570, 22.7240],
      },
    },
    {
      title: "Classical Music Evening",
      description: "Enjoy an evening of classical Indian music by renowned artists.",
      eventName: "Classical Night",
      eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      eventTime: "18:30",
      eventVenue: "Cultural Center",
      city: "Indore",
      price: 45,
      originalPrice: 60,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8555, 22.7205],
      },
    },
    {
      title: "Football Match - Local Derby",
      description: "Intense local derby match between city rivals!",
      eventName: "Indore Derby",
      eventDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      eventTime: "16:00",
      eventVenue: "City Football Ground",
      city: "Indore",
      price: 85,
      originalPrice: 100,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8605, 22.7175],
      },
    },
    {
      title: "Stand-up Comedy Show",
      description: "An evening of laughter with India's top comedians.",
      eventName: "Laughter Night",
      eventDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
      eventTime: "20:30",
      eventVenue: "Comedy Club Indore",
      city: "Indore",
      price: 65,
      originalPrice: 90,
      category: "COMEDY",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8585, 22.7215],
      },
    },
    {
      title: "Music Concert - Arijit Singh",
      description: "Live performance by the legendary Arijit Singh!",
      eventName: "Arijit Singh Live",
      eventDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
      eventTime: "19:00",
      eventVenue: "Indore Stadium",
      city: "Indore",
      price: 450,
      originalPrice: 600,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8572, 22.7198],
      },
    },
    {
      title: "Tennis Championship",
      description: "State-level tennis championship finals.",
      eventName: "Tennis Finals 2026",
      eventDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
      eventTime: "14:00",
      eventVenue: "Tennis Academy",
      city: "Indore",
      price: 95,
      originalPrice: 120,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1554068865-24ffdc69d78e?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8595, 22.7225],
      },
    },
    {
      title: "Drama Performance - The Tempest",
      description: "Shakespeare's The Tempest performed by acclaimed theatre group.",
      eventName: "The Tempest",
      eventDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
      eventTime: "19:30",
      eventVenue: "Open Air Theatre",
      city: "Indore",
      price: 40,
      originalPrice: 55,
      category: "THEATRE",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8565, 22.7195],
      },
    },
    {
      title: "Kavita Seth Live Concert",
      description: "Sufi and romantic songs by the melodious Kavita Seth.",
      eventName: "Kavita Seth Live",
      eventDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
      eventTime: "20:00",
      eventVenue: "Music Hall",
      city: "Indore",
      price: 180,
      originalPrice: 220,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8580, 22.7200],
      },
    },
    {
      title: "Cricket Tournament - Under-19",
      description: "Exciting under-19 cricket tournament finals.",
      eventName: "U-19 Cricket Finals",
      eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      eventTime: "10:00",
      eventVenue: "Cricket Ground",
      city: "Indore",
      price: 50,
      originalPrice: 70,
      category: "SPORTS",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8615, 22.7185],
      },
    },
    {
      title: "Improv Comedy Show",
      description: "Unscripted, unplanned, hilarious! Improv comedy at its best.",
      eventName: "Improv Night",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      eventTime: "21:00",
      eventVenue: "The Comedy Store",
      city: "Indore",
      price: 55,
      originalPrice: 75,
      category: "COMEDY",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8575, 22.7210],
      },
    },
    {
      title: "Startup Networking Event",
      description: "Network with entrepreneurs and investors at this startup event.",
      eventName: "Startup Meetup 2026",
      eventDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
      eventTime: "18:00",
      eventVenue: "Business Center",
      city: "Indore",
      price: 199,
      originalPrice: 299,
      category: "OTHER",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1540575467068-1d4392e9c62c?auto=format&fit=crop&w=900&q=80",
      isVerified: true,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8590, 22.7230],
      },
    },
    {
      title: "Folk Music Festival",
      description: "Celebrate traditional folk music from across India.",
      eventName: "Folk Music Festival",
      eventDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
      eventTime: "17:00",
      eventVenue: "Open Air Amphitheatre",
      city: "Indore",
      price: 80,
      originalPrice: 100,
      category: "MUSIC",
      status: "ACTIVE",
      imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80",
      isVerified: false,
      sellerId: new mongoose.Types.ObjectId(),
      location: {
        type: "Point",
        coordinates: [75.8560, 22.7175],
      },
    },
  ];

  return tickets;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Clear existing tickets (optional - comment out if you want to keep existing data)
    // await Ticket.deleteMany({});
    // console.log("🗑️  Cleared existing tickets");

    // Generate sample tickets
    const sampleTickets = generateSampleTickets();
    console.log(`📝 Generated ${sampleTickets.length} sample tickets`);

    // Insert tickets into database
    const insertedTickets = await Ticket.insertMany(sampleTickets);
    console.log(`✅ Successfully inserted ${insertedTickets.length} tickets into database`);

    // Display sample ticket information
    console.log("\n📊 Sample Tickets Inserted:");
    console.log("=" .repeat(80));
    
    insertedTickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. ${ticket.eventName}`);
      console.log(`   City: ${ticket.city}`);
      console.log(`   Location: [${ticket.location.coordinates[0]}, ${ticket.location.coordinates[1]}]`);
      console.log(`   Price: $${ticket.price}`);
      console.log(`   Category: ${ticket.category}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Verified: ${ticket.isVerified ? 'Yes' : 'No'}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Database seeding completed successfully!");
    console.log("\n🧪 Test the API:");
    console.log(`   curl "http://localhost:3000/api/events/nearby?latitude=${INDORE_CENTER.latitude}&longitude=${INDORE_CENTER.longitude}&radius=25"`);
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();