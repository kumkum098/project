"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button, Card, StatusBadge, Container, Section, SectionHeader } from "@/components";

/**
 * Buyer Purchases Dashboard
 * Displays all ticket purchases made by the logged-in buyer.
 * Shows transaction history, status, and available actions.
 * 
 * Styled to match the application's dark theme design system.
 */
interface Transaction {
  id: string;
  ticketId: string;
  ticketTitle: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  city: string;
  category: string;
  imageUrl: string;
  sellerName: string;
  amount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionStatus: string;
  buyerConfirmed: boolean;
  sellerTransferred: boolean;
  disputeRaised: boolean;
  createdAt: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from API
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.id) {
      fetchTransactions(session.user.id);
    }
  }, [authStatus, session]);

  const fetchTransactions = async (userId?: string) => {
    const targetUserId = userId || session?.user?.id;
    
    if (!targetUserId) {
      setError("Unable to identify user. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch transactions from API
      const response = await fetch(`/api/transactions/my-purchases?userId=${targetUserId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch transactions");
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      } else {
        throw new Error(data.message || "Failed to load transactions");
      }

    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Unable to load your purchases.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.transactionStatus === "COMPLETED").length,
    inEscrow: transactions.filter(t => t.transactionStatus === "IN_ESCROW" || t.transactionStatus === "TICKET_TRANSFERRED" || t.transactionStatus === "BUYER_CONFIRMED").length,
    disputed: transactions.filter(t => t.transactionStatus === "DISPUTED").length,
  };

  // Get progress steps based on status
  const getProgressSteps = (status: string) => {
    const steps = [
      { name: "Order Created", completed: true },
      { name: "Payment Held In Escrow", completed: ["IN_ESCROW", "TICKET_TRANSFERRED", "BUYER_CONFIRMED", "COMPLETED"].includes(status) },
      { name: "Seller Transferred Ticket", completed: ["TICKET_TRANSFERRED", "BUYER_CONFIRMED", "COMPLETED"].includes(status) },
      { name: "Buyer Confirmed Ticket", completed: ["BUYER_CONFIRMED", "COMPLETED"].includes(status) },
      { name: "Completed", completed: status === "COMPLETED" },
    ];

    if (status === "DISPUTED") {
      steps.push({ name: "Disputed", completed: true });
    }

    if (status === "CANCELLED") {
      return [
        { name: "Order Created", completed: true },
        { name: "Cancelled", completed: true },
      ];
    }

    return steps;
  };

  // Format date
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

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-1 border border-hairline rounded-lg p-6 animate-pulse">
            <div className="h-12 w-12 bg-surface-2 rounded-full mb-4"></div>
            <div className="h-8 bg-surface-2 rounded mb-2"></div>
            <div className="h-4 bg-surface-2 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Cards Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface-1 border border-hairline rounded-lg overflow-hidden animate-pulse">
          <div className="p-6">
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-surface-2 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-surface-2 rounded w-3/4"></div>
                <div className="h-4 bg-surface-2 rounded w-1/2"></div>
                <div className="h-4 bg-surface-2 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error State
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <Section background="canvas" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="Dashboard"
              title="My Purchases"
              description="Track your purchased tickets and transaction progress."
            />
          </Container>
        </Section>

        <Section background="canvas" padding="md">
          <Container>
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
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
                  Unable to Load Purchases
                </h2>
                <p className="text-ink-muted mb-6 max-w-md mx-auto">{error}</p>
                <Button variant="primary" size="md" onClick={fetchTransactions}>
                  Try Again
                </Button>
              </div>
            </Card>
          </Container>
        </Section>
      </div>
    );
  }

  // Empty State
  if (!isLoading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <Section background="canvas" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="Dashboard"
              title="My Purchases"
              description="Track your purchased tickets and transaction progress."
            />
          </Container>
        </Section>

        <Section background="canvas" padding="md">
          <Container>
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
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
                  No Purchases Yet
                </h2>
                <p className="text-ink-muted mb-6 max-w-md mx-auto">
                  You haven't purchased any tickets yet. Start browsing to find your next event!
                </p>
                <Link href="/tickets">
                  <Button variant="primary" size="md">
                    Browse Tickets
                  </Button>
                </Link>
              </div>
            </Card>
          </Container>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Page Header */}
      <Section background="canvas" padding="lg">
        <Container>
          <SectionHeader
            eyebrow="Dashboard"
            title="My Purchases"
            description="Track your purchased tickets and transaction progress."
          />
        </Container>
      </Section>

      {/* Statistics Cards */}
      {!isLoading && (
        <Section background="canvas" padding="md">
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Purchases */}
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ink mb-1">{stats.total}</p>
                <p className="text-sm text-ink-muted">Total Purchases</p>
              </Card>

              {/* Completed */}
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-semantic-success/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ink mb-1">{stats.completed}</p>
                <p className="text-sm text-ink-muted">Completed</p>
              </Card>

              {/* In Escrow */}
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ink mb-1">{stats.inEscrow}</p>
                <p className="text-sm text-ink-muted">In Escrow</p>
              </Card>

              {/* Disputed */}
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-semantic-error/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ink mb-1">{stats.disputed}</p>
                <p className="text-sm text-ink-muted">Disputed</p>
              </Card>
            </div>
          </Container>
        </Section>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <Section background="canvas" padding="md">
          <Container>
            <div className="space-y-6">
              {transactions.map((transaction) => {
                const progressSteps = getProgressSteps(transaction.transactionStatus);

                return (
                  <Card key={transaction.id} variant="default" padding="none" className="overflow-hidden">
                    {/* Transaction Header */}
                    <div className="p-6 border-b border-hairline">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Ticket Image */}
                        <div className="relative w-full lg:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={transaction.imageUrl}
                            alt={transaction.eventName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <StatusBadge status="info" label={transaction.category} />
                          </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-ink mb-1">
                                {transaction.ticketTitle}
                              </h3>
                              <p className="text-lg font-semibold text-primary">
                                {transaction.eventName}
                              </p>
                            </div>
                            <div>
                              <StatusBadge 
                                status={transaction.transactionStatus.toLowerCase() as any}
                                label={transaction.transactionStatus.replace(/_/g, " ")}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-muted mb-4">
                            <div className="flex items-start">
                              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDate(transaction.eventDate)}</span>
                            </div>
                            <div className="flex items-start">
                              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{transaction.eventVenue}, {transaction.city}</span>
                            </div>
                            <div className="flex items-start">
                              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Seller: {transaction.sellerName}</span>
                            </div>
                            <div className="flex items-start">
                              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Purchased: {formatDate(transaction.createdAt)}</span>
                            </div>
                          </div>

                          {/* Transaction Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-ink-muted text-xs">Transaction ID</p>
                              <p className="font-mono text-xs text-ink">{transaction.id}</p>
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs">Payment Method</p>
                              <p className="font-semibold text-ink">{transaction.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs">Payment Status</p>
                              <StatusBadge 
                                status={transaction.paymentStatus.toLowerCase() as any}
                                label={transaction.paymentStatus}
                              />
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs">Amount Paid</p>
                              <p className="text-lg font-bold text-ink">₹{transaction.totalAmount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="px-6 py-4 bg-surface-1 border-b border-hairline">
                      <div className="flex items-center justify-between">
                        {progressSteps.map((step, index) => (
                          <div key={index} className="flex-1 flex items-center">
                            <div className="flex flex-col items-center flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.completed ? "bg-semantic-success text-canvas" : "bg-surface-2 text-ink-muted"
                              }`}>
                                {step.completed ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className="text-xs">{index + 1}</span>
                                )}
                              </div>
                              <p className={`text-xs mt-2 text-center ${
                                step.completed ? "text-semantic-success font-semibold" : "text-ink-muted"
                              }`}>
                                {step.name}
                              </p>
                            </div>
                            {index < progressSteps.length - 1 && (
                              <div className={`flex-1 h-1 mx-2 ${
                                step.completed ? "bg-semantic-success" : "bg-hairline"
                              }`}></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-surface-1">
                      <div className="flex flex-wrap gap-3">
                        {transaction.transactionStatus === "IN_ESCROW" && (
                          <>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                            <Button variant="tertiary" size="sm">
                              Raise Dispute
                            </Button>
                          </>
                        )}

                        {transaction.transactionStatus === "TICKET_TRANSFERRED" && (
                          <>
                            <Button variant="primary" size="sm">
                              Confirm Ticket Received
                            </Button>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </>
                        )}

                        {transaction.transactionStatus === "COMPLETED" && (
                          <>
                            <Button variant="secondary" size="sm">
                              Leave Review
                            </Button>
                            <Button variant="tertiary" size="sm">
                              Download Receipt
                            </Button>
                            <Button variant="tertiary" size="sm">
                              View Ticket
                            </Button>
                          </>
                        )}

                        {transaction.transactionStatus === "DISPUTED" && (
                          <Button variant="tertiary" size="sm">
                            View Dispute Status
                          </Button>
                        )}

                        {(transaction.transactionStatus === "PENDING" || transaction.transactionStatus === "CANCELLED") && (
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}