import type { LoadSnapshotSummary } from "@/contracts/responsibilities";
import { computeLoadSignals } from "@/domain/load-signals";
import type { LoadSignalRadarItem } from "@/domain/load-signals";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";

export type BuildLoadSnapshotInput = {
  responsibilities: readonly ResponsibilitySummary[];
  radarItems: readonly LoadSignalRadarItem[];
  asOf?: string | Date;
  periodStart?: string | Date;
  periodEnd?: string | Date;
};

export function buildLoadSnapshot({
  responsibilities,
  radarItems,
  asOf,
  periodStart,
  periodEnd
}: BuildLoadSnapshotInput): LoadSnapshotSummary {
  const computedAt = asOf ? new Date(asOf) : new Date();
  const signals = computeLoadSignals({
    responsibilities,
    radarItems,
    asOf: computedAt
  });

  return {
    periodStart: (periodStart ? new Date(periodStart) : computedAt).toISOString(),
    periodEnd: (periodEnd ? new Date(periodEnd) : computedAt).toISOString(),
    computedAt: computedAt.toISOString(),
    ownerDistribution: signals.ownerDistribution,
    sharedDistribution: {
      shared: signals.sharedResponsibilityCount,
      solo:
        signals.totalResponsibilities - signals.sharedResponsibilityCount
    },
    areaDistribution: signals.areaMix,
    cadenceDistribution: signals.cadenceDistribution,
    reviewDueCount: signals.dueForReviewCount,
    radarOpenCount: signals.openRadarCount,
    pausedOrNotRelevantCount: signals.pausedOrNotRelevantCount,
    hiddenEffortMix: signals.hiddenEffortMix
  };
}
