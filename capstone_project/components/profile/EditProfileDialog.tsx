"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

/**
 * Edit Profile Dialog Component
 * Allows users to edit their profile information
 */

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: {
    name: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    profilePicture?: string;
  };
}

export function EditProfileDialog({
  isOpen,
  onClose,
  onSuccess,
  profile,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone || "",
    city: profile.city || "",
    state: profile.state || "",
    country: profile.country || "",
    profilePicture: profile.profilePicture || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when profile changes
  useEffect(() => {
    setFormData({
      name: profile.name,
      phone: profile.phone || "",
      city: profile.city || "",
      state: profile.state || "",
      country: profile.country || "",
      profilePicture: profile.profilePicture || "",
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("📤 [EditProfile] Request payload:", formData);
      
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("📥 [EditProfile] API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      console.log("✅ [EditProfile] Profile updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ [EditProfile] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-lg border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline">
          <h2 className="text-xl font-semibold text-ink">Edit Profile</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-semantic-error/10 border border-semantic-error/20 rounded-lg p-4 text-sm text-semantic-error">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
              Full Name <span className="text-semantic-error">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your city"
            />
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-ink mb-2">
              State
            </label>
            <input
              type="text"
              id="state"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your state"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-ink mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your country"
            />
          </div>

          {/* Profile Picture URL */}
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-ink mb-2">
              Profile Picture URL
            </label>
            <input
              type="url"
              id="profilePicture"
              value={formData.profilePicture}
              onChange={(e) => handleChange("profilePicture", e.target.value)}
              className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/profile.jpg"
            />
            <p className="text-xs text-ink-muted mt-1">
              Enter a URL for your profile picture
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 bg-surface-2 hover:bg-hairline text-ink font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}