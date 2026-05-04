import { describe, expect, it } from "vitest";

import {
  ASSIGNMENT_ROLES,
  ASSIGNMENT_SCOPES,
  CADENCES,
  CHECK_IN_ITEM_STATES,
  CHECK_IN_STATES,
  DECISION_TYPES,
  HIDDEN_EFFORT_KEYS,
  PERSONA_KEYS,
  RADAR_REASON_KEYS,
  RADAR_STATES,
  RESPONSIBILITY_STATUSES,
  SOURCE_REVIEW_STATUSES,
  URGENCIES,
  VISIBILITIES,
  AssignmentRoleSchema,
  AssignmentScopeSchema,
  CadenceSchema,
  CheckInItemStateSchema,
  CheckInStateSchema,
  DecisionTypeSchema,
  HiddenEffortKeySchema,
  PersonaKeySchema,
  RadarReasonKeySchema,
  RadarStateSchema,
  ResponsibilityStatusSchema,
  SourceReviewStatusSchema,
  UrgencySchema,
  VisibilitySchema,
  RESPONSIBILITY_BOARD_LANES,
  ResponsibilityBoardLaneSchema,
  assertValidPersonaKey
} from "./enums";

describe("domain enum contracts", () => {
  it("exports the exact v1 enum arrays", () => {
    expect(PERSONA_KEYS).toEqual(["alex", "max"]);
    expect(RESPONSIBILITY_STATUSES).toEqual([
      "unassigned",
      "active",
      "needs_review",
      "paused",
      "not_relevant",
      "archived"
    ]);
    expect(ASSIGNMENT_ROLES).toEqual([
      "accountable_owner",
      "shared_owner",
      "helper",
      "backup"
    ]);
    expect(ASSIGNMENT_SCOPES).toEqual([
      "outcome",
      "part",
      "support",
      "temporary"
    ]);
    expect(VISIBILITIES).toEqual([
      "private",
      "shared_household",
      "partner_visible",
      "check_in_only"
    ]);
    expect(CADENCES).toEqual([
      "daily",
      "weekly",
      "monthly",
      "seasonal",
      "event_based",
      "as_needed",
      "one_time"
    ]);
    expect(HIDDEN_EFFORT_KEYS).toEqual([
      "noticing",
      "planning",
      "doing",
      "follow_through",
      "emotional_attention"
    ]);
    expect(RADAR_REASON_KEYS).toEqual([
      "unclear_expectation",
      "blocked",
      "too_much",
      "handoff_needed",
      "review_due",
      "other"
    ]);
    expect(URGENCIES).toEqual(["low", "normal", "soon"]);
    expect(RADAR_STATES).toEqual([
      "draft",
      "open",
      "scheduled",
      "discussed",
      "resolved",
      "dismissed",
      "deferred"
    ]);
    expect(CHECK_IN_STATES).toEqual([
      "draft",
      "scheduled",
      "active",
      "completed",
      "skipped"
    ]);
    expect(CHECK_IN_ITEM_STATES).toEqual([
      "queued",
      "discussed",
      "deferred",
      "skipped"
    ]);
    expect(DECISION_TYPES).toEqual([
      "assign_owner",
      "change_role",
      "change_standard",
      "change_cadence",
      "pause",
      "mark_not_relevant",
      "archive",
      "schedule_review",
      "custom_note"
    ]);
    expect(SOURCE_REVIEW_STATUSES).toEqual([
      "not_reviewed",
      "approved_original",
      "blocked",
      "needs_review"
    ]);
    expect(RESPONSIBILITY_BOARD_LANES).toEqual([
      "cards_of_concern",
      "player_1",
      "player_2",
      "kid_split",
      "not_in_play",
      "trimmed"
    ]);
  });

  it("provides Zod schemas for every enum", () => {
    expect(PersonaKeySchema.parse("alex")).toBe("alex");
    expect(ResponsibilityStatusSchema.parse("needs_review")).toBe("needs_review");
    expect(AssignmentRoleSchema.parse("accountable_owner")).toBe("accountable_owner");
    expect(AssignmentScopeSchema.parse("outcome")).toBe("outcome");
    expect(VisibilitySchema.parse("check_in_only")).toBe("check_in_only");
    expect(CadenceSchema.parse("daily")).toBe("daily");
    expect(HiddenEffortKeySchema.parse("follow_through")).toBe("follow_through");
    expect(RadarReasonKeySchema.parse("unclear_expectation")).toBe("unclear_expectation");
    expect(UrgencySchema.parse("normal")).toBe("normal");
    expect(RadarStateSchema.parse("open")).toBe("open");
    expect(CheckInStateSchema.parse("scheduled")).toBe("scheduled");
    expect(CheckInItemStateSchema.parse("queued")).toBe("queued");
    expect(DecisionTypeSchema.parse("schedule_review")).toBe("schedule_review");
    expect(SourceReviewStatusSchema.parse("approved_original")).toBe("approved_original");
    expect(ResponsibilityBoardLaneSchema.parse("not_in_play")).toBe("not_in_play");
  });

  it("rejects invalid board lanes", () => {
    expect(() => ResponsibilityBoardLaneSchema.parse("backlog")).toThrow();
  });

  it("asserts valid persona keys", () => {
    expect(assertValidPersonaKey("max")).toBe("max");
    expect(() => assertValidPersonaKey("sam")).toThrow(/Invalid persona key/);
  });
});
