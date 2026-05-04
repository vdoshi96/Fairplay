import { redirect } from "next/navigation";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default async function AppSettingsPage() {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  return (
    <SettingsPanel
      household={sessionView.household}
      selectedPersona={sessionView.selectedPersona}
    />
  );
}
