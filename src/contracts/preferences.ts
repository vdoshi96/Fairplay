import { z } from "zod";

import { PersonaIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";

export const LITTLE_ALEX_DEFAULT_PREFERENCES = {
  genderPresentation: "neutral",
  chatPhrase: "i'm little alex horne",
  skinTone: "tone_2"
} as const;

export const LittleAlexGenderPresentationSchema = z.enum([
  "neutral",
  "masculine",
  "feminine"
]);

export const LittleAlexSkinToneSchema = z.enum([
  "tone_1",
  "tone_2",
  "tone_3",
  "tone_4",
  "tone_5"
]);

export const OnboardingPreferencesSchema = z
  .object({
    personaId: PersonaIdSchema,
    welcomeDismissedAt: NullableIsoDateTimeSchema,
    crashCourseSkippedAt: NullableIsoDateTimeSchema,
    crashCourseCompletedAt: NullableIsoDateTimeSchema,
    crashCourseCurrentStep: z.number().int().min(0).max(20),
    crashCourseReplayRequestedAt: NullableIsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const OnboardingPreferencesMutationSchema = z
  .object({
    welcomeDismissedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseSkippedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseCompletedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseCurrentStep: z.number().int().min(0).max(20).optional(),
    crashCourseReplayRequestedAt: NullableIsoDateTimeSchema.optional()
  })
  .strict();

export const LittleAlexPreferencesSchema = z
  .object({
    personaId: PersonaIdSchema,
    genderPresentation: LittleAlexGenderPresentationSchema,
    chatPhrase: z.string().trim().min(1).max(30),
    skinTone: LittleAlexSkinToneSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const LittleAlexPreferencesMutationSchema = z
  .object({
    genderPresentation: LittleAlexGenderPresentationSchema.optional(),
    chatPhrase: z.string().trim().min(1).max(30).optional(),
    skinTone: LittleAlexSkinToneSchema.optional()
  })
  .strict();

export type OnboardingPreferences = z.infer<
  typeof OnboardingPreferencesSchema
>;
export type OnboardingPreferencesMutation = z.infer<
  typeof OnboardingPreferencesMutationSchema
>;
export type LittleAlexGenderPresentation = z.infer<
  typeof LittleAlexGenderPresentationSchema
>;
export type LittleAlexSkinTone = z.infer<typeof LittleAlexSkinToneSchema>;
export type LittleAlexPreferences = z.infer<typeof LittleAlexPreferencesSchema>;
export type LittleAlexPreferencesMutation = z.infer<
  typeof LittleAlexPreferencesMutationSchema
>;
