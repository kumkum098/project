"use client";

import { Ticket, ShoppingCart, CheckCircle, Heart, Star, Shield } from "lucide-react";

/**
 * Profile Stats Component
 * Displays user statistics in a grid
 */

interface ProfileStatsProps {
  ticketsListed: number;
  ticketsPurchased: number;
  ticketsSold: number;
  wishlistCount: number;
  averageRating: number;
  trustScore: number;
}

export function ProfileStats({
  ticketsListed,
  ticketsPurchased,
  ticketsSold,
  wishlistCount,
  averageRating,
  trustScore,
}: ProfileStatsProps) {
  const stats = [
    {
      label: "Tickets Listed",
      value: ticketsListed,
      icon: Ticket,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Tickets Purchased",
      value: ticketsPurchased,
      icon: ShoppingCart,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Tickets Sold",
      value: ticketsSold,
      icon: CheckCircle,
      color: "text-semantic-success",
      bgColor: "bg-semantic-success/10",
    },
    {
      label: "Wishlist Items",
      value: wishlistCount,
      icon: Heart,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      label: "Average Rating",
      value: averageRating.toFixed(1),
      icon: Star,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      label: "Trust Score",
      value: trustScore,
      icon: Shield,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="bg-surface-1 rounded-lg border border-hairline p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-ink mb-6">Statistics</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface-2 rounded-lg border border-hairline p-4 text-center"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-ink mb-1">{stat.value}</p>
              <p className="text-xs text-ink-muted">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}