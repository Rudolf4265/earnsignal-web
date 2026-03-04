"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AuthShell from "../_components/auth-shell";
import { createClient } from "@/src/lib/supabase/client";
import { appBaseUrl } from "@/src/lib/urls";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = await createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appBaseUrl}/auth/callback`,
      });

      if (resetError) {
        setError(resetError.message || "Unable to send reset email right now.");
        return;
      }

      setSuccess("If an account exists for that email, a reset link has been sent.");
    } catch (clientError) {
      setError(
        clientError instanceof Error
          ? clientError.message
          : "Unable to send reset email right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Reset your password</h1>
      <p className="mt-2 text-sm text-gray-400">
        Enter your account email and we&apos;ll send you a password reset link.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-2 block text-gray-300">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-blue py-3 text-sm font-medium text-white shadow-brandGlow transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending link..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Remembered your password?{" "}
        <Link href="/login" className="text-brand-blue hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
