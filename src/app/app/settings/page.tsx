import { redirect } from "next/navigation";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getLittleAlexPreferences } from "@/server/repositories/preferences";

export default async function AppSettingsPage() {
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
    <SettingsPanel
      household={sessionView.household}
      littleAlexPreferences={littleAlexPreferences}
      selectedPersona={sessionView.selectedPersona}
    />
  );
}
