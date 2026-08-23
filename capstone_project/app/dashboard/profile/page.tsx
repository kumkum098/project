"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

/**
 * User Profile interface
 */
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  profilePicture?: string;
  role: string;
  trustScore: number;
  verificationStatus?: string;
  memberSince: string;
}

/**
 * Profile Stats interface
 */
interface ProfileStatsData {
  ticketsListed: number;
  ticketsPurchased: number;
  ticketsSold: number;
  wishlistCount: number;
  averageRating: number;
  trustScore: number;
}

/**
 * Profile Page
 * Displays user profile information with edit functionality
 */

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Fetch profile data
  const fetchProfile = async () => {
    if (authStatus !== "authenticated") return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.message || "Failed to load profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user stats
  const fetchStats = async () => {
    if (authStatus !== "authenticated" || !session?.user?.id) return;

    try {
      // Fetch stats from multiple endpoints
      const [listingsRes, purchasesRes, salesRes, wishlistRes] = await Promise.all([
        fetch("/api/tickets/my-listings"),
        fetch("/api/transactions/my-purchases"),
        fetch("/api/transactions/my-sales"),
        fetch("/api/saved-events"),
      ]);

      const listingsData = listingsRes.ok ? await listingsRes.json() : { success: false, data: [] };
      const purchasesData = purchasesRes.ok ? await purchasesRes.json() : { success: false, data: [] };
      const salesData = salesRes.ok ? await salesRes.json() : { success: false, data: [] };
      const wishlistData = wishlistRes.ok ? await wishlistRes.json() : { success: false, data: [] };

      // Calculate average rating (placeholder - would come from reviews)
      const averageRating = 4.5; // This would be calculated from actual reviews

      setStats({
        ticketsListed: listingsData.success ? listingsData.data.length : 0,
        ticketsPurchased: purchasesData.success ? purchasesData.data.length : 0,
        ticketsSold: salesData.success ? salesData.data.length : 0,
        wishlistCount: wishlistData.success ? wishlistData.data.length : 0,
        averageRating,
        trustScore: profile?.trustScore || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfile();
    }
  }, [authStatus, session]);

  // Fetch stats after profile is loaded
  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  // Handle profile update success
  const handleProfileUpdate = async () => {
    try {
      // Fetch updated profile data
      await fetchProfile();
      await fetchStats();
      
      // Only show success message after data is fetched
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      // If fetching updated data fails, show error
      setError(err instanceof Error ? err.message : "Failed to reload profile after update");
      setSuccessMessage(null);
    }
  };

  // Loading state
  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
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
            <h2 className="text-2xl font-bold text-ink mb-2">Unable to Load Profile</h2>
            <p className="text-ink-muted mb-6">{error}</p>
            <button
              onClick={fetchProfile}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or no profile
  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">My Profile</h1>
            <p className="text-ink-muted">Manage your account settings and preferences</p>
          </div>
          <button
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-semantic-success/10 border border-semantic-success/20 rounded-lg p-4 text-sm text-semantic-success">
            {successMessage}
          </div>
        )}

        {/* Profile Content */}
        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            name={profile.name}
            email={profile.email}
            profilePicture={profile.profilePicture}
            role={profile.role}
            trustScore={profile.trustScore}
            verificationStatus={profile.verificationStatus}
          />

          {/* Profile Stats */}
          {stats && (
            <ProfileStats
              ticketsListed={stats.ticketsListed}
              ticketsPurchased={stats.ticketsPurchased}
              ticketsSold={stats.ticketsSold}
              wishlistCount={stats.wishlistCount}
              averageRating={stats.averageRating}
              trustScore={stats.trustScore}
            />
          )}

          {/* Profile Details */}
          <ProfileDetails
            name={profile.name}
            email={profile.email}
            username={profile.username}
            phone={profile.phone}
            city={profile.city}
            state={profile.state}
            country={profile.country}
            memberSince={profile.memberSince}
          />
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleProfileUpdate}
        profile={{
          name: profile.name,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          profilePicture: profile.profilePicture,
        }}
      />
    </div>
  );
}