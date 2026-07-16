import { describe, expect, it } from "vitest";

import { OwnershipAgreementMutationSchema } from "./ownership-agreement";

const responsibilityId = "550e8400-e29b-41d4-a716-446655440010";

describe("ownership agreement JSON contract", () => {
  it("accepts accountable, shared, helper, backup, review, and handoff fields", () => {
    expect(
      OwnershipAgreementMutationSchema.parse({
        responsibilityId,
        expectedUpdatedAt: "2026-05-04T12:00:00.000Z",
        expectedOwnerPersonaKeys: ["alex", "max"],
        assignments: [
          { personaKey: "alex", role: "shared_owner", scope: "outcome" },
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: "2026-08-01T12:00:00.000Z",
        handoffMode: "retain_former_owner_as_helper",
        handoffNotes: "Keep the list and timing context with the card."
      })
    ).toMatchObject({
      responsibilityId,
      handoffMode: "retain_former_owner_as_helper"
    });

    expect(
      OwnershipAgreementMutationSchema.parse({
        responsibilityId,
        expectedUpdatedAt: "2026-05-04T12:00:00.000Z",
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
          { personaKey: "max", role: "backup", scope: "temporary" }
        ],
        reviewAt: null
      }).reviewAt
    ).toBeNull();
  });

  it("rejects duplicate personas, ownerless agreements, and multiple accountable owners", () => {
    const invalidAssignments = [
      [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
        { personaKey: "alex", role: "helper", scope: "support" }
      ],
      [
        { personaKey: "alex", role: "helper", scope: "support" },
        { personaKey: "max", role: "backup", scope: "temporary" }
      ],
      [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      [
        { personaKey: "alex", role: "shared_owner", scope: "outcome" },
        { personaKey: "max", role: "helper", scope: "support" }
      ]
    ];

    invalidAssignments.forEach((assignments) => {
      expect(() =>
        OwnershipAgreementMutationSchema.parse({
          responsibilityId,
          expectedUpdatedAt: "2026-05-04T12:00:00.000Z",
          expectedOwnerPersonaKeys: ["alex"],
          assignments,
          reviewAt: null
        })
      ).toThrow();
    });
  });

  it("keeps handoff mode optional at the JSON boundary for initially unowned cards", () => {
    expect(
      OwnershipAgreementMutationSchema.parse({
        responsibilityId,
        expectedUpdatedAt: "2026-05-04T12:00:00.000Z",
        expectedOwnerPersonaKeys: [],
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null
      })
    ).not.toHaveProperty("handoffMode");
  });
});
