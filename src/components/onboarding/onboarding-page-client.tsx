"use client";

import { useRouter } from "next/navigation";

import { OnboardingGuide } from "./onboarding-guide";

export function OnboardingPageClient() {
  const router = useRouter();

  return <OnboardingGuide onSkip={() => router.push("/app/distribute")} />;
}
