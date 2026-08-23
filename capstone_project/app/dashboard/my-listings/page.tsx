"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * My Listings Page
 * Displays all ticket listings created by the current seller with search, filters, and pagination.
 * Uses NextAuth for authentication and follows the dashboard design system.
 */
interface Ticket {
  id: string;
  _id?: string;
  title: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  city: string;
  category: string;
  originalPrice: number;
  sellingPrice: number;
  imageUrl: string;
  status: string;
  isVerified: boolean;
  views: number;
  savedCount: number;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "ALL" | "ACTIVE" | "SOLD" | "PENDING" | "REMOVED";

export default function MyListingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ticketId: string | null;
    ticketTitle: string;
  }>({
    isOpen: false,
    ticketId: null,
    ticketTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Fetch listings from API
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.id) {
      fetchListings();
    } else if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, session, currentPage, statusFilter]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());
      
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      // Fetch tickets from API
      const response = await fetch(`/api/tickets/my-listings?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
        setTotalCount(data.pagination.totalCount);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.message || "Failed to load listings");
      }

    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Unable to load your listings.");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        setIsFiltering(true);
        setCurrentPage(1); // Reset to first page on new search
        fetchListings();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle status filter change
  useEffect(() => {
    setIsFiltering(true);
    setCurrentPage(1); // Reset to first page on filter change
    fetchListings();
  }, [statusFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
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
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "SOLD":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "REMOVED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (ticketId: string, ticketTitle: string) => {
    setDeleteModal({
      isOpen: true,
      ticketId,
      ticketTitle,
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      ticketId: null,
      ticketTitle: "",
    });
  };

  // Handle ticket deletion
  const handleDelete = async () => {
    if (!deleteModal.ticketId) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/tickets/${deleteModal.ticketId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove ticket from state
        setTickets(prev => prev.filter(t => t.id !== deleteModal.ticketId));
        setTotalCount(prev => prev - 1);
        
        // Show success message
        setSuccessMessage("Ticket deleted successfully!");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        // Close modal
        closeDeleteModal();
      } 
      else if (response.status === 401) {
        alert("Unauthorized: You can only delete your own listings");
      }
      else if (response.status === 403) {
        alert("Forbidden: You don't have permission to delete this listing");
      }
      else if (response.status === 404) {
        alert("Ticket not found");
      }
      else {
        alert(data.message || "Something went wrong. Please try again.");
      }

    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle mark as sold
  const handleMarkAsSold = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/mark-sold`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Update ticket status in state
        setTickets(prev => prev.map(t => 
          t.id === ticketId ? { ...t, status: "SOLD" } : t
        ));
        
        setSuccessMessage("Ticket marked as sold!");
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        alert(data.message || "Failed to mark ticket as sold");
      }
    } catch (error) {
      console.error("Error marking ticket as sold:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Loading State
  if (isLoading && !isFiltering) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
              My Listings
            </h1>
            <p className="text-ink-muted">
              Manage your ticket listings
            </p>
          </div>

          {/* Loading Skeleton */}
          <div className="grid grid-cols-1 gap-4">
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
              My Listings
            </h1>
            <p className="text-ink-muted">
              Manage your ticket listings
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
                Unable to Load Listings
              </h2>
              <p className="text-ink-muted mb-6">
                {error}
              </p>
              <button
                onClick={fetchListings}
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
  if (!isLoading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">
              My Listings
            </h1>
            <p className="text-ink-muted">
              Manage your ticket listings
            </p>
          </div>

          {/* Empty State */}
          <div className="max-w-2xl">
            <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-ink-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2">
                You haven't listed any tickets yet.
              </h2>
              <p className="text-ink-muted mb-6">
                Create your first listing and start selling tickets to buyers.
              </p>
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                Create Listing
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
            My Listings
          </h1>
          <p className="text-ink-muted">
            Manage your ticket listings
          </p>
        </div>

        {/* Filters and Actions Bar */}
        <div className="mb-6 space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
              <input
                type="text"
                placeholder="Search by event name or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="pl-10 pr-8 py-2.5 bg-surface-1 border border-hairline rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
                <option value="REMOVED">Removed</option>
              </select>
            </div>

            {/* Create Listing Button */}
            <Link
              href="/tickets/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create Listing
            </Link>
          </div>

          {/* Results Count */}
          <div className="text-sm text-ink-muted">
            {isFiltering ? (
              <span>Searching...</span>
            ) : (
              <span>
                Showing {tickets.length} of {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
              </span>
            )}
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
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
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-surface-1 rounded-lg border border-hairline overflow-hidden hover:border-hairline-strong transition-all duration-200"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Ticket Image */}
                    <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2">
                      <img
                        src={ticket.imageUrl}
                        alt={ticket.eventName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Ticket Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-ink mb-1 line-clamp-2">
                            {ticket.title}
                          </h3>
                          <p className="text-sm font-medium text-primary">
                            {ticket.eventName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                          {ticket.isVerified && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-semantic-success/10 text-semantic-success border border-semantic-success/20 rounded-full text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ink-muted mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{ticket.eventVenue}, {ticket.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDateTime(ticket.eventDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="truncate">{ticket.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>

                      {/* Pricing and Stats */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-hairline">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-ink-muted line-through">
                              ₹{ticket.originalPrice.toLocaleString()}
                            </span>
                            <span className="text-xl font-bold text-ink ml-2">
                              ₹{ticket.sellingPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-ink-muted">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{ticket.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                            <span>{ticket.savedCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-hairline">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/tickets/${ticket._id || ticket.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-hairline text-ink font-medium rounded-lg transition-colors duration-200 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        href={`/tickets/edit/${ticket._id || ticket.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-hairline text-ink font-medium rounded-lg transition-colors duration-200 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      
                      {/* Mark as Sold Button - Only for ACTIVE or PENDING tickets */}
                      {(ticket.status === "ACTIVE" || ticket.status === "PENDING") && (
                        <button
                          onClick={() => handleMarkAsSold(ticket.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-semantic-success/10 hover:bg-semantic-success/20 text-semantic-success font-medium rounded-lg transition-colors duration-200 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Sold
                        </button>
                      )}

                      <button
                        onClick={() => openDeleteModal(ticket.id, ticket.title)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-semantic-error/10 hover:bg-semantic-error/20 text-semantic-error font-medium rounded-lg transition-colors duration-200 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-ink-muted">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-1 hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed text-ink font-medium rounded-lg transition-colors duration-200 border border-hairline"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-1 hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed text-ink font-medium rounded-lg transition-colors duration-200 border border-hairline"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-1 rounded-lg shadow-2xl max-w-md w-full p-6 border border-hairline">
              <div className="text-center mb-6">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-ink mb-2">
                  Delete Listing
                </h3>
                <p className="text-ink-muted">
                  Are you sure you want to permanently delete this ticket listing?
                </p>
                <p className="text-semantic-error font-semibold mt-2">
                  "{deleteModal.ticketTitle}"
                </p>
                <p className="text-sm text-ink-muted mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-surface-2 hover:bg-hairline text-ink font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-semantic-error hover:bg-semantic-error/80 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Listing"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}