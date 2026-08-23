"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Force dynamic rendering to avoid SSR issues with useSession
export const dynamic = 'force-dynamic';

import { Card } from "@/components/Card";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Analytics data interfaces
 */
interface OverviewStats {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalTickets: number;
  activeListings: number;
  soldTickets: number;
  pendingTransactions: number;
  completedTransactions: number;
  disputedTransactions: number;
  totalRevenue: number;
  platformRevenue: number;
  averageTicketPrice: number;
  averageTrustScore: number;
}

interface ChartData {
  monthlySales: any[];
  categoryStats: any[];
  transactionStatusStats: any[];
  userGrowth: any[];
}

interface TopSeller {
  name: string;
  email: string;
  trustScore: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

interface PopularEvent {
  eventName: string;
  views: number;
  savedCount: number;
  ticketsSold: number;
}

interface Activity {
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

type DateFilter = "7" | "30" | "90" | "365" | "custom";

/**
 * Admin Analytics Dashboard Page
 * 
 * Displays comprehensive analytics and insights about marketplace performance.
 */

export default function AdminAnalyticsPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  
  // Prevent SSR issues with useSession
  if (status === "loading" && typeof window === 'undefined') {
    return null;
  }
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("30");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [popularEvents, setPopularEvents] = useState<PopularEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (status !== "authenticated" || session?.user?.role !== "ADMIN") return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/analytics?dateFilter=${dateFilter}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      if (data.success) {
        setOverview(data.data.overview);
        setCharts(data.data.charts);
        setTopSellers(data.data.topSellers);
        setPopularEvents(data.data.popularEvents);
        setRecentActivity(data.data.recentActivity);
      } else {
        throw new Error(data.message || "Failed to load analytics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [status, session, dateFilter]);

  // Export functions
  const exportCSV = () => {
    if (!overview) return;
    
    const csvContent = [
      ["Metric", "Value"],
      ["Total Users", overview.totalUsers],
      ["Total Buyers", overview.totalBuyers],
      ["Total Sellers", overview.totalSellers],
      ["Total Tickets", overview.totalTickets],
      ["Active Listings", overview.activeListings],
      ["Sold Tickets", overview.soldTickets],
      ["Total Revenue", `$${overview.totalRevenue.toFixed(2)}`],
      ["Platform Revenue", `$${overview.platformRevenue.toFixed(2)}`],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportPDF = () => {
    window.print();
  };

  const printReport = () => {
    window.print();
  };

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
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
  if (!session || session.user.role !== "ADMIN" || !overview) {
    return null;
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TICKET_LISTED": return "🎫";
      case "PURCHASE": return "💰";
      case "REVIEW": return "⭐";
      case "VERIFICATION": return "✔️";
      default: return "📊";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">Marketplace performance insights</p>
          </div>
          
          {/* Filters and Export */}
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Export PDF</span>
            </button>
            
            <button
              onClick={printReport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={formatNumber(overview.totalUsers)}
            icon="👥"
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Total Tickets"
            value={formatNumber(overview.totalTickets)}
            icon="🎫"
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="Active Listings"
            value={formatNumber(overview.activeListings)}
            icon="✅"
            trend="+5%"
            trendUp={true}
          />
          <StatCard
            title="Completed Sales"
            value={formatNumber(overview.completedTransactions)}
            icon="💰"
            trend="+15%"
            trendUp={true}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            icon="💵"
            trend="+22%"
            trendUp={true}
          />
          <StatCard
            title="Platform Revenue"
            value={formatCurrency(overview.platformRevenue)}
            icon="🏦"
            trend="+18%"
            trendUp={true}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Line Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h3>
            {charts?.monthlySales && charts.monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#3B82F6" name="Sales" />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </Card>

          {/* Ticket Categories Pie Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Categories</h3>
            {charts?.categoryStats && charts.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {charts.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </Card>

          {/* Revenue Bar Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
            {charts?.monthlySales && charts.monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </Card>

          {/* Transaction Status Doughnut Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h3>
            {charts?.transactionStatusStats && charts.transactionStatusStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.transactionStatusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {charts.transactionStatusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </Card>

          {/* User Growth Area Chart */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            {charts?.userGrowth && charts.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#93C5FD" name="New Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
            )}
          </Card>
        </div>

        {/* Top Sellers and Popular Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Sellers */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Sellers</h3>
            {topSellers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trust</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topSellers.map((seller, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                            <div className="text-xs text-gray-500">{seller.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{seller.trustScore}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(seller.totalSales)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(seller.totalRevenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">⭐ {seller.averageRating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No data available</div>
            )}
          </Card>

          {/* Popular Events */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Events</h3>
            {popularEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Saved</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {popularEvents.map((event, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.eventName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(event.views)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(event.savedCount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(event.ticketsSold)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No data available</div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      By {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No recent activity</div>
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-xs mt-2 ${trendUp ? "text-green-600" : "text-red-600"}`}>
            {trend} from last period
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );
}