import {
  CADENCES,
  HIDDEN_EFFORT_KEYS,
  type AssignmentRole,
  type AssignmentScope,
  type Cadence,
  type HiddenEffortKey,
  type PersonaKey,
  type RadarState,
  type ResponsibilityStatus
} from "./enums";

export type LoadSignalAssignment = {
  personaKey: PersonaKey;
  role: AssignmentRole;
  scope: AssignmentScope;
};

export type LoadSignalResponsibility = {
  id: string;
  areaKeys: readonly string[];
  hiddenEffortKeys: readonly HiddenEffortKey[];
  cadence: Cadence;
  status: ResponsibilityStatus;
  currentAssignments: readonly LoadSignalAssignment[];
  nextReviewAt?: string | null;
};

export type LoadSignalRadarItem = {
  id: string;
  state: RadarState;
};

export type ComputeLoadSignalsInput = {
  responsibilities: readonly LoadSignalResponsibility[];
  radarItems: readonly LoadSignalRadarItem[];
  asOf?: string | Date;
};

export type LoadSignals = {
  totalResponsibilities: number;
  ownerDistribution: Record<PersonaKey | "unassigned", number>;
  sharedResponsibilityCount: number;
  highFrequencyCount: number;
  openRadarCount: number;
  dueForReviewCount: number;
  pausedOrNotRelevantCount: number;
  hiddenEffortMix: Record<HiddenEffortKey, number>;
  areaMix: Record<string, number>;
  cadenceDistribution: Record<Cadence, number>;
};

const OWNER_ROLES: ReadonlySet<AssignmentRole> = new Set([
  "accountable_owner",
  "shared_owner"
]);

const HIGH_FREQUENCY_CADENCES: ReadonlySet<Cadence> = new Set([
  "daily",
  "weekly"
]);

const OPEN_RADAR_STATES: ReadonlySet<RadarState> = new Set([
  "open",
  "scheduled"
]);

export function computeLoadSignals(input: ComputeLoadSignalsInput): LoadSignals {
  const asOf = input.asOf ? new Date(input.asOf) : new Date();
  const hiddenEffortMix = Object.fromEntries(
    HIDDEN_EFFORT_KEYS.map((key) => [key, 0])
  ) as Record<HiddenEffortKey, number>;
  const cadenceDistribution = Object.fromEntries(
    CADENCES.map((cadence) => [cadence, 0])
  ) as Record<Cadence, number>;
  const ownerDistribution: Record<PersonaKey | "unassigned", number> = {
    alex: 0,
    max: 0,
    unassigned: 0
  };
  const areaMix: Record<string, number> = {};

  let sharedResponsibilityCount = 0;
  let highFrequencyCount = 0;
  let dueForReviewCount = 0;
  let pausedOrNotRelevantCount = 0;

  for (const responsibility of input.responsibilities) {
    const ownerAssignments = responsibility.currentAssignments.filter((assignment) =>
      OWNER_ROLES.has(assignment.role)
    );

    if (ownerAssignments.length === 0) {
      ownerDistribution.unassigned += 1;
    }

    for (const assignment of ownerAssignments) {
      ownerDistribution[assignment.personaKey] += 1;
    }

    if (
      responsibility.currentAssignments.some(
        (assignment) => assignment.role === "shared_owner"
      )
    ) {
      sharedResponsibilityCount += 1;
    }

    if (HIGH_FREQUENCY_CADENCES.has(responsibility.cadence)) {
      highFrequencyCount += 1;
    }

    if (
      responsibility.nextReviewAt &&
      new Date(responsibility.nextReviewAt).getTime() <= asOf.getTime()
    ) {
      dueForReviewCount += 1;
    }

    if (
      responsibility.status === "paused" ||
      responsibility.status === "not_relevant"
    ) {
      pausedOrNotRelevantCount += 1;
    }

    cadenceDistribution[responsibility.cadence] += 1;

    for (const effortKey of responsibility.hiddenEffortKeys) {
      hiddenEffortMix[effortKey] += 1;
    }

    for (const areaKey of responsibility.areaKeys) {
      areaMix[areaKey] = (areaMix[areaKey] ?? 0) + 1;
    }
  }

  return {
    totalResponsibilities: input.responsibilities.length,
    ownerDistribution,
    sharedResponsibilityCount,
    highFrequencyCount,
    openRadarCount: input.radarItems.filter((item) =>
      OPEN_RADAR_STATES.has(item.state)
    ).length,
    dueForReviewCount,
    pausedOrNotRelevantCount,
    hiddenEffortMix,
    areaMix,
    cadenceDistribution
  };
}
