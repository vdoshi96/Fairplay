import type {
  Cadence,
  HiddenEffortKey,
  ResponsibilityStatus,
  Visibility
} from "../../domain/enums";
import type { LoadSignalAssignment, LoadSignalResponsibility } from "../../domain/load-signals";

export function makeLoadSignalAssignment(
  overrides: Partial<LoadSignalAssignment> = {}
): LoadSignalAssignment {
  return {
    personaKey: "alex",
    role: "accountable_owner",
    scope: "outcome",
    ...overrides
  };
}

export function makeLoadSignalResponsibility(
  overrides: Partial<LoadSignalResponsibility> = {}
): LoadSignalResponsibility {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    areaKeys: ["home_base"],
    hiddenEffortKeys: ["doing"],
    cadence: "weekly",
    status: "active",
    currentAssignments: [makeLoadSignalAssignment()],
    nextReviewAt: null,
    ...overrides
  };
}

export type DomainFactoryOptions = {
  cadence?: Cadence;
  hiddenEffortKeys?: readonly HiddenEffortKey[];
  status?: ResponsibilityStatus;
  visibility?: Visibility;
};
