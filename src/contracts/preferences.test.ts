import { describe, expect, it } from "vitest";

import {
  LittleAlexPreferencesMutationSchema,
  LittleAlexPreferencesSchema,
  LITTLE_ALEX_DEFAULT_PREFERENCES,
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

describe("Little Alex preferences contracts", () => {
  it("accepts persona-scoped Little Alex customization", () => {
    const preferences = LittleAlexPreferencesSchema.parse({
      personaId: "550e8400-e29b-41d4-a716-446655440020",
      genderPresentation: "feminine",
      chatPhrase: "hello little alex",
      skinTone: "tone_4",
      hairColor: "auburn",
      updatedAt: "2026-05-06T12:00:00.000Z"
    });

    expect(preferences.chatPhrase).toBe("hello little alex");
    expect(preferences.skinTone).toBe("tone_4");
    expect(preferences.hairColor).toBe("auburn");
  });

  it("defaults Little Alex to the help phrase and neutral appearance", () => {
    expect(LITTLE_ALEX_DEFAULT_PREFERENCES).toEqual({
      genderPresentation: "neutral",
      chatPhrase: "Help!",
      skinTone: "tone_2",
      hairColor: "dark_brown"
    });
  });

  it("validates Little Alex preference updates", () => {
    expect(
      LittleAlexPreferencesMutationSchema.parse({
        genderPresentation: "masculine",
        chatPhrase: "taskmaster",
        skinTone: "tone_5",
        hairColor: "silver"
      })
    ).toMatchObject({ chatPhrase: "taskmaster", hairColor: "silver" });

    expect(() =>
      LittleAlexPreferencesMutationSchema.parse({
        chatPhrase: "this phrase is definitely longer than thirty characters"
      })
    ).toThrow();

    expect(() =>
      LittleAlexPreferencesMutationSchema.parse({
        chatPhrase: ""
      })
    ).toThrow();

    expect(() =>
      LittleAlexPreferencesMutationSchema.parse({
        hairColor: "purple"
      })
    ).toThrow();
  });
});
