"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge, Container, Section, SectionHeader } from "@/components";

interface TransactionRecord {
  id: string;
  ticketId: string;
  ticketTitle: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  city: string;
  category: string;
  imageUrl: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  escrowStatus: string;
  transactionStatus: string;
  buyerConfirmed: boolean;
  sellerTransferred: boolean;
  transferredAt?: string;
  buyerConfirmedAt?: string;
  completedAt?: string;
  releasedAt?: string;
  releaseDate?: string;
  releasedAmount?: number;
  soldAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPaymentBadgeStatus(status: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "success";
    case "FAILED":
      return "error";
    default:
      return "warning";
  }
}

function getEscrowBadgeStatus(status: string) {
  switch (status?.toUpperCase()) {
    case "RELEASED":
      return "success";
    case "ON_HOLD":
      return "error";
    case "WAITING_FOR_BUYER_CONFIRMATION":
      return "warning";
    case "ACTIVE":
    case "READY_FOR_RELEASE":
      return "info";
    default:
      return "info";
  }
}

function getTransactionBadgeStatus(status: string) {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "success";
    case "DISPUTED":
      return "error";
    case "CANCELLED":
      return "removed";
    case "TICKET_TRANSFERRED":
      return "info";
    default:
      return "pending";
  }
}

function getTransactionTimeline(transaction: TransactionRecord) {
  const steps = [
    {
      title: "Order Created",
      detail: formatDate(transaction.createdAt),
      completed: true,
    },
    {
      title: "Payment Received",
      detail: transaction.paymentStatus === "PAID" ? formatDate(transaction.createdAt) : "Pending",
      completed: transaction.paymentStatus === "PAID",
    },
    {
      title: "Ticket Transferred",
      detail: transaction.sellerTransferred ? formatDate(transaction.transferredAt) : "Awaiting seller",
      completed: transaction.sellerTransferred,
    },
    {
      title: "Buyer Confirmed",
      detail: transaction.buyerConfirmed ? formatDate(transaction.buyerConfirmedAt) : "Awaiting buyer",
      completed: transaction.buyerConfirmed,
    },
    {
      title: "Escrow Released",
      detail: transaction.releasedAt ? formatDate(transaction.releasedAt) : "Pending release",
      completed: Boolean(transaction.releasedAt),
    },
  ];

  return steps;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index} variant="default" padding="md" className="animate-pulse">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="h-24 w-full rounded-lg bg-surface-2 lg:h-24 lg:w-24" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 rounded bg-surface-2" />
              <div className="h-4 w-1/2 rounded bg-surface-2" />
              <div className="h-4 w-2/3 rounded bg-surface-2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TransactionDetailsDrawer({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!transaction || !isOpen) return null;

  const timeline = getTransactionTimeline(transaction);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-hairline bg-surface-1 p-6 text-ink">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Transaction Details</p>
            <h3 className="mt-2 text-2xl font-semibold">{transaction.eventName}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-hairline px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-2"
          >
            Close
          </button>
        </div>

        <Card variant="default" padding="md" className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-24 w-full overflow-hidden rounded-lg bg-surface-2 sm:w-24">
              {transaction.imageUrl ? (
                <img src={transaction.imageUrl} alt={transaction.eventName} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <h4 className="text-lg font-semibold">{transaction.ticketTitle}</h4>
              <p className="text-sm text-ink-muted">{transaction.eventVenue}, {transaction.city}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={getPaymentBadgeStatus(transaction.paymentStatus)} label={transaction.paymentStatus} />
                <StatusBadge status={getEscrowBadgeStatus(transaction.escrowStatus)} label={transaction.escrowStatus.replace(/_/g, " ")} />
                <StatusBadge status={getTransactionBadgeStatus(transaction.transactionStatus)} label={transaction.transactionStatus.replace(/_/g, " ")} />
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card variant="default" padding="md">
            <h4 className="text-lg font-semibold">Ticket Information</h4>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Event</dt><dd className="text-right font-medium">{transaction.eventName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Venue</dt><dd className="text-right font-medium">{transaction.eventVenue}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Date</dt><dd className="text-right font-medium">{formatDate(transaction.eventDate)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Amount</dt><dd className="text-right font-medium">{formatCurrency(transaction.totalAmount)}</dd></div>
            </dl>
          </Card>

          <Card variant="default" padding="md">
            <h4 className="text-lg font-semibold">Payment Information</h4>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Payment Method</dt><dd className="text-right font-medium">{transaction.paymentMethod}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Amount</dt><dd className="text-right font-medium">{formatCurrency(transaction.amount)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Platform Fee</dt><dd className="text-right font-medium">{formatCurrency(transaction.platformFee)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Tax</dt><dd className="text-right font-medium">{formatCurrency(transaction.tax)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Razorpay Order ID</dt><dd className="text-right font-mono text-xs">{transaction.razorpayOrderId || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Razorpay Payment ID</dt><dd className="text-right font-mono text-xs">{transaction.razorpayPaymentId || "—"}</dd></div>
            </dl>
          </Card>
        </div>

        <Card variant="default" padding="md" className="mt-6">
          <h4 className="text-lg font-semibold">Escrow Timeline</h4>
          <div className="mt-4 space-y-4">
            {timeline.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${step.completed ? "bg-primary" : "bg-surface-2"}`} />
                <div className="flex-1 border-b border-hairline pb-3 last:border-b-0">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-ink-muted">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card variant="default" padding="md">
            <h4 className="text-lg font-semibold">Seller Information</h4>
            <p className="mt-4 text-sm text-ink-muted">{transaction.sellerName}</p>
          </Card>
          <Card variant="default" padding="md">
            <h4 className="text-lg font-semibold">Buyer Information</h4>
            <p className="mt-4 text-sm text-ink-muted">{transaction.buyerName}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [escrowFilter, setEscrowFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/transactions");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load transactions");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to load transactions");
      }

      setTransactions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = transactions.filter((transaction) => {
      const searchMatch =
        normalizedSearch.length === 0 ||
        [transaction.eventName, transaction.ticketTitle, transaction.buyerName, transaction.sellerName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const paymentMatch = paymentFilter === "all" || transaction.paymentStatus.toUpperCase() === paymentFilter.toUpperCase();
      const escrowMatch = escrowFilter === "all" || transaction.escrowStatus.toUpperCase() === escrowFilter.toUpperCase();
      const dateMatch = (() => {
        if (dateFilter === "all") return true;
        const createdAt = new Date(transaction.createdAt);
        const now = new Date();

        if (dateFilter === "7d") {
          const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdAt >= cutoff;
        }

        if (dateFilter === "30d") {
          const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return createdAt >= cutoff;
        }

        return true;
      })();

      return searchMatch && paymentMatch && escrowMatch && dateMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      switch (sortBy) {
        case "oldest":
          return dateA - dateB;
        case "highest":
          return b.totalAmount - a.totalAmount;
        case "lowest":
          return a.totalAmount - b.totalAmount;
        case "newest":
        default:
          return dateB - dateA;
      }
    });

    return sorted;
  }, [transactions, search, paymentFilter, escrowFilter, dateFilter, sortBy]);

  const stats = useMemo(() => ({
    total: transactions.length,
    completed: transactions.filter((transaction) => transaction.transactionStatus.toUpperCase() === "COMPLETED").length,
    inProgress: transactions.filter((transaction) => transaction.transactionStatus.toUpperCase() !== "COMPLETED" && transaction.transactionStatus.toUpperCase() !== "CANCELLED").length,
  }), [transactions]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dashboard"
        title="Transactions"
        description="Track every transaction tied to your account in one place."
      />

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" padding="md">
            <p className="text-sm text-ink-muted">Total Transactions</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{stats.total}</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-sm text-ink-muted">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{stats.completed}</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-sm text-ink-muted">In Progress</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{stats.inProgress}</p>
          </Card>
        </div>
      )}

      <Card variant="default" padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-ink">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search event, buyer, seller"
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:min-w-[560px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Escrow Status</label>
              <select
                value={escrowFilter}
                onChange={(event) => setEscrowFilter(event.target.value)}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="waiting_for_buyer_confirmation">Waiting for Buyer</option>
                <option value="released">Released</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Date</label>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Sort By</label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary lg:w-44"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card variant="default" padding="xl" className="text-center">
          <p className="text-2xl font-semibold text-ink">Unable to load transactions</p>
          <p className="mt-3 text-sm text-ink-muted">{error}</p>
          <Button variant="primary" size="md" className="mt-6" onClick={fetchTransactions}>
            Retry
          </Button>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card variant="default" padding="xl" className="text-center">
          <p className="text-2xl font-semibold text-ink">No transactions found.</p>
          <p className="mt-3 text-sm text-ink-muted">Your transaction history will appear here after a purchase or sale.</p>
          <Link href="/tickets" className="mt-6 inline-flex">
            <Button variant="primary" size="md">Browse Tickets</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              variant="default"
              padding="md"
              className="cursor-pointer transition hover:border-primary/40"
              onClick={() => {
                setSelectedTransaction(transaction);
                setIsDrawerOpen(true);
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="h-20 w-full overflow-hidden rounded-lg bg-surface-2 lg:h-20 lg:w-20">
                    {transaction.imageUrl ? (
                      <img src={transaction.imageUrl} alt={transaction.eventName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-ink">{transaction.eventName}</h3>
                      <StatusBadge status={getTransactionBadgeStatus(transaction.transactionStatus)} label={transaction.transactionStatus.replace(/_/g, " ")} />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{transaction.ticketTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink-muted">
                      <span>Buyer: {transaction.buyerName}</span>
                      <span>Seller: {transaction.sellerName}</span>
                      <span>Purchased: {formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 lg:min-w-[280px] lg:items-end">
                  <p className="text-xl font-semibold text-ink">{formatCurrency(transaction.totalAmount)}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={getPaymentBadgeStatus(transaction.paymentStatus)} label={transaction.paymentStatus} />
                    <StatusBadge status={getEscrowBadgeStatus(transaction.escrowStatus)} label={transaction.escrowStatus.replace(/_/g, " ")} />
                  </div>
                  <p className="text-xs text-ink-muted">ID: {transaction.id}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
}
