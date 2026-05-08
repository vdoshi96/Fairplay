import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

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
    <section className="grid min-w-0 max-w-full gap-3 overflow-hidden lg:gap-4">
      <section className="grid min-w-0 max-w-full self-start overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 shadow-[var(--fp-shadow-soft)] sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-5 lg:p-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-4 lg:gap-3">
          <header className="grid min-w-0 gap-1">
            <p className="m-0 text-[13px] font-bold text-fp-muted-ink">Ask Greg</p>
            <h1 className="m-0 text-[28px] font-bold leading-[34px] text-fp-ink">
              Make more cards
            </h1>
            <p className="m-0 max-w-2xl text-[14px] font-semibold leading-6 text-fp-muted-ink [overflow-wrap:anywhere]">
              Describe a responsibility and Greg will draft a card you can add to the Board.
            </p>
          </header>
          <AiTaskManager drafts={aiDrafts} />
        </div>
        <div className="hidden min-w-0 items-end justify-items-center overflow-hidden rounded-[8px] border border-fp-line bg-white/70 p-2 lg:grid lg:min-h-[26rem] xl:min-h-[30rem]">
          <Image
            alt="Greg card helper"
            className="-mb-3 h-auto w-full max-w-[20rem] origin-bottom scale-125 object-contain drop-shadow-[0_18px_28px_rgba(34,34,34,0.14)] xl:max-w-[22rem] xl:scale-[1.32]"
            height={1254}
            priority
            src="/assets/fairplay/generated-ui/greg-taskmaster-avatar.png"
            width={1254}
          />
        </div>
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
