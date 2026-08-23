"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Card } from "@/components/Card";
import { NotificationType } from "@/models/Notification";

/**
 * Notification interface
 */
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  senderName?: string;
}

/**
 * Filter type for notifications
 */
type FilterType = "all" | "unread" | "purchases" | "sales" | "escrow" | "reviews" | "disputes" | "verification";

/**
 * Notification Center Page
 * 
 * Displays all notifications organized by time period.
 * Supports filtering by type and read status.
 */

export default function NotificationsPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 20;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (status !== "authenticated" || !session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("skip", (page * limit).toString());

      if (filter === "unread") {
        params.append("unreadOnly", "true");
      } else if (filter !== "all") {
        const typeMap: Record<string, string> = {
          purchases: "PURCHASE",
          sales: "SALE",
          escrow: "ESCROW",
          reviews: "REVIEW",
          disputes: "DISPUTE",
          verification: "VERIFICATION",
        };
        const type = typeMap[filter];
        if (type) {
          params.append("type", type);
        }
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (data.success) {
        if (page === 0) {
          setNotifications(data.data);
        } else {
          setNotifications((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.hasMore);
      } else {
        throw new Error(data.message || "Failed to load notifications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications when filter or page changes
  useEffect(() => {
    fetchNotifications();
  }, [status, session, filter, page]);

  // Group notifications by time period
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      unread: [],
      today: [],
      yesterday: [],
      earlier: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    notifications.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);

      // Add to unread group first
      if (!notification.isRead) {
        groups.unread.push(notification);
      }

      // Then group by time
      if (createdAt >= todayStart) {
        groups.today.push(notification);
      } else if (createdAt >= yesterdayStart) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "💰";
      case "SALE":
        return "✅";
      case "PAYMENT":
        return "💳";
      case "ESCROW":
        return "🔒";
      case "REVIEW":
        return "⭐";
      case "VERIFICATION":
        return "✔️";
      case "DISPUTE":
        return "⚠️";
      case "SYSTEM":
        return "📢";
      default:
        return "📬";
    }
  };

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="max-w-md">
          <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-semantic-error/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">Unable to Load Notifications</h2>
            <p className="text-ink-muted mb-6">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">Notifications</h1>
          <p className="text-ink-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface-1 rounded-lg border border-hairline p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setFilter("all");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => {
                setFilter("purchases");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "purchases"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Purchases
            </button>
            <button
              onClick={() => {
                setFilter("sales");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "sales"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => {
                setFilter("escrow");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "escrow"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Escrow
            </button>
            <button
              onClick={() => {
                setFilter("reviews");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "reviews"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => {
                setFilter("disputes");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "disputes"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => {
                setFilter("verification");
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "verification"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-ink-muted hover:text-ink border border-hairline"
              }`}
            >
              Verification
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="mt-4 pt-4 border-t border-hairline">
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-full mb-4">
              <Bell className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">No notifications yet</h3>
            <p className="text-ink-muted">
              {filter === "all"
                ? "You don't have any notifications yet"
                : "No notifications match the selected filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unread Section */}
            {groupedNotifications.unread.length > 0 && filter === "all" && (
              <div>
                <h2 className="text-lg font-semibold text-ink mb-4">Unread</h2>
                <div className="space-y-3">
                  {groupedNotifications.unread.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today Section */}
            {groupedNotifications.today.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-ink mb-4">Today</h2>
                <div className="space-y-3">
                  {groupedNotifications.today.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday Section */}
            {groupedNotifications.yesterday.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-ink mb-4">Yesterday</h2>
                <div className="space-y-3">
                  {groupedNotifications.yesterday.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier Section */}
            {groupedNotifications.earlier.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-ink mb-4">Earlier</h2>
                <div className="space-y-3">
                  {groupedNotifications.earlier.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Notification Card Component
 */
function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  router,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => string;
  router: any;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(notification._id);
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      await onMarkAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      onClick={handleClick}
      className={`bg-surface-1 rounded-lg border border-hairline p-4 cursor-pointer transition-all duration-200 hover:border-hairline-strong ${
        notification.isRead ? "opacity-75" : "border-l-4 border-l-primary"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">{getIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">{notification.title}</h3>
              <p className="text-sm text-ink-muted mt-1">{notification.message}</p>
              <p className="text-xs text-ink-tertiary mt-2">{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notification.isRead && (
                <span className="inline-flex items-center justify-center w-2 h-2 bg-primary rounded-full" title="Unread" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="text-ink-muted hover:text-semantic-error transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format time ago
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}