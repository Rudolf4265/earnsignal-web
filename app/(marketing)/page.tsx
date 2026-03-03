"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AboutTeaser } from "@/components/marketing/AboutTeaser";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { Hero } from "@/components/marketing/Hero";

export default function MarketingHomePage() {
  const router = useRouter();
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("supabase.auth.token");

  useEffect(() => {
    if (token) {
      router.replace("/app");
    }
  }, [router, token]);

  if (token) {
    return null;
  }

  return (
    <>
      <Hero />
      <FeatureCards />
      <AboutTeaser />
    </>
  );
}
