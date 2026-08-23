import { Ticket } from "../types/ticket";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./Button";
import { Heart } from "lucide-react";

/**
 * Reusable TicketCard component for displaying ticket listings.
 * Shows event details, pricing, seller information, and a buy button.
 * Includes wishlist functionality with heart icon.
 * 
 * Styled to match the application's dark theme design system.
 */
interface TicketCardProps {
  ticket: Ticket;
  isInWishlist?: boolean;
  onWishlistToggle?: (ticketId: string) => void;
}

export default function TicketCard({ ticket, isInWishlist = false, onWishlistToggle }: TicketCardProps) {
  const ticketId = ticket._id || ticket.id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(ticketId);
    }
  };

  return (
    <Link href={`/tickets/${ticketId}`} className="block group">
      {/* Card content wrapped in Link for navigation to ticket details */}
      <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 flex flex-col h-full">
        {/* Top Section - Image */}
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={ticket.imageUrl}
            alt={ticket.eventName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Wishlist Heart Icon */}
          {onWishlistToggle && (
            <button
              onClick={handleWishlistClick}
              className="absolute top-3 left-3 p-2 bg-surface-1/80 backdrop-blur-sm rounded-full hover:bg-surface-1 transition-colors z-10"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isInWishlist
                    ? "fill-semantic-error text-semantic-error"
                    : "text-ink-muted hover:text-semantic-error"
                }`}
              />
            </button>
          )}

          {ticket.isVerified && (
            <div className="absolute top-3 right-3 bg-semantic-success text-canvas px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              ✓ Verified
            </div>
          )}
        </div>

        {/* Middle Section - Event Details */}
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-bold text-ink mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {ticket.title}
          </h3>
          <p className="text-sm font-semibold text-primary mb-2">
            {ticket.eventName}
          </p>
          <div className="space-y-1.5 text-sm text-ink-muted">
            <div className="flex items-start">
              <span className="mr-2 flex-shrink-0">📍</span>
              <span className="line-clamp-1">{ticket.eventVenue}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 flex-shrink-0">📅</span>
              <span className="line-clamp-1">{formatDate(ticket.eventDate)}</span>
            </div>
          </div>
        </div>

        {/* Seller Section */}
        <div className="px-4 pb-3 border-t border-hairline pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-on-primary font-semibold text-sm">
                {ticket.sellerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-ink line-clamp-1">
                {ticket.sellerName}
              </span>
            </div>
            <div className="flex items-center bg-surface-2 px-2 py-1 rounded-full border border-hairline">
              <span className="text-primary mr-1">⭐</span>
              <span className="text-sm font-semibold text-ink">
                {ticket.sellerTrustScore}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="px-4 pb-3">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-ink-muted line-through">
                ${ticket.originalPrice}
              </span>
              <span className="text-2xl font-bold text-ink">
                ${ticket.price}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-semantic-success font-medium">
                {Math.round(((ticket.originalPrice - ticket.price) / ticket.originalPrice) * 100)}% off
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section - Buy Button */}
        <div className="px-4 pb-4 mt-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              // Navigate to ticket details page
              window.location.href = `/tickets/${ticketId}`;
            }}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </Link>
  );
}
