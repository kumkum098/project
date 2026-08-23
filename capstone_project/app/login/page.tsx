"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Input, FormMessage, FormGroup } from "@/components";

type LoginForm = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof LoginForm, value: string) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));

    setFormMessage("");
  };

  const validateForm = () => {
    const nextErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setFormMessage("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    } catch {
      setFormMessage("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-surface-1 px-8 py-10 text-ink lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-16 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,106,210,0.15),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(94,106,210,0.1),transparent_28%)]" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary">
                TS
              </span>
              <span className="text-xl font-semibold tracking-tight text-ink">
                TicketSwap Market
              </span>
            </Link>
          </div>

          <div className="relative max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Secure resale access
            </p>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-ink">
              Sign in to manage listings, orders, and live event tickets.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-ink-muted">
              Return to your marketplace dashboard to track ticket sales,
              discover events, and keep every resale transaction organized.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-4 text-sm text-ink-muted">
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">Live</p>
              <p className="mt-1">Event access</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">Fast</p>
              <p className="mt-1">Listing tools</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">Safe</p>
              <p className="mt-1">Account flow</p>
            </div>
          </div>
        </section>

        {/* Login form */}
        <section className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="w-full max-w-md lg:max-w-lg mx-auto p-8">
            {/* Mobile brand header */}
            <div className="mb-9 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary">
                  TS
                </span>
                <span className="text-lg font-semibold tracking-tight text-ink">
                  TicketSwap Market
                </span>
              </Link>
            </div>

            <div className="rounded-lg border border-hairline bg-surface-1 p-8 shadow-xl shadow-black/20">
              <div className="mb-8">
                <p className="text-sm font-medium text-primary">
                  Welcome back
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  Login to your account
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Access your ticket listings, purchases, and marketplace
                  activity.
                </p>
              </div>

              <form className="space-y-5" noValidate onSubmit={handleSubmit}>
                {formMessage && (
                  <FormMessage type="error">
                    {formMessage}
                  </FormMessage>
                )}

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(value) => updateField("email", value)}
                  error={errors.email}
                  autoComplete="email"
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => updateField("password", value)}
                  error={errors.password}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="w-full"
                >
                  Login
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-ink-muted">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}