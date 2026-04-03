"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../_components/auth-shell";
import { buttonClassName } from "@/src/components/ui/button";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/client";
import { signInWithGoogle } from "@/src/lib/supabase/oauth";
import { appBaseUrl } from "@/src/lib/urls";
import { isAllowedAuthOrigin } from "@/src/lib/config/domains";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordsMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [confirmPassword, password],
  );


  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
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

    if (passwordsMismatch) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = await createBrowserSupabaseClient();
      const origin = window.location.origin;
      const emailRedirectTo = isAllowedAuthOrigin(origin) ? `${origin}/auth/callback` : `${appBaseUrl}/auth/callback`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create your account right now. Please try again.");
        return;
      }

      if (data.session) {
        router.push("/app/data");
        return;
      }

      if (data.user) {
        setSuccess("Check your email to confirm your account.");
      }
    } catch (clientError) {
      setError(
        clientError instanceof Error
          ? clientError.message
          : "Unable to create your account right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-brand-text-primary">Create your account</h1>
      <p className="mt-2 text-sm text-brand-text-secondary">Start using EarnSigma in minutes.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}{" "}
            <Link href="/login" className="underline hover:no-underline">
              Return to log in
            </Link>
            .
          </div>
        )}

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
          <span className="mb-2 block text-brand-text-secondary">Password</span>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
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

        <label className="block text-sm">
          <span className="mb-2 block text-brand-text-secondary">Confirm password</span>
          <input
            required
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="w-full rounded-xl border border-brand-border bg-brand-bg-elevated px-4 py-3 text-sm text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent-blue"
          />
        </label>

        {passwordsMismatch && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Passwords do not match.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || passwordsMismatch}
          className={buttonClassName({ variant: "primary", className: "w-full py-3" })}
        >
          <span className="inline-flex items-center justify-center">
            {loading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? "Creating account..." : "Create account"}
          </span>
        </button>
      </form>

      <p className="mt-4 text-xs text-brand-text-muted">
        By continuing, you agree to our{" "}
        <a href="https://earnsigma.com/terms" target="_blank" rel="noreferrer" className="hover:underline">
          Terms
        </a>{" "}
        and{" "}
        <a
          href="https://earnsigma.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          Privacy Policy
        </a>
        .
      </p>

      <p className="mt-6 text-center text-sm text-brand-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-accent-blue hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
