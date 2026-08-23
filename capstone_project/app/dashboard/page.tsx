import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";
import { Section, Container, SectionHeader, StatCard, Card, StatusBadge } from "@/components";

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

const sellerStats: StatCard[] = [
  {
    label: "My Listings",
    value: "12",
    detail: "4 listings are currently active",
  },
  {
    label: "Earnings",
    value: "$2,840",
    detail: "Estimated completed resale revenue",
  },
  {
    label: "Pending Transactions",
    value: "3",
    detail: "Awaiting buyer confirmation",
  },
];

const buyerStats: StatCard[] = [
  {
    label: "Purchased Tickets",
    value: "8",
    detail: "Tickets bought through the marketplace",
  },
  {
    label: "Active Transactions",
    value: "2",
    detail: "Purchases currently being processed",
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const trustScore = 0;
  const isSeller = user.role === UserRole.SELLER || user.role === UserRole.ADMIN;
  const dashboardStats = isSeller ? sellerStats : buyerStats;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Dashboard Header */}
      <Section background="surface-1" padding="lg">
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                Dashboard
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-ink">
                Welcome, {user.name}
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Manage your ticket marketplace activity, transactions, and
                account trust signals from one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card variant="default" padding="md">
                <p className="text-sm text-ink-muted">User Role</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{user.role}</p>
              </Card>
              <Card variant="default" padding="md">
                <p className="text-sm text-ink-muted">Trust Score</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{trustScore}/100</p>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats Section */}
      <Section background="canvas" padding="lg">
        <Container>
          <SectionHeader
            eyebrow={isSeller ? "Seller View" : "Buyer View"}
            title={isSeller ? "Sales overview" : "Ticket activity"}
          />

          <div
            className={`grid gap-5 ${
              isSeller ? "md:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            {dashboardStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.7fr_0.3fr]">
            {/* Activity Feed */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    {isSeller ? "Recent seller activity" : "Recent buyer activity"}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">
                    Mock dashboard data is shown until live transactions are wired
                    in.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {(isSeller
                  ? ["Listing viewed 46 times", "Buyer payment pending", "Ticket transfer requested"]
                  : ["Ticket purchase confirmed", "Transfer pending", "New event recommendation"]
                ).map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-ink">{item}</span>
                    <StatusBadge status="active" label="Active" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Account Status */}
            <Card variant="default" padding="lg">
              <h3 className="text-xl font-semibold text-ink">Account status</h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Your account is ready for protected marketplace actions once
                authentication routes and live data are connected.
              </p>
              <div className="mt-6 rounded-lg border border-semantic-success/20 bg-semantic-success/10 p-4 text-sm text-semantic-success">
                Role-based dashboard rendering is active for buyers, sellers, and
                admins.
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </div>
  );
}