"use client";

import { TopNav, Footer, Section, Container, SectionHeader, Button, FeatureCard, StatCard } from "@/components";
import TicketCard from "@/components/TicketCard";
import NearbyEventsSearch from "@/components/NearbyEventsSearch";
import type { Ticket } from "@/types/ticket";

const featuredTickets: Ticket[] = [
  {
    _id: "507f1f77bcf86cd799439011",
    id: "507f1f77bcf86cd799439011",
    title: "Coldplay World Tour",
    description: "Experience the magic of Coldplay live in concert.",
    eventName: "Coldplay World Tour",
    eventDate: "Aug 18, 2026",
    eventVenue: "MetLife Stadium",
    price: 185,
    originalPrice: 250,
    category: "MUSIC",
    status: "AVAILABLE",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
    sellerName: "TicketMaster",
    sellerTrustScore: 95,
    isVerified: true,
    views: 1200,
    savedCount: 45,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439012",
    id: "507f1f77bcf86cd799439012",
    title: "NBA Finals Game 4",
    description: "Watch the NBA Finals live at Madison Square Garden.",
    eventName: "NBA Finals Game 4",
    eventDate: "Jun 12, 2026",
    eventVenue: "Madison Square Garden",
    price: 320,
    originalPrice: 400,
    category: "SPORTS",
    status: "AVAILABLE",
    imageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
    sellerName: "SportsTickets",
    sellerTrustScore: 90,
    isVerified: true,
    views: 2500,
    savedCount: 120,
    createdAt: "2026-01-02T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439013",
    id: "507f1f77bcf86cd799439013",
    title: "Broadway Premiere Night",
    description: "Enjoy a spectacular Broadway premiere night.",
    eventName: "Broadway Premiere Night",
    eventDate: "Sep 4, 2026",
    eventVenue: "New York Theatre",
    price: 96,
    originalPrice: 150,
    category: "THEATRE",
    status: "AVAILABLE",
    imageUrl:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
    sellerName: "BroadwayFan",
    sellerTrustScore: 88,
    isVerified: true,
    views: 800,
    savedCount: 30,
    createdAt: "2026-01-03T00:00:00Z",
  },
];

const lastMinuteDeals: Ticket[] = [
  {
    _id: "507f1f77bcf86cd799439014",
    id: "507f1f77bcf86cd799439014",
    title: "Summer Jazz Festival",
    description: "Don't miss the Summer Jazz Festival tonight!",
    eventName: "Summer Jazz Festival",
    eventDate: "Tonight, 8:00 PM",
    eventVenue: "Riverfront Arena",
    price: 42,
    originalPrice: 60,
    category: "MUSIC",
    status: "AVAILABLE",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    sellerName: "JazzLover",
    sellerTrustScore: 85,
    isVerified: false,
    views: 500,
    savedCount: 15,
    createdAt: "2026-01-04T00:00:00Z",
  },
  {
    _id: "507f1f77bcf86cd799439015",
    id: "507f1f77bcf86cd799439015",
    title: "FC City Derby",
    description: "Experience the thrill of the FC City Derby.",
    eventName: "FC City Derby",
    eventDate: "Tomorrow, 6:30 PM",
    eventVenue: "National Stadium",
    price: 58,
    originalPrice: 80,
    category: "SPORTS",
    status: "AVAILABLE",
    imageUrl:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
    sellerName: "SoccerFan",
    sellerTrustScore: 82,
    isVerified: true,
    views: 1500,
    savedCount: 60,
    createdAt: "2026-01-05T00:00:00Z",
  },
];

const trustFeatures = [
  {
    title: "Escrow Protection",
    description:
      "Payments are held securely until ticket delivery is confirmed.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Verified Tickets",
    description:
      "Listings are reviewed to reduce fraud and protect every buyer.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Trusted Sellers",
    description:
      "Seller history and marketplace safeguards help you buy with confidence.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopNav />

      {/* Hero Section */}
      <Section background="canvas" padding="xl">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
                Verified resale marketplace
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Find seats for sold-out concerts, sports, and live shows.
              </h1>
              <p className="mt-6 text-lg text-ink-muted max-w-2xl">
                Buy and sell event tickets with secure payments, verified
                listings, and a marketplace designed for fans who need trusted
                access fast.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  placeholder="Search by artist, team, venue, or city"
                  className="h-12 min-w-0 flex-1 rounded-md border border-hairline bg-surface-1 px-4 text-base text-ink placeholder:text-ink-tertiary outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                />
                <Button variant="primary" size="lg" href="/tickets">
                  Search Tickets
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative h-64 overflow-hidden rounded-lg border border-hairline bg-surface-1 sm:h-80 lg:h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1100&q=80"
                  alt="Concert crowd at a live event"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Active listings" value="50K+" detail="And growing" />
                <StatCard label="Live events" value="500+" detail="Updated daily" />
                <StatCard label="Buyer support" value="24/7" detail="Always available" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Nearby Events Search Section - Temporary Testing */}
      <Section background="canvas" padding="lg">
        <Container>
          <NearbyEventsSearch />
        </Container>
      </Section>

      {/* Featured Tickets Section */}
      <Section background="surface-1" padding="lg">
        <Container>
          <SectionHeader
            eyebrow="Featured tickets"
            title="Popular events this week"
            action={{ label: "Browse all tickets", href: "/tickets" }}
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust Features Section */}
      <Section background="canvas" padding="lg">
        <Container>
          <SectionHeader
            eyebrow="Why choose us"
            title="Built for safer resale from search to entry."
          />

          <div className="grid gap-6 md:grid-cols-3">
            {trustFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Last Minute Deals Section */}
      <Section background="surface-1" padding="lg">
        <Container>
          <SectionHeader
            eyebrow="Last minute deals"
            title="Great seats for events happening soon"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {lastMinuteDeals.map((ticket) => (
              <div
                key={ticket.id}
                className="grid overflow-hidden rounded-lg border border-hairline bg-surface-1 transition-all hover:border-hairline-strong hover:bg-surface-2 sm:grid-cols-[220px_1fr]"
              >
                <div className="relative h-56 w-full sm:h-full">
                  <img
                    src={ticket.imageUrl}
                    alt={ticket.eventName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <p className="text-sm font-semibold text-semantic-success mb-2">
                      Limited availability
                    </p>
                    <h3 className="text-xl font-semibold text-ink">{ticket.eventName}</h3>
                  <p className="mt-3 text-sm text-ink-muted">
                    {ticket.eventDate} · {ticket.eventVenue}
                  </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-2xl font-semibold text-ink">{ticket.price}</p>
                    <Button variant="primary" size="sm" href="/tickets">
                      View Deal
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Banner */}
      <Section background="canvas" padding="lg">
        <Container>
          <div className="rounded-lg border border-hairline bg-surface-1 p-8 lg:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-ink">
                Ready to start buying or selling?
              </h2>
              <p className="mt-4 text-lg text-ink-muted">
                Join thousands of fans who trust TicketSwap Market for secure ticket resale.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="primary" size="lg" href="/signup">
                  Create Account
                </Button>
                <Button variant="secondary" size="lg" href="/tickets">
                  Browse Tickets
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}