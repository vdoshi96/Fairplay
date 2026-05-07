import type { LoadSnapshot } from "@prisma/client";

import type { LoadSnapshotSummary } from "../../contracts/responsibilities";
import { computeLoadSignals } from "../../domain/load-signals";
import type { HouseholdId } from "../../domain/ids";
import { prisma } from "../db/prisma";
import { listResponsibilitiesForHousehold } from "./responsibilities";

function asDistribution(value: unknown): Record<string, number> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, number>)
    : {};
}

function toLoadSnapshotSummary(snapshot: LoadSnapshot): LoadSnapshotSummary {
  return {
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    computedAt: snapshot.computedAt.toISOString(),
    ownerDistribution: asDistribution(snapshot.ownerDistribution),
    sharedDistribution: asDistribution(snapshot.sharedDistribution),
    areaDistribution: asDistribution(snapshot.areaDistribution),
    cadenceDistribution: asDistribution(snapshot.cadenceDistribution),
    reviewDueCount: snapshot.reviewDueCount,
    pausedOrNotRelevantCount: snapshot.pausedOrNotRelevantCount,
    hiddenEffortMix: asDistribution(snapshot.hiddenEffortMix)
  };
}

export async function computeAndStoreLoadSnapshot(input: {
  householdId: HouseholdId;
  periodStart: string | Date;
  periodEnd: string | Date;
  asOf?: string | Date;
}): Promise<LoadSnapshotSummary> {
  const responsibilities = await listResponsibilitiesForHousehold(input.householdId);
  const signals = computeLoadSignals({
    responsibilities,
    asOf: input.asOf
  });
  const computedAt = input.asOf ? new Date(input.asOf) : new Date();
  const snapshot = await prisma.loadSnapshot.create({
    data: {
      householdId: input.householdId,
      periodStart: new Date(input.periodStart),
      periodEnd: new Date(input.periodEnd),
      computedAt,
      ownerDistribution: signals.ownerDistribution,
      sharedDistribution: {
        shared: signals.sharedResponsibilityCount
      },
      areaDistribution: signals.areaMix,
      cadenceDistribution: signals.cadenceDistribution,
      reviewDueCount: signals.dueForReviewCount,
      pausedOrNotRelevantCount: signals.pausedOrNotRelevantCount,
      hiddenEffortMix: signals.hiddenEffortMix
    }
  });

  return toLoadSnapshotSummary(snapshot);
}
