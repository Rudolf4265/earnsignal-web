"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "../../_components/auth-shell";
import { getSession } from "@/src/lib/supabase/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data } = await getSession();

        if (!isMounted) {
          return;
        }

        if (data.session) {
          router.replace("/app");
        } else {
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
