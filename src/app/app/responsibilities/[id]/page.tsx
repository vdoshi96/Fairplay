import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import {
  CardDetailSheet,
  type CardDetailCard
} from "@/components/cards/card-detail-sheet";
import { ResponsibilityEditor } from "@/components/responsibilities/responsibility-editor";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { getCurrentSession } from "@/server/auth/current-session";
import { ResponsibilityServiceError, responsibilityService } from "@/server/responsibilities/service";

type ResponsibilityDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResponsibilityDetailPage({
  params
}: ResponsibilityDetailPageProps) {
  const parsedId = ResponsibilityIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    notFound();
  }

  const [sessionView, session] = await Promise.all([
    getAppSessionView(),
    getPageSession()
  ]);

  if (!sessionView || !session) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona || !session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  try {
    const responsibility = await responsibilityService.get(session, parsedId.data);

    return (
      <div className="grid gap-6">
        <CardDetailSheet card={detailCardFor(responsibility)} />
        <ResponsibilityEditor
          initialResponsibility={responsibility}
          personas={sessionView.personas}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof ResponsibilityServiceError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/responsibilities", {
      headers: requestHeaders
    })
  );
}

function detailCardFor(responsibility: ResponsibilityDetail): CardDetailCard {
  const sourceCard = FAIRPLAY_SOURCE_CARDS.find(
    (card) => normalize(card.title) === normalize(responsibility.title)
  );

  return {
    id: responsibility.id,
    title: responsibility.title,
    labels: sourceCard?.labels ?? [],
    boardLane: responsibility.boardLane,
    ownerLabel: ownerLabelFor(responsibility),
    definition: sourceCard?.definition ?? responsibility.summary,
    conception:
      sourceCard?.conception ??
      responsibility.lifecycleNotes?.noticeDecideNotes ??
      null,
    planning:
      sourceCard?.planning ??
      responsibility.lifecycleNotes?.planPrepareNotes ??
      null,
    execution:
      sourceCard?.execution ??
      responsibility.lifecycleNotes?.executeFollowThroughNotes ??
      null,
    minimumStandard: sourceCard?.minimumStandard ?? null,
    householdStandard: responsibility.householdStandard,
    notes: responsibility.notes,
    coverAssetPath: sourceCard?.coverAssetPath ?? null
  };
}

function ownerLabelFor(responsibility: ResponsibilityDetail) {
  const owners = responsibility.currentAssignments.filter(
    (assignment) =>
      assignment.role === "accountable_owner" || assignment.role === "shared_owner"
  );

  if (owners.length === 0) {
    return "Unassigned";
  }

  return owners
    .map((assignment) =>
      assignment.personaKey
        .split("_")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(" ")
    )
    .join(" + ");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
