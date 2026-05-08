import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { PageHeader } from "@/components/app-shell/page-shell";
import { CardLibrary, type LibraryCardTemplate } from "@/components/library/card-library";
import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import { getCurrentSession } from "@/server/auth/current-session";

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

  return (
    <section className="grid gap-5">
      <PageHeader title="Library" />
      <CardLibrary aiDrafts={aiDrafts} templates={templates} />
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
