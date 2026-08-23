"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

/**
 * Message interface
 */
interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

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
}

/**
 * Chat Screen Page
 * 
 * Displays messages in a conversation with input box.
 * Shows participant info and ticket details.
 */

export default function ChatScreenPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null as any);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const conversationId = params.conversationId;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch conversation details
  const fetchConversation = async () => {
    if (status !== "authenticated" || !session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch messages
      const messagesResponse = await fetch(`/api/chat/${conversationId}`);
      if (!messagesResponse.ok) {
        throw new Error("Failed to fetch messages");
      }
      const messagesData = await messagesResponse.json();
      if (messagesData.success) {
        setMessages(messagesData.data);
      }

      // Fetch conversations to get conversation details
      const conversationsResponse = await fetch("/api/chat");
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        if (conversationsData.success) {
          const currentConv = conversationsData.data.find(
            (c: Conversation) => c._id === conversationId
          );
          if (currentConv) {
            setConversation(currentConv);
          }
        }
      }

      // Mark messages as read
      await fetch(`/api/chat/${conversationId}/read`, {
        method: "PATCH",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [status, session, conversationId]);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    if (status !== "authenticated") return;

    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 15000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [status, session, conversationId]);

  // Fetch only messages
  const fetchMessages = async () => {
    if (status !== "authenticated") return;

    try {
      const response = await fetch(`/api/chat/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
          // Mark as read
          await fetch(`/api/chat/${conversationId}/read`, {
            method: "PATCH",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const response = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          attachments: [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Loading chat...</p>
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
            <h2 className="text-2xl font-bold text-ink mb-2">Error Loading Chat</h2>
            <p className="text-ink-muted mb-4">{error}</p>
            <Link
              href="/messages"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Back to Messages
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session || !conversation) {
    return null;
  }

  const isCurrentUserSender = (senderId: string) => senderId === session.user.id;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="bg-surface-1 border-b border-hairline px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center">
          {/* Back button - mobile only */}
          <Link
            href="/messages"
            className="lg:hidden mr-4 text-ink-muted hover:text-ink"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Participant Info */}
          <div className="flex items-center flex-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-primary font-semibold">
                {conversation.otherUser.name.charAt(0).toUpperCase()}
              </div>
              {/* Online indicator (UI only) */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-semantic-success border-2 border-surface-1 rounded-full"></div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-ink">
                {conversation.otherUser.name}
              </h2>
              <p className="text-sm text-ink-muted">
                Trust Score: {conversation.otherUser.trustScore}/100
              </p>
            </div>
          </div>

          {/* Ticket Info */}
          {conversation.ticket && (
            <Link
              href={`/tickets/${conversation.ticket._id}`}
              className="ml-4 px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors"
            >
              <p className="text-xs text-ink-muted">Ticket</p>
              <p className="text-sm font-medium text-ink truncate max-w-xs">
                {conversation.ticket.eventName}
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-ink-tertiary text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-ink mb-2">No messages yet</h3>
              <p className="text-ink-muted">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = isCurrentUserSender(message.senderId);
                return (
                  <div
                    key={message._id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-white"
                          : "bg-surface-1 border border-hairline text-ink"
                      }`}
                    >
                      {/* Message content */}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      
                      {/* Attachments (placeholder) */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="text-xs opacity-75">
                              📎 {attachment}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp and read status */}
                      <div
                        className={`flex items-center justify-end mt-1 space-x-2 ${
                          isCurrentUser ? "text-primary/80" : "text-ink-tertiary"
                        }`}
                      >
                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                        {isCurrentUser && (
                          <span className="text-xs">
                            {message.isRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-surface-1 border-t border-hairline px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2">
            {/* Attachment button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-ink-tertiary hover:text-ink-muted transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Message input */}
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-2 bg-surface-2 border border-hairline rounded-lg text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                style={{ minHeight: "42px", maxHeight: "120px" }}
                disabled={sending}
              />
            </div>

            {/* Emoji button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-ink-tertiary hover:text-ink-muted transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="flex-shrink-0 p-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-surface-3 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}