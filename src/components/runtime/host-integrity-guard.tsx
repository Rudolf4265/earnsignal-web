"use client";

import { useEffect } from "react";
import { getCanonicalHosts, isAllowedHost } from "@/src/lib/config/domains";

export function HostIntegrityGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const host = window.location.host.split(":")[0]?.toLowerCase() ?? "";
    if (isAllowedHost(host)) {
      return;
    }

    const canonical = getCanonicalHosts();
    console.warn("[domain-integrity] Host not in allowed set", {
      host,
      expected: [canonical.marketingRootHost, canonical.marketingHost, canonical.appHost],
    });
  }, []);

  return null;
}
