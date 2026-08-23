"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Providers Component
 * 
 * Wraps the application with NextAuth SessionProvider to enable session management
 * across all client components that use useSession() hook.
 * 
 * Why SessionProvider is required:
 * - NextAuth's useSession() hook requires a SessionProvider context to access session data
 * - Without this provider, useSession() will throw an error
 * - The provider manages session state, refreshing, and updates across the app
 * 
 * Why it should be added in the root layout:
 * - Session data is needed across multiple pages and components (e.g., TopNavigation)
 * - Adding it at the root ensures all client components can access session state
 * - Avoids wrapping individual pages separately, which would be redundant and error-prone
 * - Follows Next.js App Router best practices for global state management
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}