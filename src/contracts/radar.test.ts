import { describe, expect, it } from "vitest";

import {
  RadarCreateSchema,
  RadarDeferMutationSchema,
  RadarDetailSchema,
  RadarPublishMutationSchema,
  RadarResolveMutationSchema,
  RadarSummarySchema,
  RadarUpdateSchema
} from "./radar";

describe("radar JSON contracts", () => {
  it("accepts the documented radar summary example", () => {
    expect(
      RadarSummarySchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        topic: "Clarify weekend grocery timing",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440010",
        reasonKey: "unclear_expectation",
        urgency: "normal",
        visibility: "check_in_only",
        state: "open"
      })
    ).toMatchObject({ topic: "Clarify weekend grocery timing" });
  });

  it("requires confirmation when publishing a private draft to shared or visible spaces", () => {
    expect(() =>
      RadarPublishMutationSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        fromVisibility: "private",
        visibility: "shared_household"
      })
    ).toThrow();

    expect(() =>
      RadarPublishMutationSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        fromVisibility: "private",
        visibility: "partner_visible",
        confirmPrivateDraftPublish: false
      })
    ).toThrow();

    expect(
      RadarPublishMutationSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        fromVisibility: "private",
        visibility: "check_in_only",
        confirmPrivateDraftPublish: true
      })
    ).toMatchObject({ visibility: "check_in_only" });
  });

  it("accepts detail, create, update, defer, and resolve contracts", () => {
    expect(
      RadarDetailSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        topic: "Clarify weekend grocery timing",
        notes: "A neutral household-authored note.",
        responsibilityId: null,
        reasonKey: "unclear_expectation",
        urgency: "normal",
        visibility: "private",
        state: "draft",
        targetCheckInId: null,
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        resolvedAt: null
      })
    ).toMatchObject({ state: "draft" });

    expect(
      RadarCreateSchema.parse({
        topic: "Review appointment follow-through",
        notes: null,
        responsibilityId: null,
        reasonKey: "review_due",
        urgency: "soon",
        visibility: "private"
      })
    ).toMatchObject({ visibility: "private" });

    expect(
      RadarUpdateSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        urgency: "low",
        state: "deferred"
      })
    ).toMatchObject({ urgency: "low" });

    expect(
      RadarDeferMutationSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        deferredUntil: "2026-05-11T00:00:00.000Z",
        note: "Revisit after the busy week."
      })
    ).toMatchObject({ id: "550e8400-e29b-41d4-a716-446655440020" });

    expect(
      RadarResolveMutationSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440020",
        resolvedAt: "2026-05-04T00:00:00.000Z",
        note: "Decision recorded."
      })
    ).toMatchObject({ resolvedAt: "2026-05-04T00:00:00.000Z" });
  });
});
