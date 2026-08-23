"use client";

import { User } from "lucide-react";

/**
 * Profile Header Component
 * Displays user avatar, name, and role
 */

interface ProfileHeaderProps {
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  trustScore: number;
  verificationStatus?: string;
}

export function ProfileHeader({
  name,
  email,
  profilePicture,
  role,
  trustScore,
  verificationStatus,
}: ProfileHeaderProps) {
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "BUYER":
        return "Buyer";
      case "SELLER":
        return "Seller";
      case "ADMIN":
        return "Admin";
      default:
        return role;
    }
  };

  // Get verification status color
  const getVerificationColor = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return "text-semantic-success";
      case "REJECTED":
        return "text-semantic-error";
      case "PENDING":
        return "text-semantic-warning";
      default:
        return "text-ink-muted";
    }
  };

  return (
    <div className="bg-surface-1 rounded-lg border border-hairline p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-3xl font-bold text-on-primary border-4 border-primary/20">
              {getInitials(name)}
            </div>
          )}
          
          {/* Trust Score Badge */}
          <div className="absolute -bottom-2 -right-2 bg-surface-2 border-2 border-surface-1 rounded-full px-3 py-1">
            <span className="text-xs font-semibold text-primary">{trustScore}</span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">{name}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-ink-muted">
            <span className="flex items-center justify-center sm:justify-start gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {email}
            </span>
            
            <span className="hidden sm:inline">•</span>
            
            <span className="flex items-center justify-center sm:justify-start gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {getRoleDisplay(role)}
            </span>
          </div>

          {/* Verification Status */}
          {verificationStatus && (
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                verificationStatus === "APPROVED"
                  ? "bg-semantic-success/10 text-semantic-success"
                  : verificationStatus === "REJECTED"
                  ? "bg-semantic-error/10 text-semantic-error"
                  : "bg-semantic-warning/10 text-semantic-warning"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {verificationStatus === "APPROVED"
                  ? "Verified"
                  : verificationStatus === "REJECTED"
                  ? "Verification Rejected"
                  : "Verification Pending"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}