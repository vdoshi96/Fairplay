import { z } from "zod";

import { PersonaIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";
import {
  LITTLE_ALEX_HAIR_COLORS,
  LITTLE_ALEX_HAIR_COLOR_COLORS,
  LITTLE_ALEX_SKIN_TONES,
  LITTLE_ALEX_SKIN_TONE_COLORS
} from "./little-alex";

export {
  LITTLE_ALEX_HAIR_COLORS,
  LITTLE_ALEX_HAIR_COLOR_COLORS,
  LITTLE_ALEX_SKIN_TONES,
  LITTLE_ALEX_SKIN_TONE_COLORS
};

export const LITTLE_ALEX_DEFAULT_PREFERENCES = {
  genderPresentation: "neutral",
  chatPhrase: "Help!",
  skinTone: "tone_2",
  hairColor: "dark_brown"
} as const;

export const LittleAlexGenderPresentationSchema = z.enum([
  "neutral",
  "masculine",
  "feminine"
]);

export const LittleAlexSkinToneSchema = z.enum(LITTLE_ALEX_SKIN_TONES);
export const LittleAlexHairColorSchema = z.enum(LITTLE_ALEX_HAIR_COLORS);

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
    hairColor: LittleAlexHairColorSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const LittleAlexPreferencesMutationSchema = z
  .object({
    genderPresentation: LittleAlexGenderPresentationSchema.optional(),
    chatPhrase: z.string().trim().min(1).max(30).optional(),
    skinTone: LittleAlexSkinToneSchema.optional(),
    hairColor: LittleAlexHairColorSchema.optional()
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
export type LittleAlexHairColor = z.infer<typeof LittleAlexHairColorSchema>;
export type LittleAlexPreferences = z.infer<typeof LittleAlexPreferencesSchema>;
export type LittleAlexPreferencesMutation = z.infer<
  typeof LittleAlexPreferencesMutationSchema
>;
