import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { CardWorkspace } from "@/components/cards/card-workspace";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export default async function YourCardsPage() {
  const [session, sessionView] = await Promise.all([
    getPageSession("/app/your-cards"),
    getAppSessionView()
  ]);

  if (!session || !sessionView) {
    redirect("/login");
  }

  if (!session.selectedPersonaId || !sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  const overview = await responsibilityService.listOverview(session);

  return (
    <CardWorkspace
      responsibilities={overview.responsibilities}
      selectedPersona={sessionView.selectedPersona}
      view="yourCards"
    />
  );
}

async function getPageSession(pathname: string) {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest(`http://fairplay.local${pathname}`, {
      headers: requestHeaders
    })
  );
}
