"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Navigation, Calendar, Users } from "lucide-react";
import { Card } from "@/components/Card";

/**
 * Nearby Events Page
 * Displays events near the user's location
 */

interface Event {
  _id: string;
  title: string;
  eventName: string;
  description: string;
  imageUrl: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  date: string;
  time: string;
  price: number;
  distance?: number;
}

export default function NearbyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a location if geolocation fails
          setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi
        }
      );
    }
  }, []);

  // Fetch nearby events
  useEffect(() => {
    const fetchNearbyEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, fetch all events (in a real app, you'd filter by distance)
        const response = await fetch("/api/tickets");
        
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        if (data.success) {
          // Add mock distance for demo purposes
          const eventsWithDistance = data.data.map((event: Event) => ({
            ...event,
            distance: Math.random() * 50, // Random distance for demo
          }));
          setEvents(eventsWithDistance);
        } else {
          throw new Error(data.message || "Failed to load events");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyEvents();
  }, [userLocation]);

  // Filter events by search query
  const filteredEvents = events.filter((event) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.eventName.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Finding events near you...</p>
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
            <h2 className="text-2xl font-bold text-ink mb-2">Unable to Load Events</h2>
            <p className="text-ink-muted mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2">Nearby Events</h1>
          <p className="text-ink-muted">Discover events happening near you</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search events by name, venue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-hairline rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-surface-1 rounded-lg border border-hairline p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">No Events Found</h3>
            <p className="text-ink-muted">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "There are no events available at the moment"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/tickets/${event._id}`)}
              >
                {/* Event Image */}
                <div className="relative h-48 bg-surface-2">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.eventName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-ink-muted" />
                    </div>
                  )}
                  {event.distance !== undefined && (
                    <div className="absolute top-2 right-2 bg-surface-1/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-ink">
                      {event.distance.toFixed(1)} km away
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-ink mb-1 line-clamp-1">
                    {event.eventName}
                  </h3>
                  <p className="text-sm text-ink-muted mb-3 line-clamp-2">
                    {event.title}
                  </p>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm text-ink-muted mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      {event.venue}, {event.city}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-2 text-sm text-ink-muted mb-3">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-hairline">
                    <span className="text-lg font-bold text-primary">
                      ₹{event.price.toLocaleString()}
                    </span>
                    <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}