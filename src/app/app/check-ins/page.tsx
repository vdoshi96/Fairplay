import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { NewCheckInLauncher } from "@/components/check-ins/check-in-flow";
import { getCurrentSession } from "@/server/auth/current-session";
import { checkInService } from "@/server/check-ins/service";
import { selectResponsibilitiesWorthReviewing } from "@/domain/responsibility-review";
import { responsibilityService } from "@/server/responsibilities/service";

export default async function CheckInsIndexPage() {
  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  const asOf = new Date();
  const [history, overview] = await Promise.all([
    checkInService.listHistory(session),
    responsibilityService.listOverview(session, { asOf })
  ]);
  const worthReviewing = selectResponsibilitiesWorthReviewing({
    asOf,
    responsibilities: overview.responsibilities
  }).map(({ hiddenEffortKeys, id, nextReviewAt, status, title }) => ({
    hiddenEffortKeys,
    id,
    nextReviewAt,
    status,
    title
  }));

  return (
    <NewCheckInLauncher history={history} worthReviewing={worthReviewing} />
  );
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/check-ins", {
      headers: requestHeaders
    })
  );
}
