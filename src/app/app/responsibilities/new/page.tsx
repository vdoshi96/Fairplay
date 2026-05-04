import { redirect } from "next/navigation";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { ResponsibilityEditor } from "@/components/responsibilities/responsibility-editor";

export default async function NewResponsibilityPage() {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  return <ResponsibilityEditor personas={sessionView.personas} />;
}
