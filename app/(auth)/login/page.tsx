"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../_components/auth-shell";
import { buttonClassName } from "@/src/components/ui/button";
import { createClient } from "@/src/lib/supabase/client";
import { signInWithGoogle } from "@/src/lib/supabase/oauth";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { resolveReturnTo } from "@/src/lib/auth/resolveReturnTo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const resolvedReturnTo = resolveReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
      await signInWithGoogle({ returnTo: resolvedReturnTo });
    } catch (googleError) {
      setError(
        googleError instanceof Error
          ? googleError.message
          : "Unable to continue with Google right now. Please try again.",
      );
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = await createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Unable to log you in right now. Please try again.");
        return;
      }

      const resolvedReturnTo = resolveReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
      router.replace(resolvedReturnTo ?? "/app");
    } catch (clientError) {
      setError(
        clientError instanceof Error
          ? clientError.message
          : "Unable to log you in right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-brand-text-primary">Welcome back</h1>
      <p className="mt-2 text-sm text-brand-text-secondary">Log in to access your EarnSigma workspace.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error ? <ErrorBanner title="Login failed" message={error} /> : null}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className={buttonClassName({
            variant: "secondary",
            className: "w-full border-brand-border bg-brand-bg-elevated py-3 text-brand-text-primary hover:border-brand-border-strong",
          })}
        >
          <span className="inline-flex items-center justify-center">
            {googleLoading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </span>
        </button>

        <label className="block text-sm">
          <span className="mb-2 block text-brand-text-secondary">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-brand-border bg-brand-bg-elevated px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent-blue"
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-brand-text-secondary">Password</span>
            <Link href="/forgot-password" className="text-xs text-brand-accent-blue hover:underline">
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-brand-border bg-brand-bg-elevated px-4 py-3 pr-12 text-sm text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent-blue"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-3 text-xs font-medium text-brand-text-muted transition hover:text-brand-text-primary"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className={buttonClassName({ variant: "primary", className: "w-full py-3" })}
        >
          <span className="inline-flex items-center justify-center">
            {loading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? "Logging in..." : "Log in"}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-accent-blue hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
