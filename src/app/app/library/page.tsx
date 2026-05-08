import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

import { PageHeader } from "@/components/app-shell/page-shell";
import { CardLibrary } from "@/components/library/card-library";
import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type { CardTemplateSummary } from "@/contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import { getCurrentSession } from "@/server/auth/current-session";
import { createResponsibilityFromTemplate } from "@/server/repositories/card-templates";

export default async function LibraryPage() {
  const templates: CardTemplateSummary[] = FAIRPLAY_SOURCE_CARDS.map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title,
    labels: card.labels,
    summary: card.summary,
    coverAssetPath: card.coverAssetPath,
    defaultLane: card.defaultLane
  }));
  const session = await getPageSession();
  const aiDrafts: AiCardDraftSummary[] = session?.selectedPersonaId
    ? await aiCardDraftService.list(session)
    : [];

  async function createFromTemplate(templateId: string) {
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
      templateId
    });

    revalidatePath("/app/load-map");
    redirect(`/app/responsibilities/${created.id}`);
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
