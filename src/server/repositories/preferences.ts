import type { PersonaOnboardingPreferences } from "@prisma/client";

import type {
  OnboardingPreferences,
  OnboardingPreferencesMutation
} from "../../contracts/preferences";
import type { PersonaId } from "../../domain/ids";
import { prisma } from "../db/prisma";

function isoOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value === null ? null : new Date(value);
}

function nullableIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toOnboardingPreferences(
  preferences: PersonaOnboardingPreferences
): OnboardingPreferences {
  return {
    personaId: preferences.personaId,
    welcomeDismissedAt: nullableIso(preferences.welcomeDismissedAt),
    crashCourseSkippedAt: nullableIso(preferences.crashCourseSkippedAt),
    crashCourseCompletedAt: nullableIso(preferences.crashCourseCompletedAt),
    crashCourseCurrentStep: preferences.crashCourseCurrentStep,
    crashCourseReplayRequestedAt: nullableIso(
      preferences.crashCourseReplayRequestedAt
    ),
    updatedAt: preferences.updatedAt.toISOString()
  };
}

export async function getOnboardingPreferences(
  personaId: PersonaId
): Promise<OnboardingPreferences> {
  const preferences = await prisma.personaOnboardingPreferences.upsert({
    where: { personaId },
    update: {},
    create: { personaId }
  });

  return toOnboardingPreferences(preferences);
}

export async function updateOnboardingPreferences(
  personaId: PersonaId,
  input: OnboardingPreferencesMutation
): Promise<OnboardingPreferences> {
  const preferences = await prisma.personaOnboardingPreferences.upsert({
    where: { personaId },
    update: {
      welcomeDismissedAt: isoOrNull(input.welcomeDismissedAt),
      crashCourseSkippedAt: isoOrNull(input.crashCourseSkippedAt),
      crashCourseCompletedAt: isoOrNull(input.crashCourseCompletedAt),
      crashCourseCurrentStep: input.crashCourseCurrentStep,
      crashCourseReplayRequestedAt: isoOrNull(input.crashCourseReplayRequestedAt)
    },
    create: {
      personaId,
      welcomeDismissedAt: isoOrNull(input.welcomeDismissedAt),
      crashCourseSkippedAt: isoOrNull(input.crashCourseSkippedAt),
      crashCourseCompletedAt: isoOrNull(input.crashCourseCompletedAt),
      crashCourseCurrentStep: input.crashCourseCurrentStep ?? 0,
      crashCourseReplayRequestedAt: isoOrNull(input.crashCourseReplayRequestedAt)
    }
  });

  return toOnboardingPreferences(preferences);
}

export async function replayWelcome(
  personaId: PersonaId,
  replayRequestedAt = new Date().toISOString()
): Promise<OnboardingPreferences> {
  return updateOnboardingPreferences(personaId, {
    welcomeDismissedAt: null,
    crashCourseReplayRequestedAt: replayRequestedAt
  });
}
