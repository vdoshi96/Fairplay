import { redirect } from "next/navigation";

import { NewCheckInLauncher } from "@/components/check-ins/check-in-flow";
import { getAppSessionView } from "@/components/app-shell/session-view";

export default async function NewCheckInPage() {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  return <NewCheckInLauncher />;
}
