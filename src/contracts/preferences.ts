import { z } from "zod";

import { PersonaIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";

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

export type OnboardingPreferences = z.infer<
  typeof OnboardingPreferencesSchema
>;
export type OnboardingPreferencesMutation = z.infer<
  typeof OnboardingPreferencesMutationSchema
>;
