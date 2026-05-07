import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { CardDetailSheet } from "@/components/cards/card-detail-sheet";
import { ResponsibilityEditor } from "@/components/responsibilities/responsibility-editor";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { ResponsibilityServiceError, responsibilityService } from "@/server/responsibilities/service";
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
        <nav aria-label="Responsibility navigation" className="flex flex-wrap gap-2">
          <Link
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 py-3 text-[14px] font-bold text-fp-ink"
            href="/app/library"
          >
            Back to library
          </Link>
          <Link
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 py-3 text-[14px] font-bold text-fp-ink"
            href="/app/load-map"
          >
            Back to Load Map
          </Link>
        </nav>
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
