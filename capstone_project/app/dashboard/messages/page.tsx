"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

/**
 * Conversation interface
 */
interface Conversation {
  _id: string;
  ticket: {
    _id: string;
    title: string;
    eventName: string;
    imageUrl: string;
    price: number;
  } | null;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    trustScore: number;
  };
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

/**
 * Chat List Page
 * 
 * Displays all conversations for the logged-in user.
 * Shows participant info, ticket details, and last message.
 */

export default function MessagesPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (status !== "authenticated" || !session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/chat");

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      } else {
        throw new Error(data.message || "Failed to load conversations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [status, session]);

  // Poll for new conversations every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 15000);

    return () => clearInterval(interval);
  }, [status, session]);

  // Get time ago string
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

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <div className="text-semantic-error text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-ink mb-2">Error Loading Messages</h2>
            <p className="text-ink-muted mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-surface-1 border-b border-hairline px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-ink">Messages</h1>
          <p className="mt-2 text-ink-muted">
            Chat with buyers and sellers about tickets
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Conversation List - Full width on mobile, sidebar on desktop */}
          <div className={`w-full ${selectedConversation ? 'hidden lg:block' : ''} lg:w-96 border-r border-hairline bg-surface-1`}>
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-ink-tertiary text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-ink mb-2">No Messages</h3>
                <p className="text-ink-muted">
                  Start a conversation by contacting a seller or buyer
                </p>
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {conversations.map((conversation) => (
                  <Link
                    key={conversation._id}
                    href={`/messages/${conversation._id}`}
                    className={`block hover:bg-surface-2 transition-colors ${
                      selectedConversation === conversation._id ? 'bg-surface-2' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation._id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-primary font-semibold text-lg">
                            {conversation.otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-ink truncate">
                                {conversation.otherUser.name}
                              </h3>
                              {conversation.ticket && (
                                <p className="text-xs text-ink-subtle truncate mt-0.5">
                                  {conversation.ticket.eventName}
                                </p>
                              )}
                              <p className="text-sm text-ink-muted truncate mt-1">
                                {conversation.lastMessage || "No messages yet"}
                              </p>
                            </div>
                            <div className="ml-2 flex flex-col items-end">
                              <span className="text-xs text-ink-tertiary">
                                {getTimeAgo(conversation.lastMessageAt || conversation.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area - Shown on mobile when conversation selected */}
          {selectedConversation && (
            <div className="flex-1 lg:hidden">
              <div className="p-4 bg-surface-1 border-b border-hairline flex items-center">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="mr-3 text-ink-muted hover:text-ink"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-ink">Back to conversations</h2>
              </div>
            </div>
          )}

          {/* Empty State for Desktop */}
          {!selectedConversation && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-canvas">
              <div className="text-center">
                <div className="text-ink-tertiary text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-ink mb-2">Select a conversation</h3>
                <p className="text-ink-muted">Choose a conversation from the left to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}