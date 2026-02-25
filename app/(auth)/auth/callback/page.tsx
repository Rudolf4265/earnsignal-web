"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "../../_components/auth-shell";
import { getSession, onAuthStateChange } from "@/src/lib/supabase/session";

const SESSION_RETRY_COUNT = 8;
const SESSION_RETRY_DELAY_MS = 200;

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const loadSession = async () => {
      try {
        unsubscribe = await onAuthStateChange((_event, session) => {
          if (!isMounted || !session) {
            return;
          }

          router.replace("/app");
        });

        for (let attempt = 0; attempt < SESSION_RETRY_COUNT; attempt += 1) {
          const { data } = await getSession();

          if (!isMounted) {
            return;
          }

          if (data.session) {
            router.replace("/app");
            return;
          }

          if (attempt < SESSION_RETRY_COUNT - 1) {
            await delay(SESSION_RETRY_DELAY_MS);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [router]);

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Finishing sign in</h1>
      {loading ? (
        <p className="mt-2 text-sm text-gray-400">Please wait while we verify your session...</p>
      ) : (
        <p className="mt-2 text-sm text-gray-400">
          We couldn&apos;t find an active session. Please{" "}
          <Link href="/login" className="text-brand-blue hover:underline">
            log in
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
