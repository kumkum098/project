"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Purchase Confirmation Page
 * Displays purchase summary before completing the transaction.
 * Shows ticket details, pricing, and marketplace protection info.
 */
interface Ticket {
  _id?: string;
  id: string;
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
  sellerName: string;
  sellerTrustScore: number;
  isVerified: boolean;
}

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch ticket details
  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch ticket from API (using the ticket details endpoint)
      const response = await fetch(`/api/tickets/my-listings?userId=demo-user-123`);

      if (!response.ok) {
        throw new Error("Failed to fetch ticket");
      }

      const data = await response.json();

      if (data.success) {
        // Find the specific ticket
        const foundTicket = data.data.find((t: any) => (t._id || t.id) === ticketId);

        if (!foundTicket) {
          setError("Ticket not found");
          return;
        }

        setTicket(foundTicket);
      } else {
        throw new Error(data.message || "Failed to load ticket");
      }

    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("Unable to load ticket details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pricing
  const platformFee = ticket ? ticket.sellingPrice * 0.05 : 0;
  const totalAmount = ticket ? ticket.sellingPrice + platformFee : 0;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle continue to payment
  const handleContinue = () => {
    if (termsAccepted && ticket) {
      // Navigate to checkout page
      router.push(`/checkout?ticketId=${ticket._id || ticket.id}`);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  // Error State - Ticket Not Found or Unavailable
  if (error || !ticket || ticket.status !== "AVAILABLE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-red-600"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Ticket Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This ticket is no longer available for purchase."}
          </p>
          <Link
            href="/tickets"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Return to Browse Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Confirm Your Purchase
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review your order details before proceeding to payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Image and Details */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative w-full h-64 sm:h-80">
                <img
                  src={ticket.imageUrl}
                  alt={ticket.eventName}
                  className="w-full h-full object-cover"
                />
                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  {ticket.category}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {ticket.title}
                </h2>

                <div className="space-y-3">
                  {/* Event Name */}
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-600">
                      {ticket.eventName}
                    </h3>
                  </div>

                  {/* Event Date */}
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-gray-500 mr-3 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="text-gray-900 font-medium">{formatDate(ticket.eventDate)}</p>
                    </div>
                  </div>

                  {/* Event Venue */}
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-gray-500 mr-3 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Venue</p>
                      <p className="text-gray-900 font-medium">
                        {ticket.eventVenue}, {ticket.city}
                      </p>
                    </div>
                  </div>

                  {/* Seller Information */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Seller Information
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {ticket.sellerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {ticket.sellerName}
                        </p>
                        <div className="flex items-center">
                          {ticket.isVerified && (
                            <span className="text-green-600 text-sm flex items-center mr-2">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Verified Seller
                            </span>
                          )}
                          <span className="text-sm text-gray-600">
                            Trust Score: {ticket.sellerTrustScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace Protection Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-6 h-6 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Marketplace Protection
              </h3>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    <strong>Escrow Protected Payment</strong> - Your payment is held securely until you receive your tickets
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    <strong>Money released only after buyer confirms ticket receipt</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    <strong>Refund support for verified disputes</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    <strong>Secure marketplace</strong> - All transactions are monitored and protected
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Pricing Summary
              </h3>

              <div className="space-y-3 mb-6">
                {/* Original Price */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Original Price</span>
                  <span className="text-gray-500 line-through">
                    ₹{ticket.originalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Selling Price */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Selling Price</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{ticket.sellingPrice.toLocaleString()}
                  </span>
                </div>

                {/* Platform Fee */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee (5%)</span>
                  <span className="text-gray-900">
                    ₹{platformFee.toLocaleString()}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                    I understand that my payment will be held securely in escrow until the ticket transfer is completed.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  disabled={!termsAccepted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    termsAccepted
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                >
                  Continue to Payment
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
                >
                  Cancel Purchase
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure SSL Encrypted Transaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}