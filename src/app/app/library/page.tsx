import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

import { PageHeader } from "@/components/app-shell/page-shell";
import type { CardDistributionBucket } from "@/components/cards/card-state";
import { CardLibrary, type LibraryCardTemplate } from "@/components/library/card-library";
import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import { getCurrentSession } from "@/server/auth/current-session";
import { createResponsibilityFromTemplate } from "@/server/repositories/card-templates";
import { distributeResponsibilityCard } from "@/server/responsibilities/card-distribution";

export default async function LibraryPage() {
  const templates: LibraryCardTemplate[] = FAIRPLAY_SOURCE_CARDS.map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title,
    labels: card.labels,
    summary: card.summary,
    definition: card.definition,
    minimumStandard: card.minimumStandard,
    coverAssetPath: card.coverAssetPath,
    defaultLane: card.defaultLane
  }));
  const session = await getPageSession();
  const aiDrafts: AiCardDraftSummary[] = session?.selectedPersonaId
    ? await aiCardDraftService.list(session)
    : [];

  async function createFromTemplate(
    templateId: string,
    bucket: CardDistributionBucket
  ) {
    "use server";

    const session = await getPageSession();

    if (!session) {
      redirect("/login");
    }

    if (!session.selectedPersonaId) {
      redirect("/choose-persona");
    }

    const created = await createResponsibilityFromTemplate({
      householdId: session.householdId,
      actorPersonaId: session.selectedPersonaId,
      templateId,
      lane: "cards_of_concern"
    });

    await distributeResponsibilityCard(session, {
      bucket,
      responsibilityId: created.id
    });

    revalidatePath("/app/library");
    revalidatePath("/app/distribute");
    revalidatePath("/app/your-cards");
    revalidatePath("/app/board");
    redirect(bucket === "alex" ? "/app/your-cards" : "/app/board");
  }

  return (
    <section className="grid gap-5">
      <PageHeader title="Library" />
      <CardLibrary
        aiDrafts={aiDrafts}
        onCreateFromTemplate={createFromTemplate}
        templates={templates}
      />
    </section>
  );
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/library", {
      headers: requestHeaders
    })
  );
}
