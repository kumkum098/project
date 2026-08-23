"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

// Force dynamic rendering to avoid SSR issues with useSession
export const dynamic = 'force-dynamic';

/**
 * Admin Dashboard Page
 * 
 * Displays overview statistics for the admin verification system.
 * Shows key metrics about ticket verifications, listings, and marketplace health.
 */

interface DashboardStats {
  pendingVerifications: number;
  verifiedTickets: number;
  rejectedTickets: number;
  activeListings: number;
  fakeListingsRemoved: number;
  totalUsers: number;
  ticketsVerifiedToday: number;
  averageVerificationTime: number;
  approvalRate: number;
  rejectionRate: number;
}

export default function AdminDashboardPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/admin/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard statistics");
        }

        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.message || "Failed to load statistics");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status, session]);

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
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
  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage ticket verifications across the marketplace
          </p>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Verifications */}
          <Link href="/admin/verifications?filter=pending">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {stats?.pendingVerifications || 0}
                  </p>
                </div>
                <div className="text-yellow-600 text-4xl">⏳</div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Click to review pending tickets</p>
            </Card>
          </Link>

          {/* Verified Tickets */}
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Tickets</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.verifiedTickets || 0}
                </p>
              </div>
              <div className="text-green-600 text-4xl">✅</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Successfully verified listings</p>
          </Card>

          {/* Rejected Tickets */}
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected Tickets</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.rejectedTickets || 0}
                </p>
              </div>
              <div className="text-red-600 text-4xl">❌</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Removed from marketplace</p>
          </Card>

          {/* Active Listings */}
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats?.activeListings || 0}
                </p>
              </div>
              <div className="text-blue-600 text-4xl">🎫</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Currently available tickets</p>
          </Card>

          {/* Fake Listings Removed */}
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fake Listings Removed</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats?.fakeListingsRemoved || 0}
                </p>
              </div>
              <div className="text-purple-600 text-4xl">🛡️</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Protecting marketplace integrity</p>
          </Card>

          {/* Total Marketplace Users */}
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Marketplace Users</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="text-indigo-600 text-4xl">👥</div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Registered users</p>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Performance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="text-green-600 text-2xl mr-3">✓</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tickets Verified Today</p>
                    <p className="text-xs text-gray-600">Successfully approved</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.ticketsVerifiedToday || 0}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="text-blue-600 text-2xl mr-3">⏱️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Average Verification Time</p>
                    <p className="text-xs text-gray-600">Time to process each ticket</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.averageVerificationTime || 0}m
                </p>
              </div>
            </div>
          </Card>

          {/* Approval/Rejection Rates */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Rates</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {stats?.approvalRate || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${stats?.approvalRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Rejection Rate</span>
                  <span className="text-sm font-bold text-red-600">
                    {stats?.rejectionRate || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{ width: `${stats?.rejectionRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/verifications?filter=pending">
              <div className="p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors cursor-pointer">
                <div className="text-yellow-600 text-2xl mb-2">⏳</div>
                <p className="font-medium text-gray-900">Review Pending</p>
                <p className="text-xs text-gray-600 mt-1">
                  {stats?.pendingVerifications || 0} tickets waiting
                </p>
              </div>
            </Link>

            <Link href="/admin/verifications?filter=verified">
              <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer">
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <p className="font-medium text-gray-900">View Verified</p>
                <p className="text-xs text-gray-600 mt-1">
                  {stats?.verifiedTickets || 0} approved tickets
                </p>
              </div>
            </Link>

            <Link href="/admin/verifications?filter=rejected">
              <div className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                <div className="text-red-600 text-2xl mb-2">❌</div>
                <p className="font-medium text-gray-900">View Rejected</p>
                <p className="text-xs text-gray-600 mt-1">
                  {stats?.rejectedTickets || 0} rejected tickets
                </p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}