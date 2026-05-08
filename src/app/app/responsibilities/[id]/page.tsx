import { headers } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { CardDetailSheet } from "@/components/cards/card-detail-sheet";
import type { CardDistributionBucket } from "@/components/cards/card-state";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { ResponsibilityServiceError, responsibilityService } from "@/server/responsibilities/service";
import { distributeResponsibilityCard } from "@/server/responsibilities/card-distribution";
import { detailCardFor } from "./detail-card";

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
  const responsibilityId = parsedId.data;

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

  async function moveCard(bucket: CardDistributionBucket) {
    "use server";

    const actionSession = await getPageSession();

    if (!actionSession) {
      redirect("/login");
    }

    if (!actionSession.selectedPersonaId) {
      redirect("/choose-persona");
    }

    await distributeResponsibilityCard(actionSession, {
      bucket,
      responsibilityId
    });
    revalidatePath(`/app/responsibilities/${responsibilityId}`);
    revalidatePath("/app/your-cards");
    revalidatePath("/app/distribute");
    revalidatePath("/app/board");
    redirect("/app/board");
  }

  try {
    const responsibility = await responsibilityService.get(session, responsibilityId);

    return (
      <div className="grid gap-6">
        <nav aria-label="Responsibility navigation" className="flex flex-wrap gap-2">
          <Link
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 py-3 text-[14px] font-bold text-fp-ink"
            href="/app/your-cards"
          >
            Back to Your Cards
          </Link>
          <Link
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 py-3 text-[14px] font-bold text-fp-ink"
            href="/app/board"
          >
            Back to Board
          </Link>
        </nav>
        <CardDetailSheet card={detailCardFor(responsibility)} onMove={moveCard} />
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
