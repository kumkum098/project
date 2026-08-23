import type { ReactNode } from "react";
import Link from "next/link";

interface StatusBadgeProps {
  status: "active" | "pending" | "sold" | "removed" | "success" | "error" | "info" | "warning";
  label?: string;
  className?: string;
}

const statusStyles = {
  active: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sold: "bg-ink-subtle/10 text-ink-subtle border-ink-subtle/20",
  removed: "bg-ink-tertiary/10 text-ink-tertiary border-ink-tertiary/20",
  success: "bg-semantic-success/10 text-semantic-success border-semantic-success/20",
  error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  info: "bg-surface-2 text-ink-muted border-hairline-strong",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium border
        ${statusStyles[status]}
        ${className}
      `}
    >
      {displayLabel}
    </span>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-base text-ink-muted max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {action.label} →
          </Link>
        )}
      </div>
    </div>
  );
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeStyles = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  children,
  className = "",
  size = "xl",
}: ContainerProps) {
  return (
    <div
      className={`
        mx-auto px-6 lg:px-8
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: "canvas" | "surface-1" | "surface-2";
  padding?: "sm" | "md" | "lg" | "xl";
}

const backgroundStyles = {
  canvas: "bg-canvas",
  "surface-1": "bg-surface-1",
  "surface-2": "bg-surface-2",
};

const paddingStyles = {
  sm: "py-12",
  md: "py-16",
  lg: "py-20",
  xl: "py-24",
};

export function Section({
  children,
  className = "",
  background = "canvas",
  padding = "lg",
}: SectionProps) {
  return (
    <section
      className={`
        ${backgroundStyles[background]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </section>
  );
}

interface DividerProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  className = "",
  orientation = "horizontal",
}: DividerProps) {
  return (
    <div
      className={`
        ${orientation === "horizontal" ? "w-full h-px" : "h-full w-px"}
        bg-hairline
        ${className}
      `}
    />
  );
}