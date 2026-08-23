"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Nearby Event Details Page
 * Displays comprehensive information about a nearby event ticket
 */

// Types for the ticket data
interface TicketData {
  id: string;
  title: string;
  description: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventVenue: string;
  city: string;
  price: number;
  originalPrice: number;
  category: string;
  status: string;
  imageUrl: string;
  isVerified: boolean;
  distance?: number;
  sellerId: string;
}

interface SellerData {
  id: string;
  name: string;
  profilePicture?: string;
  trustScore: number;
  averageRating: number;
  reviewCount: number;
  isVerifiedSeller: boolean;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyerName: string;
}

export default function NearbyEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  // State management
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [similarEvents, setSimilarEvents] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch ticket details
        const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
        if (!ticketResponse.ok) {
          throw new Error("Failed to fetch ticket details");
        }
        const ticketData = await ticketResponse.json();
        
        if (ticketData.success) {
          setTicket(ticketData.data);
          
          // Fetch seller details
          if (ticketData.data.sellerId) {
            const sellerResponse = await fetch(`/api/users/${ticketData.data.sellerId}`);
            if (sellerResponse.ok) {
              const sellerData = await sellerResponse.json();
              if (sellerData.success) {
                setSeller(sellerData.data);
              }
            }

            // Fetch seller reviews
            const reviewsResponse = await fetch(`/api/reviews/seller/${ticketData.data.sellerId}`);
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              if (reviewsData.success) {
                setReviews(reviewsData.data || []);
              }
            }
          }

          // Fetch similar events (same category or city)
          const similarResponse = await fetch(
            `/api/events/nearby?latitude=0&longitude=0&radius=100&category=${ticketData.data.category}&city=${ticketData.data.city}&limit=4`
          );
          if (similarResponse.ok) {
            const similarData = await similarResponse.json();
            if (similarData.success) {
              // Filter out current ticket and limit to 4
              const filtered = similarData.data
                .filter((event: TicketData) => event.id !== ticketId)
                .slice(0, 4);
              setSimilarEvents(filtered);
            }
          }
        } else {
          throw new Error(ticketData.message || "Ticket not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  // Calculate savings amount
  const savings = ticket ? ticket.originalPrice - ticket.price : 0;
  const savingsPercentage = ticket ? Math.round((savings / ticket.originalPrice) * 100) : 0;

  // Calculate fair price meter
  const getFairPriceMeter = () => {
    if (!ticket) return { status: "Fair Price", color: "green", emoji: "🟢" };
    
    const ratio = ticket.price / ticket.originalPrice;
    
    if (ratio <= 1.0) {
      return { status: "Fair Price", color: "green", emoji: "🟢" };
    } else if (ratio <= 1.3) {
      return { status: "Slightly High", color: "yellow", emoji: "🟡" };
    } else {
      return { status: "Overpriced", color: "red", emoji: "🔴" };
    }
  };

  const fairPrice = getFairPriceMeter();

  // Calculate demand level
  const getDemandLevel = () => {
    if (!ticket) return "MEDIUM";
    
    // Simple logic based on views and savings
    // In a real app, this would be more sophisticated
    if (savingsPercentage > 30) return "HIGH";
    if (savingsPercentage > 10) return "MEDIUM";
    return "LOW";
  };

  const demandLevel = getDemandLevel();

  // Check if last minute deal (within 48 hours)
  const isLastMinuteDeal = () => {
    if (!ticket) return false;
    const eventDate = new Date(ticket.eventDate);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilEvent > 0 && hoursUntilEvent <= 48;
  };

  const lastMinuteDeal = isLastMinuteDeal();

  // Get countdown text
  const getCountdown = () => {
    if (!ticket) return "";
    const eventDate = new Date(ticket.eventDate);
    const now = new Date();
    const hoursUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursUntilEvent < 24) {
      return `${hoursUntilEvent} hours left`;
    } else {
      const days = Math.floor(hoursUntilEvent / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Banner Skeleton */}
          <div className="rounded-lg border border-hairline bg-surface-1 overflow-hidden mb-8">
            <div className="h-64 bg-surface-0 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-8 bg-surface-0 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-surface-0 rounded animate-pulse w-1/2" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-surface-1 rounded-lg animate-pulse" />
            <div className="h-48 bg-surface-1 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <svg
            className="h-16 w-16 text-semantic-error mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-semibold text-ink mb-2">Event Not Found</h1>
          <p className="text-ink-muted mb-6">
            {error || "The event you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-md border border-hairline bg-surface-0 text-ink font-medium hover:bg-surface-1 transition"
            >
              Go Back
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-focus transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* SECTION 1: Hero Banner */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden bg-surface-1">
        <img
          src={ticket.imageUrl}
          alt={ticket.eventName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-sm font-medium">
                {ticket.category}
              </span>
              {ticket.isVerified && (
                <span className="px-3 py-1 rounded-full bg-semantic-success/90 text-white text-sm font-medium">
                  ✓ Verified
                </span>
              )}
              {ticket.distance !== undefined && (
                <span className="px-3 py-1 rounded-full bg-white/90 text-ink text-sm font-medium">
                  {ticket.distance.toFixed(1)} km away
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {ticket.eventName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(ticket.eventDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              
              {ticket.eventTime && (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{ticket.eventTime}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {ticket.eventVenue}, {ticket.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 2: Ticket Information */}
            <div className="rounded-lg border border-hairline bg-surface-1 p-6">
              <h2 className="text-2xl font-semibold text-ink mb-4">Ticket Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-ink mb-1">{ticket.title}</h3>
                  <p className="text-ink-muted">{ticket.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-ink-muted">Original Price</p>
                    <p className="text-lg font-semibold text-ink line-through">
                      ${ticket.originalPrice}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-ink-muted">Selling Price</p>
                    <p className="text-2xl font-bold text-primary">${ticket.price}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-ink-muted">You Save</p>
                    <p className="text-lg font-semibold text-semantic-success">
                      ${savings} ({savingsPercentage}%)
                    </p>
                  </div>
                </div>

                {/* Fair Price Meter */}
                <div className="pt-4 border-t border-hairline">
                  <p className="text-sm font-medium text-ink mb-2">Fair Price Meter</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{fairPrice.emoji}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      fairPrice.color === "green" ? "bg-semantic-success/10 text-semantic-success" :
                      fairPrice.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                      "bg-semantic-error/10 text-semantic-error"
                    }`}>
                      {fairPrice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Event Information */}
            <div className="rounded-lg border border-hairline bg-surface-1 p-6">
              <h2 className="text-2xl font-semibold text-ink mb-4">Event Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-ink-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-muted">Venue</p>
                    <p className="text-ink font-medium">{ticket.eventVenue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-ink-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-muted">City</p>
                    <p className="text-ink font-medium">{ticket.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-ink-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-muted">Event Date</p>
                    <p className="text-ink font-medium">
                      {new Date(ticket.eventDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-ink-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-muted">Category</p>
                    <p className="text-ink font-medium">{ticket.category}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-ink-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-muted">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                      ticket.status === "ACTIVE" 
                        ? "bg-semantic-success/10 text-semantic-success" 
                        : "bg-ink-muted/10 text-ink-muted"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: Buyer Protection */}
            <div className="rounded-lg border border-hairline bg-surface-1 p-6">
              <h2 className="text-2xl font-semibold text-ink mb-4">Buyer Protection</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-semantic-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="font-medium text-ink">Escrow Protection</p>
                    <p className="text-sm text-ink-muted">Payment held securely until ticket delivery</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-semantic-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-ink">Verified Listing</p>
                    <p className="text-sm text-ink-muted">Ticket authenticity guaranteed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-semantic-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-medium text-ink">Secure Payment</p>
                    <p className="text-sm text-ink-muted">Encrypted transactions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-semantic-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <div>
                    <p className="font-medium text-ink">Buyer Refund Support</p>
                    <p className="text-sm text-ink-muted">Full refund if event is cancelled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 9: Similar Nearby Events */}
            {similarEvents.length > 0 && (
              <div className="rounded-lg border border-hairline bg-surface-1 p-6">
                <h2 className="text-2xl font-semibold text-ink mb-4">Similar Nearby Events</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {similarEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/nearby-events/${event.id}`}
                      className="rounded-lg border border-hairline bg-surface-0 overflow-hidden transition-all hover:border-hairline-strong hover:shadow-md"
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-surface-1">
                        <img
                          src={event.imageUrl}
                          alt={event.eventName}
                          className="h-full w-full object-cover"
                        />
                        {event.distance !== undefined && (
                          <div className="absolute top-2 right-2 rounded-full bg-primary/90 px-2 py-1 text-xs font-semibold text-white">
                            {event.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-semibold text-ink mb-1 line-clamp-1">{event.eventName}</h4>
                        <p className="text-sm text-ink-muted mb-2 line-clamp-1">{event.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">${event.price}</span>
                          <span className="text-sm text-primary font-medium">View Details →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SECTION 3: Seller Information */}
            {seller && (
              <div className="rounded-lg border border-hairline bg-surface-1 p-6">
                <h2 className="text-xl font-semibold text-ink mb-4">Seller Information</h2>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-surface-0 flex items-center justify-center text-2xl font-bold text-ink">
                    {seller.profilePicture ? (
                      <img src={seller.profilePicture} alt={seller.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      seller.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink mb-1">{seller.name}</h3>
                    {seller.isVerifiedSeller && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-semantic-success/10 text-xs font-medium text-semantic-success">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Seller
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-ink-muted">Trust Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-ink">{seller.trustScore}</span>
                      <span className="text-sm text-ink-muted">/ 100</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-ink-muted">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-ink">{seller.averageRating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(seller.averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-ink-muted">Number of Reviews</p>
                    <p className="text-lg font-semibold text-ink">{seller.reviewCount}</p>
                  </div>
                </div>

                <button className="w-full px-4 py-2 rounded-md border border-hairline bg-surface-0 text-ink font-medium hover:bg-surface-1 transition">
                  View Seller Profile
                </button>
              </div>
            )}

            {/* SECTION 6: Demand Indicator */}
            <div className="rounded-lg border border-hairline bg-surface-1 p-6">
              <h2 className="text-xl font-semibold text-ink mb-4">Demand Indicator</h2>
              
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Demand Level</span>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  demandLevel === "HIGH" ? "bg-semantic-error/10 text-semantic-error" :
                  demandLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                  "bg-semantic-success/10 text-semantic-success"
                }`}>
                  {demandLevel}
                </span>
              </div>
            </div>

            {/* SECTION 7: Last Minute Deal */}
            {lastMinuteDeal && (
              <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">🔥</span>
                  <h2 className="text-xl font-semibold text-orange-900">Last Minute Deal</h2>
                </div>
                <p className="text-orange-700 font-medium">{getCountdown()}</p>
                <p className="text-sm text-orange-600 mt-1">Event starts within 48 hours!</p>
              </div>
            )}

            {/* SECTION 8: Action Buttons */}
            <div className="space-y-3">
              <button className="w-full px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus transition">
                Buy Now
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 rounded-md border border-hairline bg-surface-0 text-ink font-medium hover:bg-surface-1 transition">
                  Save Ticket
                </button>
                <button className="px-4 py-2 rounded-md border border-hairline bg-surface-0 text-ink font-medium hover:bg-surface-1 transition">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}