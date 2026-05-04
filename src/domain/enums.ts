import { z } from "zod";

export const PERSONA_KEYS = ["alex", "max"] as const;
export const RESPONSIBILITY_STATUSES = [
  "unassigned",
  "active",
  "needs_review",
  "paused",
  "not_relevant",
  "archived"
] as const;
export const ASSIGNMENT_ROLES = [
  "accountable_owner",
  "shared_owner",
  "helper",
  "backup"
] as const;
export const ASSIGNMENT_SCOPES = [
  "outcome",
  "part",
  "support",
  "temporary"
] as const;
export const VISIBILITIES = [
  "private",
  "shared_household",
  "partner_visible",
  "check_in_only"
] as const;
export const CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "event_based",
  "as_needed",
  "one_time"
] as const;
export const HIDDEN_EFFORT_KEYS = [
  "noticing",
  "planning",
  "doing",
  "follow_through",
  "emotional_attention"
] as const;
export const RADAR_REASON_KEYS = [
  "unclear_expectation",
  "blocked",
  "too_much",
  "handoff_needed",
  "review_due",
  "other"
] as const;
export const URGENCIES = ["low", "normal", "soon"] as const;
export const RADAR_STATES = [
  "draft",
  "open",
  "scheduled",
  "discussed",
  "resolved",
  "dismissed",
  "deferred"
] as const;
export const CHECK_IN_STATES = [
  "draft",
  "scheduled",
  "active",
  "completed",
  "skipped"
] as const;
export const CHECK_IN_ITEM_STATES = [
  "queued",
  "discussed",
  "deferred",
  "skipped"
] as const;
export const DECISION_TYPES = [
  "assign_owner",
  "change_role",
  "change_standard",
  "change_cadence",
  "pause",
  "mark_not_relevant",
  "archive",
  "schedule_review",
  "custom_note"
] as const;
export const SOURCE_REVIEW_STATUSES = [
  "not_reviewed",
  "approved_original",
  "blocked",
  "needs_review"
] as const;

export const PersonaKeySchema = z.enum(PERSONA_KEYS);
export const ResponsibilityStatusSchema = z.enum(RESPONSIBILITY_STATUSES);
export const AssignmentRoleSchema = z.enum(ASSIGNMENT_ROLES);
export const AssignmentScopeSchema = z.enum(ASSIGNMENT_SCOPES);
export const VisibilitySchema = z.enum(VISIBILITIES);
export const CadenceSchema = z.enum(CADENCES);
export const HiddenEffortKeySchema = z.enum(HIDDEN_EFFORT_KEYS);
export const RadarReasonKeySchema = z.enum(RADAR_REASON_KEYS);
export const UrgencySchema = z.enum(URGENCIES);
export const RadarStateSchema = z.enum(RADAR_STATES);
export const CheckInStateSchema = z.enum(CHECK_IN_STATES);
export const CheckInItemStateSchema = z.enum(CHECK_IN_ITEM_STATES);
export const DecisionTypeSchema = z.enum(DECISION_TYPES);
export const SourceReviewStatusSchema = z.enum(SOURCE_REVIEW_STATUSES);

export type PersonaKey = z.infer<typeof PersonaKeySchema>;
export type ResponsibilityStatus = z.infer<typeof ResponsibilityStatusSchema>;
export type AssignmentRole = z.infer<typeof AssignmentRoleSchema>;
export type AssignmentScope = z.infer<typeof AssignmentScopeSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;
export type Cadence = z.infer<typeof CadenceSchema>;
export type HiddenEffortKey = z.infer<typeof HiddenEffortKeySchema>;
export type RadarReasonKey = z.infer<typeof RadarReasonKeySchema>;
export type Urgency = z.infer<typeof UrgencySchema>;
export type RadarState = z.infer<typeof RadarStateSchema>;
export type CheckInState = z.infer<typeof CheckInStateSchema>;
export type CheckInItemState = z.infer<typeof CheckInItemStateSchema>;
export type DecisionType = z.infer<typeof DecisionTypeSchema>;
export type SourceReviewStatus = z.infer<typeof SourceReviewStatusSchema>;

export function assertValidPersonaKey(value: unknown): PersonaKey {
  const result = PersonaKeySchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid persona key: ${String(value)}`);
  }

  return result.data;
}
