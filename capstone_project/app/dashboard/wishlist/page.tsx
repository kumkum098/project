"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, Eye, Trash2, ShoppingCart, Search } from "lucide-react";

/**
 * Wishlist Page
 * Displays all tickets saved by the user with full details and management options.
 * Uses NextAuth for authentication and follows the dashboard design system.
 */
interface WishlistItem {
  id: string;
  userId: string;
  ticketId: string;
  createdAt: string;
  ticket: {
    id: string;
    _id?: string;
    title: string;
    eventName: string;
    eventDate: string;
    eventVenue: string;
    city: string;
    price: number;
    originalPrice: number;
    imageUrl: string;
    status: string;
    isVerified: boolean;
    category: string;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch wishlist from API
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.id) {
      fetchWishlist();
    } else if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, session, router]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/saved-events");

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const data = await response.json();

      if (data.success) {
        setWishlistItems(data.data);
      } else {
        throw new Error(data.message || "Failed to load wishlist");
      }

    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Unable to load your wishlist.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (savedEventId: string, ticketId: string) => {
    try {
      setRemovingIds(prev => new Set(prev).add(savedEventId));

      const response = await fetch(`/api/saved-events/${savedEventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from state
        setWishlistItems(prev => prev.filter(item => item.id !== savedEventId));
        
        // Show success message
        setSuccessMessage("Ticket removed from wishlist");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to remove from wishlist");
      }

    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(savedEventId);
        return newSet;
      });
    }
  };

  // Format date for display
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "AVAILABLE":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "SOLD":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "REMOVED":
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
              My Wishlist
            </h1>
            <p className="text-ink-muted">
              Tickets you've saved for later
            </p>
          </div>

          {/* Loading Skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-surface-1 rounded-lg border border-hairline p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-surface-2 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-surface-2 rounded w-3/4"></div>
                    <div className="h-4 bg-surface-2 rounded w-1/2"></div>
                    <div className="h-4 bg-surface-2 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
              My Wishlist
            </h1>
            <p className="text-ink-muted">
              Tickets you've saved for later
            </p>
          </div>

          {/* Error State */}
          <div className="max-w-2xl">
            <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-semantic-error/10 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-semantic-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2">
                Unable to Load Wishlist
              </h2>
              <p className="text-ink-muted mb-6">
                {error}
              </p>
              <button
                onClick={fetchWishlist}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!isLoading && wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
              My Wishlist
            </h1>
            <p className="text-ink-muted">
              Tickets you've saved for later
            </p>
          </div>

          {/* Empty State */}
          <div className="max-w-2xl">
            <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-full mb-4">
                <Heart className="w-8 h-8 text-ink-muted" />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2">
                You haven't saved any tickets yet.
              </h2>
              <p className="text-ink-muted mb-6">
                Browse tickets and click the heart icon to save them to your wishlist.
              </p>
              <Link
                href="/tickets"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Search className="w-5 h-5" />
                Browse Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
            My Wishlist
          </h1>
          <p className="text-ink-muted">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'ticket' : 'tickets'} saved
          </p>
        </div>

        {/* Wishlist Items */}
        <div className="space-y-4">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-1 rounded-lg border border-hairline overflow-hidden hover:border-hairline-strong transition-all duration-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Ticket Image */}
                  <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2">
                    <img
                      src={item.ticket.imageUrl}
                      alt={item.ticket.eventName}
                      className="w-full h-full object-cover"
                    />
                    {item.ticket.isVerified && (
                      <div className="absolute top-2 right-2 bg-semantic-success text-canvas px-2 py-1 rounded-full text-xs font-semibold">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Ticket Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-ink mb-1 line-clamp-2">
                          {item.ticket.title}
                        </h3>
                        <p className="text-sm font-medium text-primary">
                          {item.ticket.eventName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            item.ticket.status
                          )}`}
                        >
                          {item.ticket.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ink-muted mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{item.ticket.eventVenue}, {item.ticket.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(item.ticket.eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="truncate">{item.ticket.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Saved: {formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-hairline">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-ink-muted line-through">
                            ₹{item.ticket.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-xl font-bold text-ink ml-2">
                            ₹{item.ticket.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-hairline">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/tickets/${item.ticket._id || item.ticket.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-hairline text-ink font-medium rounded-lg transition-colors duration-200 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Ticket
                    </Link>
                    
                    {item.ticket.status === "ACTIVE" || item.ticket.status === "AVAILABLE" ? (
                      <Link
                        href={`/tickets/${item.ticket._id || item.ticket.id}/purchase`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </Link>
                    ) : null}

                    <button
                      onClick={() => handleRemoveFromWishlist(item.id, item.ticketId)}
                      disabled={removingIds.has(item.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-semantic-error/10 hover:bg-semantic-error/20 text-semantic-error font-medium rounded-lg transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingIds.has(item.id) ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-semantic-error border-t-transparent"></div>
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-semantic-success text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse z-50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}