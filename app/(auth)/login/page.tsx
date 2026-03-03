"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#050B18] via-[#06142A] to-[#040914] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-15%] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 text-center">
            <h1 className="text-[22px] font-semibold tracking-tight text-white">EarnSigma</h1>
            <p className="mt-3 text-[13px] text-white/60">Revenue intelligence for creator teams</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] px-8 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
            <h2 className="text-[22px] font-semibold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-[14px] text-white/60">Log in to access your workspace.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error ? <ErrorBanner title="Login failed" message={error} /> : null}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-[14px] font-medium text-white transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                <span className="inline-flex items-center justify-center">
                  {googleLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </span>
              </button>

              <div className="my-7 h-px bg-white/10" />

              <label className="block text-[13px] text-white/70">
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-[12px] text-[14px] text-white placeholder:text-white/40 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />
              </label>

              <label className="block text-[13px] text-white/70">
                <div className="mt-2 flex items-center justify-between">
                  <span>Password</span>
                  <Link href="/forgot-password" className="transition hover:text-white/90">
                    Forgot?
                  </a>
                </div>

                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-[12px] pr-12 text-[14px] text-white placeholder:text-white/40 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 mt-2 text-xs font-medium text-white/60 transition hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-[13px] text-[15px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-50"
              >
                <span className="inline-flex items-center justify-center">
                  {loading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {loading ? "Logging in..." : "Log in"}
                </span>
              </button>
            </form>

            <p className="mt-7 text-center text-[13px] text-white/60">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-cyan-400 transition hover:text-cyan-300">
                Create one
              </Link>
            </p>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-white/40">
              By continuing, you agree to our{" "}
              <a href="https://earnsigma.com/terms" className="transition hover:text-white/70" target="_blank" rel="noreferrer">
                Terms
              </a>{" "}
              and{" "}
              <a href="https://earnsigma.com/privacy" className="transition hover:text-white/70" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
