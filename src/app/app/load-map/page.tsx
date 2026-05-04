import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { ResponsibilityLoadMap } from "@/components/responsibilities/responsibility-load-map";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export default async function LoadMapPage() {
  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  const overview = await responsibilityService.listOverview(session);

  return (
    <ResponsibilityLoadMap
      loadSnapshot={overview.loadSnapshot}
      responsibilities={overview.responsibilities}
    />
  );
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/load-map", {
      headers: requestHeaders
    })
  );
}
