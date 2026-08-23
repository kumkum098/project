"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Ticket, 
  ShoppingCart, 
  DollarSign, 
  Heart, 
  Package, 
  MapPin, 
  MessageSquare, 
  Bell, 
  User, 
  Shield,
  CheckCircle,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

/**
 * DashboardSidebar - Reusable navigation sidebar for dashboard pages
 * 
 * Features:
 * - Responsive design (desktop/tablet/mobile)
 * - Active route highlighting
 * - Admin section (only visible to ADMIN users)
 * - Collapsible on tablet
 * - Hidden by default on mobile with hamburger menu
 */

// Navigation item type
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

// Main navigation items
const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Browse Tickets", href: "/tickets", icon: Ticket },
  { name: "My Listings", href: "/dashboard/my-listings", icon: Ticket },
  { name: "My Purchases", href: "/dashboard/purchases", icon: ShoppingCart },
  { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { name: "Transactions", href: "/dashboard/transactions", icon: Package },
  { name: "Nearby Events", href: "/nearby-events", icon: MapPin },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield, adminOnly: true },
  { name: "Ticket Verification", href: "/admin/verifications", icon: CheckCircle, adminOnly: true },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, adminOnly: true },
  { name: "User Management", href: "/admin/users", icon: Users, adminOnly: true },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(false);

  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Filter navigation items based on user role
  const filteredMainNav = mainNavItems.filter(item => !item.adminOnly || isAdmin);
  const filteredAdminNav = adminNavItems.filter(item => item.adminOnly && isAdmin);

  /**
   * Checks if a navigation item is active
   * @param href - The href to check
   * @returns True if the current pathname matches the href
   */
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/tickets") {
      return pathname.startsWith("/tickets");
    }
    return pathname.startsWith(href);
  };

  /**
   * Handles mobile menu toggle
   */
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  /**
   * Handles tablet collapse toggle
   */
  const toggleTabletCollapse = () => {
    setIsTabletCollapsed(!isTabletCollapsed);
  };

  /**
   * Handles logout
   */
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-surface-1 border border-hairline text-ink hover:bg-surface-0 transition"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-72 flex-shrink-0 h-screen
          md:static md:translate-x-0
          ${isTabletCollapsed ? 'md:w-20' : 'md:w-72'}
          bg-surface-1 border-r border-hairline
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-hairline">
          {!isTabletCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink">TicketSwap</h1>
                <p className="text-xs text-ink-muted">Marketplace</p>
              </div>
            </div>
          )}
          {isTabletCollapsed && (
            <div className="mx-auto">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Ticket className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
          
          {/* Tablet Collapse Button */}
          <button
            onClick={toggleTabletCollapse}
            className="hidden md:block p-2 rounded-md hover:bg-surface-0 transition"
          >
            {isTabletCollapsed ? (
              <Menu className="h-5 w-5 text-ink-muted" />
            ) : (
              <X className="h-5 w-5 text-ink-muted" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isTabletCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Main Menu
              </h3>
            )}
            {filteredMainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-all duration-200
                    ${active 
                      ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' 
                      : 'text-ink-muted hover:bg-surface-0 hover:text-ink border-l-4 border-transparent'
                    }
                    ${isTabletCollapsed ? 'justify-center' : ''}
                  `}
                  title={isTabletCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isTabletCollapsed && (
                    <span className="text-sm">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Navigation */}
          {isAdmin && filteredAdminNav.length > 0 && (
            <div className="space-y-1">
              {!isTabletCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                  Admin Section
                </h3>
              )}
              {filteredAdminNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-md
                      transition-all duration-200
                      ${active 
                        ? 'bg-red-500/10 text-red-600 border-l-4 border-red-600 font-semibold' 
                        : 'text-ink-muted hover:bg-surface-0 hover:text-ink border-l-4 border-transparent'
                      }
                      ${isTabletCollapsed ? 'justify-center' : ''}
                    `}
                    title={isTabletCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isTabletCollapsed && (
                      <span className="text-sm">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom Section - Logout */}
        <div className="p-4 border-t border-hairline">
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-md
              text-ink-muted hover:bg-semantic-error/10 hover:text-semantic-error
              transition-all duration-200 w-full
              ${isTabletCollapsed ? 'justify-center' : ''}
            `}
            title={isTabletCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isTabletCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}