import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { getAppSessionView } from "@/components/app-shell/session-view";
import { PersistentWelcome } from "@/components/welcome/persistent-welcome";
import { getOnboardingPreferences } from "@/server/repositories/preferences";

export default async function AuthenticatedAppLayout({
  children
}: {
  children: ReactNode;
}) {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  const onboardingPreferences = await getOnboardingPreferences(
    sessionView.selectedPersona.id
  );

  return (
    <AppShell
      household={sessionView.household}
      selectedPersona={sessionView.selectedPersona}
    >
      <PersistentWelcome
        dismissed={onboardingPreferences.welcomeDismissedAt !== null}
      />
      {children}
    </AppShell>
  );
}
