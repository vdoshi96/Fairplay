import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { getAppSessionView } from "@/components/app-shell/session-view";
import { getLittleAlexPreferences } from "@/server/repositories/preferences";

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

  const littleAlexPreferences = await getLittleAlexPreferences(
    sessionView.selectedPersona.id
  );

  return (
    <AppShell
      household={sessionView.household}
      littleAlexPreferences={littleAlexPreferences}
      selectedPersona={sessionView.selectedPersona}
    >
      {children}
    </AppShell>
  );
}
