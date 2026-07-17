import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { DealWorkspace } from "@/components/cards/deal-workspace";
import {
  getDistributableCards,
  type CardDistributionMove
} from "@/components/cards/card-state";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { computeHouseholdWorkMap } from "@/domain/household-work-map";
import { getCurrentSession } from "@/server/auth/current-session";
import { distributeResponsibilityCard } from "@/server/responsibilities/card-distribution";
import { responsibilityService } from "@/server/responsibilities/service";

type DistributePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DistributePage({ searchParams }: DistributePageProps) {
  const [session, sessionView, query] = await Promise.all([
    getPageSession("/app/distribute"),
    getAppSessionView(),
    searchParams
  ]);

  if (!session || !sessionView) {
    redirect("/login");
  }

  if (!session.selectedPersonaId || !sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  const overview = await responsibilityService.listOverview(session);
  const workMap = computeHouseholdWorkMap({
    responsibilities: overview.responsibilities
  });
  const requestedId = parseSelectedResponsibilityId(query.selected);
  const selectedCard = requestedId
    ? getDistributableCards(overview.responsibilities).find(
        (card) => card.id === requestedId
      ) ?? null
    : null;
  const addedToDeal = query.added === "greg" && selectedCard !== null;

  async function distribute(move: CardDistributionMove) {
    "use server";

    const actionSession = await getPageSession("/app/distribute");

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
    <DealWorkspace
      addedToDeal={addedToDeal}
      initialSelectedId={selectedCard?.id}
      onDistribute={distribute}
      responsibilities={overview.responsibilities}
      workMap={workMap}
    />
  );
}

function parseSelectedResponsibilityId(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = ResponsibilityIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function getPageSession(pathname: string) {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest(`http://fairplay.local${pathname}`, {
      headers: requestHeaders
    })
  );
}
