import { describe, expect, it } from "vitest";

import {
  OnboardingPreferencesMutationSchema,
  OnboardingPreferencesSchema
} from "./preferences";

describe("onboarding preferences contracts", () => {
  it("persists crash course and welcome state by persona", () => {
    const preferences = OnboardingPreferencesSchema.parse({
      personaId: "550e8400-e29b-41d4-a716-446655440020",
      welcomeDismissedAt: null,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 3,
      crashCourseReplayRequestedAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-05-04T12:00:00.000Z"
    });

    expect(preferences.crashCourseCurrentStep).toBe(3);
  });

  it("validates preference updates", () => {
    expect(
      OnboardingPreferencesMutationSchema.parse({
        welcomeDismissedAt: "2026-05-04T12:00:00.000Z",
        crashCourseCurrentStep: 1
      })
    ).toMatchObject({ crashCourseCurrentStep: 1 });

    expect(() =>
      OnboardingPreferencesMutationSchema.parse({
        crashCourseCurrentStep: -1
      })
    ).toThrow();
  });
});
