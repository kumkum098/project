"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TicketCard from "@/components/TicketCard";
import type { Ticket } from "@/types/ticket";
import { TicketCategory } from "@/models/Ticket";

/**
 * Search Results Page
 * Displays search results based on query parameters
 * 
 * URL Parameters:
 * - q: search query (required)
 * - type: search type - city|event|venue|category (optional, default: city)
 */

// Types for search results (compatible with Ticket type)
interface SearchResult {
  id: string;
  title: string;
  description: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  city: string;
  price: number;
  originalPrice: number;
  category: "MUSIC" | "SPORTS" | "THEATRE" | "COMEDY" | "OTHER";
  status: "AVAILABLE" | "SOLD" | "PENDING" | "CANCELLED";
  imageUrl: string;
  isVerified: boolean;
  sellerName: string;
  sellerTrustScore: number;
  savedCount: number;
  createdAt: string;
  distance?: number;
  views: number;
  saves: number;
  demandLevel?: string;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get query parameters from URL
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "city";

  // State management
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    category: "all",
    minPrice: "",
    maxPrice: "",
    verifiedOnly: false,
    dateFilter: "any",
    availableOnly: true,
  });

  // Sort state
  const [sortBy, setSortBy] = useState("nearest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 12;

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  /**
   * Fetches search results based on query and type
   */
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let apiUrl = "";

        // Build API URL based on search type
        switch (type) {
          case "city":
            // Use nearby events API for city search
            // First geocode the city, then search nearby
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            const geoData = await geoResponse.json();
            
            if (geoData && geoData.length > 0) {
              const lat = parseFloat(geoData[0].lat);
              const lon = parseFloat(geoData[0].lon);
              apiUrl = `/api/events/nearby?latitude=${lat}&longitude=${lon}&radius=25`;
            } else {
              setResults([]);
              setTotalResults(0);
              setLoading(false);
              return;
            }
            break;

          case "event":
            // Search by event name - use nearby API with large radius
            apiUrl = `/api/events/nearby?latitude=0&longitude=0&radius=10000`;
            break;

          case "venue":
            // Search by venue - use nearby API
            apiUrl = `/api/events/nearby?latitude=0&longitude=0&radius=10000`;
            break;

          case "category":
            // Search by category - use nearby API
            apiUrl = `/api/events/nearby?latitude=0&longitude=0&radius=10000`;
            break;

          default:
            apiUrl = `/api/events/nearby?latitude=0&longitude=0&radius=10000`;
        }

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = await response.json();

        if (data.success && data.data) {
          let filteredResults = data.data;

          // Apply additional filters based on search type
          if (type === "event") {
            filteredResults = filteredResults.filter((item: SearchResult) =>
              item.eventName.toLowerCase().includes(query.toLowerCase()) ||
              item.title.toLowerCase().includes(query.toLowerCase())
            );
          } else if (type === "venue") {
            filteredResults = filteredResults.filter((item: SearchResult) =>
              item.eventVenue.toLowerCase().includes(query.toLowerCase())
            );
          } else if (type === "category") {
            filteredResults = filteredResults.filter((item: SearchResult) =>
              item.category.toLowerCase() === query.toLowerCase()
            );
          }

          setResults(filteredResults);
          setTotalResults(filteredResults.length);
        } else {
          setResults([]);
          setTotalResults(0);
        }
      } catch (err) {
        setError("Unable to load search results. Please try again.");
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, type]);

  /**
   * Filters results based on selected criteria
   */
  const getFilteredResults = () => {
    let filtered = [...results];

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter((item) => item.category === filters.category.toUpperCase());
    }

    // Filter by price range
    if (filters.minPrice !== "") {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter((item) => item.price >= minPrice);
    }
    if (filters.maxPrice !== "") {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter((item) => item.price <= maxPrice);
    }

    // Filter by verified only
    if (filters.verifiedOnly) {
      filtered = filtered.filter((item) => item.isVerified === true);
    }

    // Filter by date
    if (filters.dateFilter !== "any") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthFromNow = new Date(today);
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);

      filtered = filtered.filter((item) => {
        const eventDate = new Date(item.eventDate);
        
        switch (filters.dateFilter) {
          case "today":
            return eventDate >= today && eventDate < tomorrow;
          case "tomorrow":
            return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          case "this-week":
            return eventDate >= today && eventDate < weekFromNow;
          case "this-month":
            return eventDate >= today && eventDate < monthFromNow;
          default:
            return true;
        }
      });
    }

    // Filter by availability
    if (filters.availableOnly) {
      filtered = filtered.filter((item) => item.status === "AVAILABLE");
    }

    return filtered;
  };

  /**
   * Sorts results based on selected option
   */
  const getSortedResults = (items: SearchResult[]) => {
    const sorted = [...items];

    switch (sortBy) {
      case "nearest":
        sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      case "event-date":
        sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case "popular":
        sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return sorted;
  };

  // Apply filters and sorting
  const filteredResults = useMemo(() => getFilteredResults(), [results, filters]);
  const sortedResults = useMemo(() => getSortedResults(filteredResults), [filteredResults, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

  /**
   * Resets all filters
   */
  const resetFilters = () => {
    setFilters({
      category: "all",
      minPrice: "",
      maxPrice: "",
      verifiedOnly: false,
      dateFilter: "any",
      availableOnly: true,
    });
    setCurrentPage(1);
  };

  /**
   * Handles page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get search type label
  const getSearchTypeLabel = () => {
    switch (type) {
      case "city":
        return "City";
      case "event":
        return "Event";
      case "venue":
        return "Venue";
      case "category":
        return "Category";
      default:
        return "Location";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-surface-1 rounded animate-pulse w-1/4 mb-2" />
            <div className="h-6 bg-surface-1 rounded animate-pulse w-1/2" />
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {/* Sidebar skeleton */}
            <div className="hidden md:block md:col-span-1">
              <div className="space-y-4">
                <div className="h-32 bg-surface-1 rounded-lg animate-pulse" />
                <div className="h-32 bg-surface-1 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Results skeleton */}
            <div className="md:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-surface-1 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
          <h1 className="text-2xl font-semibold text-ink mb-2">Search Error</h1>
          <p className="text-ink-muted mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-focus transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No query state
  if (!query) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <svg
            className="h-16 w-16 text-ink-tertiary mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h1 className="text-2xl font-semibold text-ink mb-2">No Search Query</h1>
          <p className="text-ink-muted mb-6">Please enter a search term to find events.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-focus transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Search Results</h1>
          <p className="text-ink-muted">
            Showing results for <span className="font-medium text-ink">"{query}"</span> in{" "}
            <span className="font-medium text-ink">{getSearchTypeLabel()}</span>
          </p>
          <p className="text-sm text-ink-muted mt-1">
            {totalResults} event{totalResults !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filter Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Category Filter */}
              <div className="rounded-lg border border-hairline bg-surface-1 p-4">
                <h3 className="font-semibold text-ink mb-3">Category</h3>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-hairline bg-surface-0 px-3 text-sm text-ink outline-none focus:border-primary-focus"
                >
                  <option value="all">All Categories</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="theatre">Theatre</option>
                  <option value="comedy">Comedy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="rounded-lg border border-hairline bg-surface-1 p-4">
                <h3 className="font-semibold text-ink mb-3">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full h-10 rounded-md border border-hairline bg-surface-0 px-3 text-sm text-ink outline-none focus:border-primary-focus"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full h-10 rounded-md border border-hairline bg-surface-0 px-3 text-sm text-ink outline-none focus:border-primary-focus"
                  />
                </div>
              </div>

              {/* Verified Only Filter */}
              <div className="rounded-lg border border-hairline bg-surface-1 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-hairline text-primary focus:ring-2 focus:ring-primary-focus"
                  />
                  <span className="text-sm font-medium text-ink">Verified Tickets Only</span>
                </label>
              </div>

              {/* Date Filter */}
              <div className="rounded-lg border border-hairline bg-surface-1 p-4">
                <h3 className="font-semibold text-ink mb-3">Event Date</h3>
                <select
                  value={filters.dateFilter}
                  onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value })}
                  className="w-full h-10 rounded-md border border-hairline bg-surface-0 px-3 text-sm text-ink outline-none focus:border-primary-focus"
                >
                  <option value="any">Any Date</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="rounded-lg border border-hairline bg-surface-1 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-hairline text-primary focus:ring-2 focus:ring-primary-focus"
                  />
                  <span className="text-sm font-medium text-ink">Available Tickets Only</span>
                </label>
              </div>

              {/* Reset Filters */}
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 rounded-md border border-hairline bg-surface-0 text-ink font-medium hover:bg-surface-1 transition"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Search Results */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-ink-muted">Sort by</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2 w-full max-w-xs rounded-md border border-hairline bg-surface-0 px-3 py-2 text-sm text-ink outline-none focus:border-primary-focus"
                >
                  <option value="nearest">Nearest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="event-date">Event Date</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedResults.map((result) => (
                <TicketCard key={result.id} ticket={result as unknown as Ticket} />
              ))}
            </div>

            {paginatedResults.length === 0 && (
              <div className="mt-8 rounded-lg border border-hairline bg-surface-1 p-8 text-center text-ink-muted">
                No results found for your search.
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md border ${page === currentPage ? "border-primary bg-primary text-white" : "border-hairline bg-surface-0 text-ink"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
