import type { ResponsibilityStatus } from "@/domain/enums";
import type { ResponsibilityId } from "@/domain/ids";
import {
  laneForBucket,
  type CardDistributionBucket
} from "@/domain/card-distribution";
import type { CurrentSession } from "@/server/auth/current-session";
import { applyResponsibilityCardDistribution } from "@/server/repositories/responsibilities";
import { ResponsibilityServiceError } from "./service";

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
  if (!session.selectedPersonaId) {
    throw new ResponsibilityServiceError(
      "AUTH_REQUIRED",
      "A selected persona is required."
    );
  }

  return applyResponsibilityCardDistribution({
    actorPersonaId: session.selectedPersonaId,
    handoffNotes: "Moved through card distribution.",
    householdId: session.householdId,
    responsibilityId: input.responsibilityId,
    sortOrder: input.sortOrder ?? 0,
    status: statusByDistributionBucket[input.bucket],
    targetOwnerPersonaKey:
      input.bucket === "alex" || input.bucket === "max" ? input.bucket : null,
    toLane: laneForBucket(input.bucket)
  });
}
