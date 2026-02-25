"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-gray-400">Workspace and account settings will appear here.</p>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/5 disabled:opacity-50"
      >
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
    </div>
  );
}
