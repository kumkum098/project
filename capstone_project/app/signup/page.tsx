"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Input, FormMessage, FormGroup } from "@/components";

type SignupForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupErrors = Partial<Record<keyof SignupForm, string>>;

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupForm>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignupForm, value: string) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));

    setFormMessage("");
    setMessageType("");
  };

  const validateForm = () => {
    const nextErrors: SignupErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full Name is required";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Password is required";
    }

    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data: { success?: boolean; message?: string } = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            email: "Email already exists",
          }));
          setFormMessage("Email already exists");
          setMessageType("error");
          return;
        }

        setFormMessage(data.message || "Something went wrong");
        setMessageType("error");
        return;
      }

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setFormMessage("Account created successfully. Redirecting to login...");
      setMessageType("success");
      await delay(2000);
      router.push("/login");
    } catch {
      setFormMessage("Something went wrong");
      setMessageType("error");
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
              Verified ticket resale
            </p>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-ink">
              Buy and sell seats for the events people cannot miss.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-ink-muted">
              Create your marketplace account to list tickets, discover live
              events, and manage secure resale transactions in one place.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-4 text-sm text-ink-muted">
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">24/7</p>
              <p className="mt-1">Listing access</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">100%</p>
              <p className="mt-1">Buyer focused</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-2xl font-semibold text-ink">Fast</p>
              <p className="mt-1">Event discovery</p>
            </div>
          </div>
        </section>

        {/* Signup form */}
        <section className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="w-full max-w-md lg:max-w-lg mx-auto p-8">
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
                  Start selling smarter
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  Create your account
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Join the marketplace for verified ticket buyers and sellers.
                </p>
              </div>

              {formMessage && (
                <FormMessage type={messageType === "success" ? "success" : "error"}>
                  {formMessage}
                </FormMessage>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  label="Full Name"
                  placeholder="Alex Morgan"
                  value={formData.fullName}
                  onChange={(value) => updateField("fullName", value)}
                  error={errors.fullName}
                  autoComplete="name"
                />

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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(value) => updateField("password", value)}
                  error={errors.password}
                  autoComplete="new-password"
                />

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(value) => updateField("confirmPassword", value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="w-full"
                >
                  Create Account
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-ink-muted">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}