import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { CardWorkspace } from "@/components/cards/card-workspace";
import type { CardDistributionMove } from "@/components/cards/card-state";
import { getCurrentSession } from "@/server/auth/current-session";
import { distributeResponsibilityCard } from "@/server/responsibilities/card-distribution";
import { responsibilityService } from "@/server/responsibilities/service";

export default async function BoardPage() {
  const [session, sessionView] = await Promise.all([
    getPageSession("/app/board"),
    getAppSessionView()
  ]);

  if (!session || !sessionView) {
    redirect("/login");
  }

  if (!session.selectedPersonaId || !sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  const overview = await responsibilityService.listOverview(session);

  async function distribute(move: CardDistributionMove) {
    "use server";

    const actionSession = await getPageSession("/app/board");

    if (!actionSession) {
      redirect("/login");
    }

    if (!actionSession.selectedPersonaId) {
      redirect("/choose-persona");
    }

    await distributeResponsibilityCard(actionSession, move);
    revalidatePath("/app/distribute");
    revalidatePath("/app/your-cards");
    revalidatePath("/app/board");
  }

  return (
    <CardWorkspace
      onDistribute={distribute}
      responsibilities={overview.responsibilities}
      selectedPersona={sessionView.selectedPersona}
      view="board"
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
