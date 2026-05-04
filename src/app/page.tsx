import { redirect } from "next/navigation";

import { getAppSessionView } from "@/components/app-shell/session-view";

export default async function Home() {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  redirect("/app/home");
}
