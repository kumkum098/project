"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

// Force dynamic rendering to avoid SSR issues with useSession
export const dynamic = 'force-dynamic';

/**
 * Types for verification filtering and sorting
 */
type FilterType = "pending" | "verified" | "rejected" | "all";
type SortType = "newest" | "oldest" | "highestTrust" | "lowestTrust";

interface TicketWithSeller {
  _id: string;
  title: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  isVerified: boolean;
  status: string;
  createdAt: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    trustScore: number;
  };
}

/**
 * Admin Verifications Page
 * 
 * Displays all tickets pending verification with filtering and search capabilities.
 * Allows admins to review, approve, reject, or request more information.
 */
export default function AdminVerificationsPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithSeller[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("pending");
  const [sort, setSort] = useState<SortType>("newest");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch tickets based on filter
  const fetchTickets = useCallback(async () => {
    if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("filter", filter);
      }
      if (sort) {
        params.append("sort", sort);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/verifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
        setFilteredTickets(data.data);
      } else {
        throw new Error(data.message || "Failed to load tickets");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [status, session, filter, sort, searchQuery]);

  // Fetch tickets when filters change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Apply client-side filtering and sorting
  useEffect(() => {
    let result = [...tickets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.eventName.toLowerCase().includes(query) ||
          ticket.sellerId.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filter !== "all") {
      if (filter === "pending") {
        result = result.filter((t) => !t.isVerified && t.status === "ACTIVE");
      } else if (filter === "verified") {
        result = result.filter((t) => t.isVerified);
      } else if (filter === "rejected") {
        result = result.filter((t) => !t.isVerified && t.status === "REMOVED");
      }
    }

    // Apply sorting
    if (sort === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === "highestTrust") {
      result.sort((a, b) => b.sellerId.trustScore - a.sellerId.trustScore);
    } else if (sort === "lowestTrust") {
      result.sort((a, b) => a.sellerId.trustScore - b.sellerId.trustScore);
    }

    setFilteredTickets(result);
  }, [tickets, searchQuery, filter, sort]);

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Verifications</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render if not admin
  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  const getStatusBadge = (ticket: TicketWithSeller) => {
    if (ticket.isVerified) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verified</span>;
    } else if (ticket.status === "REMOVED") {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Verifications</h1>
          <p className="mt-2 text-gray-600">
            Review and verify ticket listings to maintain marketplace trust
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by ticket title, event, or seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestTrust">Highest Trust Seller</option>
                <option value="lowestTrust">Lowest Trust Seller</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredTickets.length}</span> of{" "}
            <span className="font-semibold">{tickets.length}</span> tickets
          </p>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Found</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try adjusting your search or filter criteria"
                  : "No tickets match the selected filter"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <Link key={ticket._id} href={`/admin/verifications/${ticket._id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {/* Ticket Image */}
                  <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                    <img
                      src={ticket.imageUrl}
                      alt={ticket.eventName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(ticket)}
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">{ticket.eventName}</p>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(ticket.eventDate).toLocaleDateString()}
                    </div>

                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {ticket.eventVenue}
                    </div>

                    {/* Price Comparison */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Original: ${ticket.originalPrice.toFixed(2)}</p>
                        <p className="text-lg font-bold text-green-600">${ticket.price.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {ticket.sellerId.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-medium text-gray-900">{ticket.sellerId.name}</p>
                            <p className="text-xs text-gray-500">Trust: {ticket.sellerId.trustScore}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}