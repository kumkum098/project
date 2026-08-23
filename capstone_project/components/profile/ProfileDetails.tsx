"use client";

import { Mail, Phone, MapPin, User, Calendar } from "lucide-react";

/**
 * Profile Details Component
 * Displays user information in a grid layout
 */

interface ProfileDetailsProps {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  memberSince: string;
}

export function ProfileDetails({
  name,
  email,
  username,
  phone,
  city,
  state,
  country,
  memberSince,
}: ProfileDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLocationString = () => {
    const parts = [city, state, country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not specified";
  };

  return (
    <div className="bg-surface-1 rounded-lg border border-hairline p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-ink mb-6">Profile Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <User className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Full Name</p>
            <p className="text-sm font-medium text-ink break-words">{name}</p>
          </div>
        </div>

        {/* Username */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <User className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Username</p>
            <p className="text-sm font-medium text-ink break-words">
              {username || "Not set"}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <Mail className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Email Address</p>
            <p className="text-sm font-medium text-ink break-words">{email}</p>
            <p className="text-xs text-ink-tertiary mt-1">Cannot be changed</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <Phone className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Phone Number</p>
            <p className="text-sm font-medium text-ink break-words">
              {phone || "Not provided"}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3 md:col-span-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Location</p>
            <p className="text-sm font-medium text-ink break-words">
              {getLocationString()}
            </p>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-start gap-3 md:col-span-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">Member Since</p>
            <p className="text-sm font-medium text-ink">{formatDate(memberSince)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}