import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  ResponsibilityLoadMap,
  type ResponsibilityBoardMove
} from "@/components/responsibilities/responsibility-load-map";
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
  const actorPersonaId = session.selectedPersonaId;

  async function moveBoardPlacement(move: ResponsibilityBoardMove) {
    "use server";

    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "fairplay.local";
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const response = await fetch(
      `${protocol}://${host}/api/responsibilities/${move.responsibilityId}/board-placement`,
      {
        body: JSON.stringify({
          responsibilityId: move.responsibilityId,
          toLane: move.toLane,
          sortOrder: move.sortOrder ?? 0,
          actorPersonaId
        }),
        headers: {
          "content-type": "application/json",
          cookie: requestHeaders.get("cookie") ?? ""
        },
        method: "PATCH"
      }
    );

    if (!response.ok) {
      throw new Error("Unable to move responsibility on the load board.");
    }

    revalidatePath("/app/load-map");
  }

  return (
    <ResponsibilityLoadMap
      loadSnapshot={overview.loadSnapshot}
      onMove={moveBoardPlacement}
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
