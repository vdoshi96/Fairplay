import type { ResponsibilityStatus } from "@/domain/enums";
import type { ResponsibilityId } from "@/domain/ids";
import type { CardDistributionBucket } from "@/components/cards/card-state";
import { laneForBucket } from "@/components/cards/card-state";
import type { CurrentSession } from "@/server/auth/current-session";
import { updateResponsibilityBoardPlacement } from "@/server/repositories/responsibilities";
import { responsibilityService } from "./service";

type DistributeResponsibilityCardInput = {
  bucket: CardDistributionBucket;
  responsibilityId: ResponsibilityId;
  sortOrder?: number;
};

const statusByDistributionBucket: Record<
  CardDistributionBucket,
  Extract<ResponsibilityStatus, "active" | "not_relevant" | "paused" | "unassigned">
> = {
  alex: "active",
  max: "active",
  notApplicable: "not_relevant",
  savedForLater: "paused",
  unassigned: "unassigned"
};

export async function distributeResponsibilityCard(
  session: CurrentSession,
  input: DistributeResponsibilityCardInput
) {
  const responsibility = await responsibilityService.get(
    session,
    input.responsibilityId
  );
  const status = statusByDistributionBucket[input.bucket];

  if (responsibility.status !== status) {
    await responsibilityService.updateStatus(session, input.responsibilityId, {
      status
    });
  }

  if (
    !sameAssignmentBucket(responsibility.currentAssignments, input.bucket)
  ) {
    await responsibilityService.updateAssignments(session, input.responsibilityId, {
      assignments:
        input.bucket === "alex" || input.bucket === "max"
          ? [
              {
                personaKey: input.bucket,
                role: "accountable_owner",
                scope: "outcome"
              }
            ]
          : [],
      effectiveAt: new Date().toISOString(),
      handoffNotes: hasCurrentOwner(responsibility)
        ? "Moved through card distribution."
        : undefined,
      revisitAt: hasCurrentOwner(responsibility)
        ? defaultRevisitAt()
        : undefined
    });
  }

  return updateResponsibilityBoardPlacement({
    actorPersonaId: session.selectedPersonaId ?? undefined,
    householdId: session.householdId,
    responsibilityId: input.responsibilityId,
    sortOrder: input.sortOrder ?? 0,
    toLane: laneForBucket(input.bucket)
  });
}

function hasCurrentOwner(responsibility: {
  currentAssignments: Array<{ role: string }>;
}) {
  return responsibility.currentAssignments.some(
    (assignment) =>
      assignment.role === "accountable_owner" || assignment.role === "shared_owner"
  );
}

function sameAssignmentBucket(
  assignments: Array<{ personaKey: string; role: string }>,
  bucket: CardDistributionBucket
) {
  const owners = assignments
    .filter(
      (assignment) =>
        assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner"
    )
    .map((assignment) => assignment.personaKey)
    .sort();

  if (bucket === "alex" || bucket === "max") {
    return owners.length === 1 && owners[0] === bucket;
  }

  return owners.length === 0;
}

function defaultRevisitAt() {
  const revisitAt = new Date();
  revisitAt.setDate(revisitAt.getDate() + 7);
  return revisitAt.toISOString();
}
