import type {
  PersonaLittleAlexPreferences,
  PersonaOnboardingPreferences
} from "@prisma/client";

import type {
  LittleAlexPreferences,
  LittleAlexPreferencesMutation,
  OnboardingPreferences,
  OnboardingPreferencesMutation
} from "../../contracts/preferences";
import { LITTLE_ALEX_DEFAULT_PREFERENCES } from "../../contracts/preferences";
import type { PersonaId } from "../../domain/ids";
import { isUniqueConstraintError } from "../db/errors";
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

function toLittleAlexPreferences(
  preferences: PersonaLittleAlexPreferences
): LittleAlexPreferences {
  return {
    personaId: preferences.personaId,
    genderPresentation: preferences.genderPresentation,
    chatPhrase: preferences.chatPhrase,
    skinTone: preferences.skinTone,
    updatedAt: preferences.updatedAt.toISOString()
  };
}

export async function getOnboardingPreferences(
  personaId: PersonaId
): Promise<OnboardingPreferences> {
  const preferences = await getOrCreateOnboardingPreferences(personaId);

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

export async function getLittleAlexPreferences(
  personaId: PersonaId
): Promise<LittleAlexPreferences> {
  const preferences = await getOrCreateLittleAlexPreferences(personaId);

  return toLittleAlexPreferences(preferences);
}

export async function updateLittleAlexPreferences(
  personaId: PersonaId,
  input: LittleAlexPreferencesMutation
): Promise<LittleAlexPreferences> {
  const preferences = await prisma.personaLittleAlexPreferences.upsert({
    where: { personaId },
    update: {
      genderPresentation: input.genderPresentation,
      chatPhrase: input.chatPhrase,
      skinTone: input.skinTone
    },
    create: {
      personaId,
      ...LITTLE_ALEX_DEFAULT_PREFERENCES,
      ...input
    }
  });

  return toLittleAlexPreferences(preferences);
}

async function getOrCreateOnboardingPreferences(personaId: PersonaId) {
  try {
    return await prisma.personaOnboardingPreferences.upsert({
      where: { personaId },
      update: {},
      create: { personaId }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const preferences = await prisma.personaOnboardingPreferences.findUnique({
      where: { personaId }
    });

    if (!preferences) {
      throw error;
    }

    return preferences;
  }
}

async function getOrCreateLittleAlexPreferences(personaId: PersonaId) {
  try {
    return await prisma.personaLittleAlexPreferences.upsert({
      where: { personaId },
      update: {},
      create: {
        personaId,
        ...LITTLE_ALEX_DEFAULT_PREFERENCES
      }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const preferences = await prisma.personaLittleAlexPreferences.findUnique({
      where: { personaId }
    });

    if (!preferences) {
      throw error;
    }

    return preferences;
  }
}
