import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { CheckInFlow } from "@/components/check-ins/check-in-flow";
import { CheckInIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { CheckInServiceError, checkInService } from "@/server/check-ins/service";

type CheckInPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CheckInPage({ params }: CheckInPageProps) {
  const parsedId = CheckInIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    notFound();
  }

  const session = await getPageSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.selectedPersonaId) {
    redirect("/choose-persona");
  }

  try {
    const checkIn = await checkInService.get(session, parsedId.data);

    return <CheckInFlow initialCheckIn={checkIn} />;
  } catch (error) {
    if (error instanceof CheckInServiceError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}

async function getPageSession() {
  const requestHeaders = await headers();

  return getCurrentSession(
    new NextRequest("http://fairplay.local/app/check-ins", {
      headers: requestHeaders
    })
  );
}
