"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import TicketCard from "@/components/TicketCard";
import { Card, Button, Container, Section, SectionHeader } from "@/components";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Browse Tickets page - displays all available tickets with search and filter UI.
 * Features real-time search functionality for tickets and wishlist integration.
 * 
 * Styled to match the application's dark theme design system.
 */
export default function BrowseTicketsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  // State for search input
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for selected category filter
  const [selectedCategory, setSelectedCategory] = useState("");

  // State for selected sort option
  const [sortBy, setSortBy] = useState("default");

  // State for ticket listings
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // State for wishlist
  const [wishlist, setWishlist] = useState<Set<string>>(new Set<string>());
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const response = await fetch("/api/tickets");

      if (!response.ok) {
        throw new Error("Failed to load tickets");
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Fetch user's wishlist on mount
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.id) {
      fetchWishlist();
    } else if (authStatus === "unauthenticated") {
      setIsLoadingWishlist(false);
    }
  }, [authStatus, session]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/saved-events");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const ticketIds = new Set<string>(data.data.map((item: { ticketId: string }) => item.ticketId));
          setWishlist(ticketIds);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (ticketId: string) => {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }

    const isInWishlist = wishlist.has(ticketId);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/saved-events/${ticketId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setWishlist(prev => {
            const newSet = new Set(prev);
            newSet.delete(ticketId);
            return newSet;
          });
        }
      } else {
        // Add to wishlist
        const response = await fetch("/api/saved-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticketId }),
        });

        if (response.ok) {
          setWishlist(prev => new Set(prev).add(ticketId));
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  // Filter and sort tickets based on search query, category, and sort option
  const filteredTickets = useMemo(() => {
    // Step 1: Start with a copy of fetched tickets (never modify the original)
    let result = [...tickets];

    // Step 2: Apply category filter
    if (selectedCategory) {
      result = result.filter((ticket) => ticket.category === selectedCategory);
    }

    // Step 3: Apply search filter if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Search in title, eventName, and eventVenue (case-insensitive)
      result = result.filter((ticket) => {
        return (
          ticket.title.toLowerCase().includes(query) ||
          ticket.eventName.toLowerCase().includes(query) ||
          ticket.eventVenue.toLowerCase().includes(query)
        );
      });
    }

    // Step 4: Apply sorting based on selected option
    // Create a new array for sorting to avoid mutating the filtered results
    const sorted = [...result];
    
    switch (sortBy) {
      case "price-low":
        // Sort by price from low to high
        sorted.sort((a, b) => a.price - b.price);
        break;
      
      case "price-high":
        // Sort by price from high to low
        sorted.sort((a, b) => b.price - a.price);
        break;
      
      case "date-earliest":
        // Sort by event date - nearest event first
        sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      
      case "date-latest":
        // Sort by event date - latest event first
        sorted.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      
      case "most-viewed":
        // Sort by views in descending order (most viewed first)
        sorted.sort((a, b) => b.views - a.views);
        break;
      
      case "default":
      default:
        // Default: show tickets in their original order (by creation date, newest first)
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return sorted;
  }, [tickets, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Page Header */}
      <Section background="canvas" padding="lg">
        <Container>
          <SectionHeader
            eyebrow="Marketplace"
            title="Browse Tickets"
            description="Find verified tickets for concerts, sports, theatre and more."
          />
        </Container>
      </Section>

      {/* Search and Filters Section */}
      <Section background="surface-1" padding="md">
        <Container>
          <Card variant="default" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-ink">Search & Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-1">
                <label htmlFor="search" className="block text-sm font-medium text-ink-muted mb-2">
                  Search Events
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-muted pointer-events-none" />
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by event, venue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary transition-colors focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-ink-muted mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 px-4 rounded-md bg-surface-1 border border-hairline text-ink transition-colors focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                >
                  <option value="">All Categories</option>
                  <option value="MUSIC">Music</option>
                  <option value="SPORTS">Sports</option>
                  <option value="THEATRE">Theatre</option>
                  <option value="COMEDY">Comedy</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-ink-muted mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-12 px-4 rounded-md bg-surface-1 border border-hairline text-ink transition-colors focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                >
                  <option value="default">Default</option>
                  <option value="price-low">Lowest Price</option>
                  <option value="price-high">Highest Price</option>
                  <option value="date-earliest">Event Date (Earliest First)</option>
                  <option value="date-latest">Event Date (Latest First)</option>
                  <option value="most-viewed">Most Viewed</option>
                </select>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Results Count */}
      <Section background="canvas" padding="md">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <p className="text-ink-muted">
              {searchQuery || selectedCategory ? (
                <>
                  Found <span className="font-semibold text-ink">{filteredTickets.length}</span> matching tickets
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-ink">{tickets.length}</span> tickets
                </>
              )}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setSortBy("default");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Tickets Grid */}
          {isLoadingTickets ? (
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
                <p className="text-ink-muted">Loading tickets...</p>
              </div>
            </Card>
          ) : filteredTickets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTickets.map((ticket) => {
                const ticketId = ticket._id || ticket.id;

                return (
                  <TicketCard
                    key={ticketId}
                    ticket={ticket}
                    isInWishlist={wishlist.has(ticketId)}
                    onWishlistToggle={handleWishlistToggle}
                  />
                );
              })}
            </div>
          ) : (
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-full mb-4">
                  <Search className="w-8 h-8 text-ink-muted" />
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">
                  {searchQuery ? "No matching tickets found" : "No tickets available"}
                </h3>
                <p className="text-ink-muted max-w-md mx-auto">
                  {searchQuery ? "Try adjusting your search terms or filters" : "Check back later for new listings."}
                </p>
              </div>
            </Card>
          )}
        </Container>
      </Section>
    </div>
  );
}
