import { describe, expect, it } from "vitest";

import {
  CheckInAgendaSchema,
  CheckInCompleteMutationSchema,
  CheckInCreateSchema,
  CheckInItemDecisionMutationSchema
} from "./check-ins";

describe("check-in JSON contracts", () => {
  it("accepts create, agenda, item decision, and complete contracts", () => {
    const checkInId = "550e8400-e29b-41d4-a716-446655440030";
    const itemId = "550e8400-e29b-41d4-a716-446655440031";

    expect(
      CheckInCreateSchema.parse({
        scheduledFor: "2026-05-10T15:00:00.000Z",
        facilitatorPersonaKey: "alex",
        radarItemIds: ["550e8400-e29b-41d4-a716-446655440020"],
        responsibilityIds: ["550e8400-e29b-41d4-a716-446655440010"]
      })
    ).toMatchObject({ facilitatorPersonaKey: "alex" });

    expect(
      CheckInAgendaSchema.parse({
        id: checkInId,
        state: "scheduled",
        scheduledFor: "2026-05-10T15:00:00.000Z",
        facilitatorPersonaKey: "alex",
        items: [
          {
            id: itemId,
            itemType: "radar",
            state: "queued",
            promptKey: "clarify_next_step",
            radarItemId: "550e8400-e29b-41d4-a716-446655440020",
            responsibilityId: null,
            sortOrder: 1
          }
        ]
      })
    ).toMatchObject({ id: checkInId });

    expect(
      CheckInItemDecisionMutationSchema.parse({
        checkInId,
        itemId,
        state: "discussed",
        response: "We agreed on the next review date.",
        decision: {
          decisionType: "schedule_review",
          summary: "Review the appointment flow next month.",
          effectiveAt: "2026-05-10T15:30:00.000Z",
          reviewOn: "2026-06-10T15:30:00.000Z",
          responsibilityId: "550e8400-e29b-41d4-a716-446655440010"
        }
      })
    ).toMatchObject({ state: "discussed" });

    expect(
      CheckInCompleteMutationSchema.parse({
        id: checkInId,
        completedAt: "2026-05-10T16:00:00.000Z",
        summary: "Decisions and deferred items were recorded."
      })
    ).toMatchObject({ id: checkInId });
  });
});
