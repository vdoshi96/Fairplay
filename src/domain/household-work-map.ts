import type {
  HouseholdWorkMap,
  PersonaWorkMapSummary
} from "@/contracts/household-work-map";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import {
  HIDDEN_EFFORT_KEYS,
  PERSONA_KEYS,
  type AssignmentRole,
  type Cadence,
  type HiddenEffortKey,
  type PersonaKey,
  type ResponsibilityStatus
} from "@/domain/enums";
import { isResponsibilityWorthReviewingAt } from "@/domain/responsibility-review";

export type ComputeHouseholdWorkMapInput = {
  responsibilities: readonly ResponsibilitySummary[];
  asOf?: string | Date;
};

const WORKLOAD_STATUSES: ReadonlySet<ResponsibilityStatus> = new Set([
  "active",
  "needs_review"
]);

const OWNER_ROLES: ReadonlySet<AssignmentRole> = new Set([
  "accountable_owner",
  "shared_owner"
]);

const HIGH_FREQUENCY_CADENCES: ReadonlySet<Cadence> = new Set([
  "daily",
  "weekly"
]);

function emptyHiddenEffort(): Record<HiddenEffortKey, number> {
  return Object.fromEntries(
    HIDDEN_EFFORT_KEYS.map((key) => [key, 0])
  ) as Record<HiddenEffortKey, number>;
}

function emptyPersonaSummary(): PersonaWorkMapSummary {
  return {
    owned: 0,
    sharedOwned: 0,
    highFrequency: 0,
    dueReview: 0,
    hiddenEffort: emptyHiddenEffort()
  };
}

function asOfTime(value: string | Date | undefined): number {
  const resolved = value === undefined ? new Date() : new Date(value);
  const time = resolved.getTime();

  if (Number.isNaN(time)) {
    throw new RangeError("Household work map asOf must be a valid date.");
  }

  return time;
}

function ownerPersonas(
  responsibility: ResponsibilitySummary
): ReadonlySet<PersonaKey> {
  return new Set(
    responsibility.currentAssignments
      .filter((assignment) => OWNER_ROLES.has(assignment.role))
      .map((assignment) => assignment.personaKey)
  );
}

function sharedOwnerPersonas(
  responsibility: ResponsibilitySummary
): ReadonlySet<PersonaKey> {
  return new Set(
    responsibility.currentAssignments
      .filter((assignment) => assignment.role === "shared_owner")
      .map((assignment) => assignment.personaKey)
  );
}

export function computeHouseholdWorkMap(
  input: ComputeHouseholdWorkMapInput
): HouseholdWorkMap {
  const asOf = asOfTime(input.asOf);
  const personas: Record<PersonaKey, PersonaWorkMapSummary> = {
    alex: emptyPersonaSummary(),
    max: emptyPersonaSummary()
  };
  const household: HouseholdWorkMap["household"] = {
    shared: 0,
    unassigned: 0,
    paused: 0,
    notApplicable: 0,
    dueReview: 0
  };

  for (const responsibility of input.responsibilities) {
    if (responsibility.status === "paused") {
      household.paused += 1;
    } else if (responsibility.status === "not_relevant") {
      household.notApplicable += 1;
    }

    if (!WORKLOAD_STATUSES.has(responsibility.status)) {
      continue;
    }

    const owners = ownerPersonas(responsibility);
    const sharedOwners = sharedOwnerPersonas(responsibility);
    const dueReview = isResponsibilityWorthReviewingAt(responsibility, asOf);

    if (owners.size === 0) {
      household.unassigned += 1;
    }

    if (sharedOwners.size > 0) {
      household.shared += 1;
    }

    if (dueReview) {
      household.dueReview += 1;
    }

    for (const personaKey of PERSONA_KEYS) {
      if (!owners.has(personaKey)) {
        continue;
      }

      const persona = personas[personaKey];
      persona.owned += 1;

      if (sharedOwners.has(personaKey)) {
        persona.sharedOwned += 1;
      }

      if (HIGH_FREQUENCY_CADENCES.has(responsibility.cadence)) {
        persona.highFrequency += 1;
      }

      if (dueReview) {
        persona.dueReview += 1;
      }

      for (const effortKey of new Set(responsibility.hiddenEffortKeys)) {
        persona.hiddenEffort[effortKey] += 1;
      }
    }
  }

  return { personas, household };
}
