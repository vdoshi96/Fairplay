import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { Sparkles } from "lucide-react";

import { AiTaskManager } from "@/components/library/ai-task-manager";
import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function AskGregPage() {
  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  const aiDrafts: AiCardDraftSummary[] = await aiCardDraftService.list(session);

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <p className="text-[13px] font-bold text-fp-muted-ink">Ask Greg</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Make more cards
        </h1>
      </header>
      <section className="grid gap-4 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-[var(--fp-shadow-soft)]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-fp-primary text-fp-on-primary">
            <Sparkles aria-hidden className="h-5 w-5" />
          </span>
          <p className="text-[14px] font-semibold leading-6 text-fp-muted-ink">
            Describe a responsibility and Greg will draft a card you can add to the Board.
          </p>
        </div>
        <AiTaskManager drafts={aiDrafts} />
      </section>
    </section>
  );
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/ask-greg", {
      headers: requestHeaders
    })
  );
}
