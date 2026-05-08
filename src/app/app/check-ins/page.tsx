import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { NewCheckInLauncher } from "@/components/check-ins/check-in-flow";
import { getCurrentSession } from "@/server/auth/current-session";
import { checkInService } from "@/server/check-ins/service";

export default async function CheckInsIndexPage() {
  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  const history = await checkInService.listHistory(session);

  return <NewCheckInLauncher history={history} />;
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/check-ins", {
      headers: requestHeaders
    })
  );
}
