"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "featured" | "screenshot";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

const variantStyles = {
  default: "bg-surface-1 border-hairline",
  featured: "bg-surface-2 border-hairline-strong",
  screenshot: "bg-surface-1 border-hairline",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-6 lg:p-8",
  xl: "p-8",
};

export function Card({
  children,
  className = "",
  variant = "default",
  padding = "lg",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <Card variant="default" className={className}>
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink-muted">{description}</p>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  className?: string;
}

export function StatCard({ label, value, detail, className = "" }: StatCardProps) {
  return (
    <Card variant="default" className={className}>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink-subtle">{detail}</p>
    </Card>
  );
}