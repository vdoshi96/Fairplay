import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

import { CardLibrary } from "@/components/library/card-library";
import type { CardTemplateSummary } from "@/contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { getCurrentSession } from "@/server/auth/current-session";
import { createResponsibilityFromTemplate } from "@/server/repositories/card-templates";

export default function LibraryPage() {
  const templates: CardTemplateSummary[] = FAIRPLAY_SOURCE_CARDS.map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title,
    labels: card.labels,
    summary: card.summary,
    coverAssetPath: card.coverAssetPath,
    defaultLane: card.defaultLane
  }));

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
    <main className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-[13px] font-semibold text-fp-muted-ink">Card library</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Source deck
        </h1>
      </div>
      <CardLibrary
        onCreateFromTemplate={createFromTemplate}
        templates={templates}
      />
    </main>
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
