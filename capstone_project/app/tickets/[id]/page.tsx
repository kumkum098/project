"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import TicketCard from "@/components/TicketCard";
import { useState, useMemo, useEffect } from "react";

/**
 * Ticket Details Page
 * Displays complete information about a specific ticket.
 * Handles both found and not-found ticket scenarios.
 */
export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any | null>(null);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketLoading, setTicketLoading] = useState(true);

  // State for payment processing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setTicketLoading(true);
        setError("");
        console.log("[ticket-details] frontend ticket id:", ticketId);

        const [ticketResponse, ticketsResponse] = await Promise.all([
          fetch(`/api/tickets/${ticketId}`),
          fetch("/api/tickets"),
        ]);

        if (!ticketResponse.ok) {
          const ticketData = await ticketResponse.json().catch(() => null);
          throw new Error(ticketData?.message || "Failed to load ticket details.");
        }

        const ticketData = await ticketResponse.json();
        if (!ticketData.success) {
          throw new Error(ticketData.message || "Failed to load ticket details.");
        }

        setTicket(ticketData.data);

        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          if (ticketsData.success) {
            setAllTickets(ticketsData.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching ticket details:", err);
        setError(err instanceof Error ? err.message : "Unable to load ticket details.");
        setTicket(null);
      } finally {
        setTicketLoading(false);
      }
    };

    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  // Calculate money saved
  const moneySaved = ticket ? ticket.originalPrice - ticket.price : 0;
  const savingsPercentage = ticket 
    ? Math.round((moneySaved / ticket.originalPrice) * 100) 
    : 0;

  // Get related tickets (same category, exclude current ticket)
  const relatedTickets = useMemo(() => {
    if (!ticket) return [];

    const currentTicketId = ticket._id || ticket.id;

    let related = allTickets.filter(
      (t: any) => t.category === ticket.category && (t._id || t.id) !== currentTicketId
    );

    if (related.length < 4) {
      const otherTickets = allTickets.filter(
        (t: any) => t.category !== ticket.category && (t._id || t.id) !== currentTicketId
      );
      related = [...related, ...otherTickets];
    }

    return related.slice(0, 4);
  }, [ticket, allTickets]);

  // Format date for display
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

  // ============================================
  // RAZORPAY PAYMENT HANDLER
  // ============================================

  /**
   * Handles the Buy Now button click
   * Creates a Razorpay order and opens the payment popup
   * Authentication is handled by the API endpoint
   */
  const handleBuyNow = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket._id || ticket.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.message || "Failed to create payment order");
      }

      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const razorpayOptions = {
        key: data.razorpayKey,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "TicketSwap Marketplace",
        description: `Ticket Purchase - ${ticket.eventName}`,
        prefill: { name: "", email: "", contact: "" },
        method: { upi: true, card: true, netbanking: true, wallet: true, emi: true },
        theme: { color: "#5e6ad2" },
      };

      const razorpay = new (window as any).Razorpay(razorpayOptions);

      razorpay.on("payment.success", async (response: any) => {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ticketId: ticket._id || ticket.id,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            alert("Payment verified successfully! Redirecting to your purchases...");
            router.push("/dashboard/purchases");
          } else {
            alert(`Payment verification failed: ${verifyData.message || "Please contact support"}`);
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          alert("Payment verification failed. Please contact support.");
        }
      });

      razorpay.on("payment.error", (error: any) => {
        setError(`Payment failed: ${error.description || "Please try again."}`);
      });

      razorpay.on("payment.cancel", () => {
        setError("Payment cancelled.");
      });

      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      setError(error instanceof Error ? error.message : "Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (ticketLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  // If ticket not found, display error page
  if (!ticket) {
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Ticket Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Sorry, the ticket you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => router.push("/tickets")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Tickets
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Section - Large Image with Badges */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative w-full h-96 sm:h-[500px]">
                <Image
                  src={ticket.imageUrl}
                  alt={ticket.eventName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
                />
                {/* Verified Badge */}
                {ticket.isVerified && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center">
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
                    Verified
                  </div>
                )}
                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  {ticket.category}
                </div>
              </div>
            </div>

            {/* Event Information Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {ticket.title}
              </h2>
              
              <div className="space-y-4">
                {/* Event Name */}
                <div>
                  <h3 className="text-xl font-semibold text-indigo-600 mb-2">
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
                    <p className="text-gray-900 font-medium">{ticket.eventVenue}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing, Seller, and Actions */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pricing</h3>
              
              <div className="space-y-3">
                {/* Original Price */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Original Price</span>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{ticket.originalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Selling Price */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Selling Price</span>
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{ticket.price.toLocaleString()}
                  </span>
                </div>

                {/* Money Saved */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-green-600 font-semibold">You Save</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{moneySaved.toLocaleString()}
                  </span>
                </div>

                {/* Savings Percentage */}
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <span className="text-green-700 font-semibold">
                    {savingsPercentage}% discount
                  </span>
                </div>

                {/* Fair Price Indicator */}
                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-blue-700 font-medium text-sm">
                    Fair Price Guaranteed
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Seller Information
              </h3>

              <div className="space-y-4">
                {/* Seller Name and Avatar */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {ticket.sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {ticket.sellerName}
                    </p>
                    {ticket.sellerTrustScore > 90 && (
                      <div className="flex items-center text-green-600 text-sm">
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust Score */}
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Trust Score</span>
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-lg font-bold text-gray-900">
                        {ticket.sellerTrustScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full"
                      style={{ width: `${ticket.sellerTrustScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace Protection */}
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
                    <strong>Escrow Payment Protection</strong> - Your payment is held securely until you receive your tickets
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
                    <strong>Verified Ticket System</strong> - All tickets are verified for authenticity
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
                    <strong>Secure Transactions</strong> - End-to-end encrypted transactions
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
                    <strong>Refund Support</strong> - Full refund if tickets are invalid or event is cancelled
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="bg-surface-1 rounded-xl shadow-lg p-6 space-y-3 border border-hairline">
              {/* Error Message Display */}
              {error && (
                <div className="bg-semantic-error/10 border border-semantic-error/20 text-semantic-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Primary Button - Buy Now */}
              <button
                onClick={handleBuyNow}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-lg disabled:bg-ink-subtle disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating secure payment..." : `Buy Now - ₹${ticket.price.toLocaleString()}`}
              </button>

              {/* Secondary Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => alert(`Ticket saved: ${ticket.title}`)}
                  className="bg-surface-2 hover:bg-surface-3 text-ink-muted font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center border border-hairline"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => alert(`Share: ${ticket.title}`)}
                  className="bg-surface-2 hover:bg-surface-3 text-ink-muted font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center border border-hairline"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </button>
                <button
                  onClick={() => alert(`Report listing: ${ticket.title}`)}
                  className="bg-surface-2 hover:bg-surface-3 text-ink-muted font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center border border-hairline"
                >
                  <svg
                    className="w-5 h-5 mr-1"
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
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Tickets Section */}
        {relatedTickets.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-ink mb-6">
              Related Tickets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedTickets.map((relatedTicket) => (
                <TicketCard key={relatedTicket._id || relatedTicket.id} ticket={relatedTicket} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}