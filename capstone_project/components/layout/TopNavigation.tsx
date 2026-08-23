"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Bell, Search, User, X } from "lucide-react";
import { useSession } from "next-auth/react";

/**
 * TopNavigation - Reusable top navigation bar with browser-like back/forward navigation
 * 
 * Features:
 * - Back and Forward navigation buttons (browser-like)
 * - Disabled state when no history available
 * - Current page title display
 * - User avatar and notification bell
 * - Dark theme with modern design
 * - Responsive layout
 * - Tooltips on navigation buttons
 */

// History entry type for tracking navigation
interface HistoryEntry {
  pathname: string;
  timestamp: number;
}

export function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Track navigation history
  const [history, setHistory] = useState<HistoryEntry[]>([
    { pathname: "/", timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Use a ref to track the previous pathname to avoid unnecessary history updates
  const previousPathnameRef = useRef(pathname);

  /**
   * Get the current page title from the pathname
   * Converts pathname to a human-readable title
   * @returns Formatted page title
   */
  const getPageTitle = useCallback(() => {
    if (!pathname) return "Home";
    
    // Remove leading/trailing slashes and split by slash
    const segments = pathname.split("/").filter(Boolean);
    
    if (segments.length === 0) return "Home";
    
    // Take the last segment and format it
    const lastSegment = segments[segments.length - 1];
    
    // Convert kebab-case or snake_case to Title Case
    const formatted = lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    
    // Special cases for common routes
    const titleMap: Record<string, string> = {
      "dashboard": "Dashboard",
      "listings": "My Listings",
      "purchases": "My Purchases",
      "sales": "My Sales",
      "wishlist": "Wishlist",
      "transactions": "Transactions",
      "nearby-events": "Nearby Events",
      "messages": "Messages",
      "notifications": "Notifications",
      "profile": "My Profile",
      "tickets": "Browse Tickets",
      "search": "Search",
      "login": "Login",
      "signup": "Sign Up",
    };
    
    return titleMap[lastSegment] || formatted;
  }, [pathname]);

  /**
   * Handle back navigation
   * Navigates to the previous page in history if available
   */
  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      setIsNavigating(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      router.push(history[newIndex].pathname);
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [historyIndex, history, router]);

  /**
   * Handle forward navigation
   * Navigates to the next page in history if available
   */
  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsNavigating(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      router.push(history[newIndex].pathname);
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [historyIndex, history, router]);

  /**
   * Update history when pathname changes
   * Adds new entries and prevents duplicate consecutive entries
   * 
   * Why this prevents infinite loops:
   * - We use a ref (previousPathnameRef) to track the previous pathname
   * - The effect only runs when pathname actually changes (dependency: [pathname])
   * - We compare the current pathname with the ref value to detect actual navigation
   * - If pathname hasn't changed, we return early without calling setHistory
   * - This breaks the cycle: pathname change → setHistory → re-render → effect runs again
   */
  useEffect(() => {
    if (!pathname) return;
    
    // Check if pathname actually changed by comparing with the ref
    if (previousPathnameRef.current === pathname) {
      return; // Don't update history if pathname hasn't changed
    }
    
    // Update the ref to current pathname
    previousPathnameRef.current = pathname;
    
    setHistory((prevHistory) => {
      // Add new entry and trim any forward history
      const newHistory = [...prevHistory.slice(0, -1), { pathname, timestamp: Date.now() }];
      
      // Limit history to 50 entries to prevent memory issues
      if (newHistory.length > 50) {
        return newHistory.slice(newHistory.length - 50);
      }
      
      return newHistory;
    });
  }, [pathname]); // Only depend on pathname to prevent infinite loop

  // Determine if buttons should be disabled
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    const names = session.user.name.split(" ");
    return names.map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    // Skip if no session or user ID
    if (!session?.user?.id) {
      return;
    }

    try {
      setLoadingNotifications(true);
      const response = await fetch("/api/notifications?limit=10", {
        // Add credentials to include cookies if needed
        credentials: "same-origin",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: any) => !n.isRead).length);
        }
      } else if (response.status === 401) {
        // Unauthorized - user not authenticated, skip silently
        console.log("Notifications: User not authenticated");
        setNotifications([]);
        setUnreadCount(0);
      } else if (response.status === 404) {
        // Endpoint not found - log but don't crash
        console.error("Notifications endpoint not found");
        setNotifications([]);
        setUnreadCount(0);
      } else {
        // Other errors
        console.error(`Failed to fetch notifications: ${response.status}`);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Network error or other issues - log but don't crash
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    // Only start polling if we have a valid session with user ID
    if (session?.user?.id) {
      fetchNotifications();
      
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [session?.user?.id]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
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

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-hairline bg-surface-1 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-8">
        
        {/* Left Section - Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Back Button */}
          <button
            onClick={handleBack}
            disabled={!canGoBack || isNavigating}
            title="Back"
            className={`
              group relative flex h-10 w-10 items-center justify-center
              rounded-full transition-all duration-200
              ${canGoBack && !isNavigating
                ? 'bg-surface-0 text-ink hover:bg-primary hover:text-on-primary hover:scale-110 active:scale-95'
                : 'bg-surface-0/50 text-ink-muted cursor-not-allowed opacity-50'
              }
            `}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            
            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
              Back
            </span>
          </button>

          {/* Forward Button */}
          <button
            onClick={handleForward}
            disabled={!canGoForward || isNavigating}
            title="Forward"
            className={`
              group relative flex h-10 w-10 items-center justify-center
              rounded-full transition-all duration-200
              ${canGoForward && !isNavigating
                ? 'bg-surface-0 text-ink hover:bg-primary hover:text-on-primary hover:scale-110 active:scale-95'
                : 'bg-surface-0/50 text-ink-muted cursor-not-allowed opacity-50'
              }
            `}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            
            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
              Forward
            </span>
          </button>
        </div>

        {/* Center Section - Page Title and Search */}
        <div className="hidden lg:flex flex-1 items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink truncate max-w-xs">
              {getPageTitle()}
            </h1>
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search dashboard..."
              className="w-full rounded-full border border-hairline bg-surface-0 py-2.5 pl-10 pr-4 text-sm text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-0 text-ink transition-all duration-200 hover:bg-primary hover:text-on-primary hover:scale-110 active:scale-95"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-semantic-error text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              
              {/* Tooltip */}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
                Notifications
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-1 border border-hairline rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-hairline">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-ink-muted hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[400px]">
                  {loadingNotifications ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                      <p className="text-sm text-ink-muted">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-hairline">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          onClick={() => {
                            handleMarkAsRead(notification._id);
                            if (notification.link) {
                              router.push(notification.link);
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-3 cursor-pointer hover:bg-surface-2 transition-colors ${
                            !notification.isRead ? "bg-surface-2/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 text-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-ink truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-ink-muted line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-ink-tertiary mt-1">
                                    {getTimeAgo(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-hairline">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-sm text-primary hover:text-primary-hover font-medium"
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <button
            title={session?.user?.name || "User Profile"}
            className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-on-primary transition-all duration-200 hover:scale-110 active:scale-95 ring-2 ring-transparent hover:ring-primary/50"
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getUserInitials()}</span>
            )}
            
            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-canvas opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
              {session?.user?.name || "User Profile"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}