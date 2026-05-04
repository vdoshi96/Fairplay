import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { RadarBoard } from "@/components/radar/radar-board";
import { getCurrentSession } from "@/server/auth/current-session";
import { radarService } from "@/server/radar/service";

export default async function RadarPage() {
  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  const items = await radarService.list(session);

  return <RadarBoard items={items} />;
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/radar", {
      headers: requestHeaders
    })
  );
}
