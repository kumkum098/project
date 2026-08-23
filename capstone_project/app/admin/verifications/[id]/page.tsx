"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

/**
 * Verification history entry
 */
interface VerificationHistoryEntry {
  _id: string;
  action: string;
  reason?: string;
  adminMessage?: string;
  createdAt: string;
  adminId: {
    name: string;
    email: string;
  };
}

/**
 * Ticket with full details for verification
 */
interface TicketDetail {
  _id: string;
  title: string;
  description: string;
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
  verificationHistory: VerificationHistoryEntry[];
}

/**
 * Admin Verification Details Page
 * 
 * Displays detailed information about a ticket for verification.
 * Shows ticket info, seller info, uploaded proofs, and verification history.
 * Allows admin to approve, reject, or request more information.
 */
export default function AdminVerificationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [requestInfoMessage, setRequestInfoMessage] = useState("");

  const ticketId = params.id;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/verifications/${ticketId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Ticket not found");
          }
          throw new Error("Failed to fetch ticket details");
        }

        const data = await response.json();
        if (data.success) {
          setTicket(data.data);
        } else {
          throw new Error(data.message || "Failed to load ticket");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [status, session, ticketId]);

  // Handle approve action
  const handleApprove = async () => {
    if (!ticket) return;

    try {
      setActionLoading("approve");
      const response = await fetch(`/api/admin/tickets/${ticketId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        // Refresh ticket data
        setTicket({
          ...ticket,
          isVerified: true,
          verificationHistory: [
            {
              _id: new Date().toISOString(),
              action: "APPROVED",
              createdAt: new Date().toISOString(),
              adminId: {
                name: session?.user?.name || "Admin",
                email: session?.user?.email || "",
              },
            },
            ...ticket.verificationHistory,
          ],
        });
        alert("Ticket approved successfully!");
      } else {
        throw new Error(data.message || "Failed to approve ticket");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve ticket");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!ticket || !rejectionReason) return;

    try {
      setActionLoading("reject");
      const response = await fetch(`/api/admin/tickets/${ticketId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectionReason,
          adminMessage: rejectionMessage || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        // Refresh ticket data
        setTicket({
          ...ticket,
          status: "REMOVED",
          verificationHistory: [
            {
              _id: new Date().toISOString(),
              action: "REJECTED",
              reason: rejectionReason,
              adminMessage: rejectionMessage || undefined,
              createdAt: new Date().toISOString(),
              adminId: {
                name: session?.user?.name || "Admin",
                email: session?.user?.email || "",
              },
            },
            ...ticket.verificationHistory,
          ],
        });
        alert("Ticket rejected successfully!");
      } else {
        throw new Error(data.message || "Failed to reject ticket");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject ticket");
    } finally {
      setActionLoading(null);
      setRejectionReason("");
      setRejectionMessage("");
    }
  };

  // Handle request info action
  const handleRequestInfo = async () => {
    if (!ticket || !requestInfoMessage) return;

    try {
      setActionLoading("requestInfo");
      const response = await fetch(`/api/admin/tickets/${ticketId}/request-info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminMessage: requestInfoMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRequestInfoModal(false);
        // Refresh ticket data
        setTicket({
          ...ticket,
          verificationHistory: [
            {
              _id: new Date().toISOString(),
              action: "REQUEST_INFO",
              adminMessage: requestInfoMessage,
              createdAt: new Date().toISOString(),
              adminId: {
                name: session?.user?.name || "Admin",
                email: session?.user?.email || "",
              },
            },
            ...ticket.verificationHistory,
          ],
        });
        alert("Information request sent to seller!");
      } else {
        throw new Error(data.message || "Failed to request information");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request information");
    } finally {
      setActionLoading(null);
      setRequestInfoMessage("");
    }
  };

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Ticket</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <Link
                href="/admin/verifications"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to List
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render if not admin
  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  if (!ticket) {
    return null;
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVED":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case "REJECTED":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case "REQUEST_INFO":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Info Requested</span>;
      default:
        return null;
    }
  };

  const priceDifference = ticket.price - ticket.originalPrice;
  const priceDifferencePercent = ((priceDifference / ticket.originalPrice) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/verifications"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Verifications
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Verification</h1>
              <p className="mt-2 text-gray-600">Review ticket details and take action</p>
            </div>
            {ticket.isVerified && (
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Image */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Image</h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={ticket.imageUrl}
                  alt={ticket.eventName}
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              </div>
            </Card>

            {/* Ticket Information */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Title</label>
                  <p className="text-gray-900 font-medium">{ticket.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Event Name</label>
                  <p className="text-gray-900 font-medium">{ticket.eventName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Event Date</label>
                    <p className="text-gray-900">{new Date(ticket.eventDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Venue</label>
                    <p className="text-gray-900">{ticket.eventVenue}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{ticket.description}</p>
                </div>
              </div>
            </Card>

            {/* Price Comparison */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Comparison</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Original Price</label>
                  <p className="text-2xl font-bold text-gray-900">${ticket.originalPrice.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Selling Price</label>
                  <p className="text-2xl font-bold text-green-600">${ticket.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Price Difference</span>
                  <span className={`text-lg font-bold ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {priceDifference > 0 ? '+' : ''}{priceDifferencePercent}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Verification History */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification History</h2>
              {ticket.verificationHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No verification history yet</p>
              ) : (
                <div className="space-y-4">
                  {ticket.verificationHistory.map((entry) => (
                    <div key={entry._id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        {getActionBadge(entry.action)}
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Reason:</span> {entry.reason}
                        </p>
                      )}
                      {entry.adminMessage && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Message:</span> {entry.adminMessage}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        By: {entry.adminId.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Seller Info & Actions */}
          <div className="space-y-6">
            {/* Seller Information */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {ticket.sellerId.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-semibold text-gray-900">{ticket.sellerId.name}</p>
                    <p className="text-sm text-gray-500">{ticket.sellerId.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Trust Score</span>
                    <span className={`text-lg font-bold ${
                      ticket.sellerId.trustScore >= 61 ? 'text-green-600' :
                      ticket.sellerId.trustScore >= 41 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {ticket.sellerId.trustScore}/100
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        ticket.sellerId.trustScore >= 61 ? 'bg-green-600' :
                        ticket.sellerId.trustScore >= 41 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${ticket.sellerId.trustScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Listing Date */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Details</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Listed On</label>
                  <p className="text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{ticket.status}</p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            {!ticket.isVerified && ticket.status === "ACTIVE" && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading !== null}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {actionLoading === "approve" ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Ticket
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading !== null}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Ticket
                  </button>

                  <button
                    onClick={() => setShowRequestInfoModal(true)}
                    disabled={actionLoading !== null}
                    className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Request More Info
                  </button>
                </div>
              </Card>
            )}

            {/* Already Processed */}
            {(ticket.isVerified || ticket.status === "REMOVED") && (
              <Card>
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">
                    {ticket.isVerified ? "✓" : "✗"}
                  </div>
                  <p className="text-sm text-gray-600">
                    {ticket.isVerified ? "This ticket has been verified" : "This ticket has been rejected"}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Ticket</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <select
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a reason</option>
                    <option value="FAKE_TICKET">Fake Ticket</option>
                    <option value="IMAGE_NOT_CLEAR">Image Not Clear</option>
                    <option value="WRONG_EVENT">Wrong Event</option>
                    <option value="SUSPICIOUS_LISTING">Suspicious Listing</option>
                    <option value="DUPLICATE_TICKET">Duplicate Ticket</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Provide additional details about the rejection..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{rejectionMessage.length}/500 characters</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                      setRejectionMessage("");
                    }}
                    disabled={actionLoading !== null}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason || actionLoading !== null}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "reject" ? "Rejecting..." : "Reject Ticket"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Request Info Modal */}
        {showRequestInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Request More Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message to Seller *
                  </label>
                  <textarea
                    id="message"
                    value={requestInfoMessage}
                    onChange={(e) => setRequestInfoMessage(e.target.value)}
                    rows={6}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Explain what additional information you need from the seller..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestInfoMessage.length}/500 characters</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRequestInfoModal(false);
                      setRequestInfoMessage("");
                    }}
                    disabled={actionLoading !== null}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestInfo}
                    disabled={!requestInfoMessage || actionLoading !== null}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "requestInfo" ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}