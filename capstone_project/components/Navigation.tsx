import Link from "next/link";
import { Button } from "./Button";

interface TopNavProps {
  brandName?: string;
  links?: { label: string; href: string }[];
  ctaHref?: string;
  ctaLabel?: string;
}

export function TopNav({
  brandName = "TicketSwap Market",
  links = [
    { label: "Home", href: "/" },
    { label: "Browse Tickets", href: "/tickets" },
  ],
  ctaHref = "/signup",
  ctaLabel = "Get Started",
}: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-on-primary">
            TS
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {brandName}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" href="/login">
            Sign In
          </Button>
          <Button variant="primary" size="sm" href={ctaHref}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </nav>
  );
}

interface FooterProps {
  brandName?: string;
  links?: { label: string; href: string }[];
}

export function Footer({
  brandName = "TicketSwap Market",
  links = [
    { label: "Browse Tickets", href: "/tickets" },
    { label: "Login", href: "/login" },
    { label: "Sign Up", href: "/signup" },
  ],
}: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-on-primary">
              TS
            </span>
            <span className="font-semibold text-ink">{brandName}</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-ink-subtle">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-ink-tertiary">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}