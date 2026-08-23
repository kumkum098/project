"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import {
  Bell,
  Lock,
  Moon,
  Shield,
  Trash2,
  User,
  Link as LinkIcon,
  EyeOff,
} from "lucide-react";

const fieldLabel = "text-sm font-medium text-ink mb-2";
const fieldInput =
  "w-full rounded-2xl border border-hairline bg-canvas px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

// Settings type definition
interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  appearance: {
    theme: "dark" | "light" | "system";
    layoutDensity: "comfortable" | "compact";
  };
  privacy: {
    profileVisibility: "public" | "private" | "connections";
    searchVisibility: boolean;
    allowDataSharing: boolean;
  };
  security: {
    twoFactorAuth: "disabled" | "sms" | "authenticator";
    sessionTimeout: "never" | "15min" | "30min" | "1hour";
  };
}

// Form data type
interface FormData {
  // Account
  name: string;
  email: string;
  username: string;
  phone: string;
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  // Security
  twoFactorAuth: string;
  sessionTimeout: string;
  // Privacy
  profileVisibility: string;
  searchVisibility: string;
  allowDataSharing: boolean;
  // Appearance
  theme: string;
  layoutDensity: string;
}

export function SettingsClient() {
  const { data: session, status: authStatus } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    username: "",
    phone: "",
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: "disabled",
    sessionTimeout: "never",
    profileVisibility: "public",
    searchVisibility: "visible",
    allowDataSharing: false,
    theme: "system",
    layoutDensity: "comfortable",
  });

  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Fetch settings on load
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.id) {
      fetchSettings();
    } else if (authStatus === "unauthenticated") {
      setIsLoading(false);
    }
  }, [authStatus, session]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      console.log("=== CLIENT SETTINGS FETCH DEBUG ===");
      console.log("Fetching settings from API...");

      // Fetch user profile and settings in parallel
      const [profileResponse, settingsResponse] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/settings")
      ]);

      console.log("Profile response status:", profileResponse.status);
      console.log("Settings response status:", settingsResponse.status);

      if (!profileResponse.ok || !settingsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const profileData = await profileResponse.json();
      const settingsData = await settingsResponse.json();

      console.log("Profile data:", JSON.stringify(profileData, null, 2));
      console.log("Settings data:", JSON.stringify(settingsData, null, 2));

      if (profileData.success && settingsData.success) {
        const settings: Settings = settingsData.data;
        
        const newFormData: FormData = {
          name: profileData.data.name || "",
          email: profileData.data.email || "",
          username: profileData.data.username || "",
          phone: profileData.data.phone || "",
          emailNotifications: settings.notifications?.email ?? true,
          pushNotifications: settings.notifications?.push ?? true,
          twoFactorAuth: settings.security?.twoFactorAuth || "disabled",
          sessionTimeout: settings.security?.sessionTimeout || "never",
          profileVisibility: settings.privacy?.profileVisibility || "public",
          searchVisibility: settings.privacy?.searchVisibility ? "visible" : "hidden",
          allowDataSharing: settings.privacy?.allowDataSharing ?? false,
          theme: settings.appearance?.theme || "system",
          layoutDensity: settings.appearance?.layoutDensity || "comfortable",
        };

        console.log("Form data populated:", JSON.stringify(newFormData, null, 2));
        console.log("=== END CLIENT SETTINGS FETCH DEBUG ===");

        setFormData(newFormData);
        setOriginalData(newFormData);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setErrorMessage("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!hasChanges || isSaving) return;

    try {
      setIsSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // Prepare settings payload
      const settingsPayload = {
        notifications: {
          email: formData.emailNotifications,
          push: formData.pushNotifications,
        },
        appearance: {
          theme: formData.theme,
          layoutDensity: formData.layoutDensity,
        },
        privacy: {
          profileVisibility: formData.profileVisibility,
          searchVisibility: formData.searchVisibility === "visible",
          allowDataSharing: formData.allowDataSharing,
        },
        security: {
          twoFactorAuth: formData.twoFactorAuth,
          sessionTimeout: formData.sessionTimeout,
        },
      };

      console.log("=== CLIENT SETTINGS SAVE DEBUG ===");
      console.log("Saving settings payload:", JSON.stringify(settingsPayload, null, 2));
      console.log("Has changes:", hasChanges);
      console.log("Is saving:", isSaving);

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsPayload),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        console.error("Save failed:", data.message || "Failed to save settings");
        throw new Error(data.message || "Failed to save settings");
      }

      console.log("Settings saved successfully to database");
      
      // Update original data to reflect saved state
      setOriginalData(formData);
      setSuccessMessage("Settings saved successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="space-y-8">
          <div className="rounded-3xl border border-hairline bg-surface-1 p-6 md:p-8">
            <div className="mb-4 flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-muted">
                  Account Settings
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  Settings
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Control your account preferences, security, notifications, privacy,
                  and appearance from one place.
                </p>
              </div>
            </div>

            {/* Loading Skeleton */}
            <div className="space-y-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="rounded-3xl border border-hairline bg-canvas/50 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 bg-surface-2 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-surface-2 rounded w-1/3"></div>
                      <div className="h-4 bg-surface-2 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-surface-2 rounded w-1/4"></div>
                        <div className="h-12 bg-surface-2 rounded-2xl"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="space-y-8">
        <div className="rounded-3xl border border-hairline bg-surface-1 p-6 md:p-8">
          <div className="mb-4 flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-muted">
                Account Settings
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                Control your account preferences, security, notifications, privacy,
                and appearance from one place.
              </p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4 rounded-3xl border border-hairline bg-canvas/50 p-6">
              <div className="flex items-center gap-3 text-ink">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Account Settings</h2>
                  <p className="text-sm text-ink-muted">
                    Update your profile details and contact information.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className={fieldLabel}>Full Name</span>
                  <input
                    className={fieldInput}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Alex Harper"
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>Email Address</span>
                  <input
                    className={fieldInput}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="alex@example.com"
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>Username</span>
                  <input
                    className={fieldInput}
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="alexhpr"
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>Phone Number</span>
                  <input
                    className={fieldInput}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-6 rounded-3xl border border-hairline bg-canvas/50 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Security</h2>
                    <p className="text-sm text-ink-muted">
                      Keep your account safe with strong credentials and verification.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className={fieldLabel}>Current Password</span>
                    <input className={fieldInput} type="password" placeholder="••••••••" />
                  </label>
                  <label className="space-y-2">
                    <span className={fieldLabel}>New Password</span>
                    <input className={fieldInput} type="password" placeholder="••••••••" />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className={fieldLabel}>Two-Factor Authentication</span>
                    <select
                      className={fieldInput}
                      value={formData.twoFactorAuth}
                      onChange={(e) => handleInputChange("twoFactorAuth", e.target.value)}
                    >
                      <option value="disabled">Disabled</option>
                      <option value="sms">SMS</option>
                      <option value="authenticator">Authenticator App</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={fieldLabel}>Session Timeout</span>
                    <select
                      className={fieldInput}
                      value={formData.sessionTimeout}
                      onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                    >
                      <option value="never">Never</option>
                      <option value="15min">15 minutes</option>
                      <option value="30min">30 minutes</option>
                      <option value="1hour">1 hour</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="space-y-6 rounded-3xl border border-hairline bg-canvas/50 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-sm text-ink-muted">
                      Manage how you receive alerts and important activity updates.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex flex-col gap-2 rounded-2xl border border-hairline bg-surface-1 p-4">
                    <span className="text-sm font-medium text-ink">Product Updates</span>
                    <span className="text-sm text-ink-muted">
                      Receive the latest news about ticket releases and product updates.
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.emailNotifications}
                        onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                        className="h-4 w-4 rounded border-hairline bg-canvas text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-ink">Email notifications</span>
                    </div>
                  </label>
                  <label className="flex flex-col gap-2 rounded-2xl border border-hairline bg-surface-1 p-4">
                    <span className="text-sm font-medium text-ink">Security Alerts</span>
                    <span className="text-sm text-ink-muted">
                      Get notified when there is unusual activity on your account.
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.pushNotifications}
                        onChange={(e) => handleInputChange("pushNotifications", e.target.checked)}
                        className="h-4 w-4 rounded border-hairline bg-canvas text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-ink">Push notifications</span>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-6 rounded-3xl border border-hairline bg-canvas/50 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Privacy</h2>
                    <p className="text-sm text-ink-muted">
                      Choose what others can see and how your data is shared.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="space-y-2">
                    <span className={fieldLabel}>Profile Visibility</span>
                    <select
                      className={fieldInput}
                      value={formData.profileVisibility}
                      onChange={(e) => handleInputChange("profileVisibility", e.target.value)}
                    >
                      <option value="public">Public</option>
                      <option value="private">Only Me</option>
                      <option value="connections">Connections Only</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={fieldLabel}>Search Privacy</span>
                    <select
                      className={fieldInput}
                      value={formData.searchVisibility}
                      onChange={(e) => handleInputChange("searchVisibility", e.target.value)}
                    >
                      <option value="visible">Visible to search engines</option>
                      <option value="hidden">Hidden from search engines</option>
                    </select>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface-1 p-4">
                    <input
                      type="checkbox"
                      checked={formData.allowDataSharing}
                      onChange={(e) => handleInputChange("allowDataSharing", e.target.checked)}
                      className="mt-2 h-4 w-4 rounded border-hairline bg-canvas text-primary focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <span className="font-medium text-ink">Allow data sharing</span>
                      <p className="text-sm text-ink-muted">Permit analytics and platform improvements using anonymized data.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-6 rounded-3xl border border-hairline bg-canvas/50 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <p className="text-sm text-ink-muted">
                      Personalize the dashboard theme and display preferences.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="space-y-2">
                    <span className={fieldLabel}>Theme</span>
                    <select
                      className={fieldInput}
                      value={formData.theme}
                      onChange={(e) => handleInputChange("theme", e.target.value)}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System Default</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={fieldLabel}>Layout Density</span>
                    <select
                      className={fieldInput}
                      value={formData.layoutDensity}
                      onChange={(e) => handleInputChange("layoutDensity", e.target.value)}
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-hairline bg-canvas/50 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Connected Accounts</h2>
                    <p className="text-sm text-ink-muted">
                      Link external services to simplify login and event sharing.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-dashed border-hairline p-6 text-center text-sm text-ink-muted">
                  <p className="font-medium text-ink mb-2">No connected accounts yet</p>
                  <p>Connect services like Google, Apple, or social accounts in future releases.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-semantic-error/20 bg-surface-1 p-6">
                <div className="flex items-center gap-3 text-ink">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-semantic-error/10 text-semantic-error">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Danger Zone</h2>
                    <p className="text-sm text-ink-muted">
                      These settings are irreversible. Use with caution.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 rounded-2xl border border-semantic-error/20 bg-semantic-error/5 p-4">
                  <div className="flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-semantic-error" />
                    <div>
                      <p className="font-medium text-ink">Delete Account</p>
                      <p className="text-sm text-ink-muted">
                        Permanently remove your account and all associated data.
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full border-semantic-error text-semantic-error hover:bg-semantic-error/10">
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {successMessage && (
                  <p className="text-sm text-semantic-success">{successMessage}</p>
                )}
                {errorMessage && (
                  <p className="text-sm text-semantic-error">{errorMessage}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}