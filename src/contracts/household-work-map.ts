import { z } from "zod";

const WorkMapCountSchema = z.number().int().nonnegative();

export const HouseholdWorkMapHiddenEffortSchema = z
  .object({
    noticing: WorkMapCountSchema,
    planning: WorkMapCountSchema,
    doing: WorkMapCountSchema,
    follow_through: WorkMapCountSchema,
    emotional_attention: WorkMapCountSchema
  })
  .strict();

export const PersonaWorkMapSummarySchema = z
  .object({
    owned: WorkMapCountSchema,
    sharedOwned: WorkMapCountSchema,
    highFrequency: WorkMapCountSchema,
    dueReview: WorkMapCountSchema,
    hiddenEffort: HouseholdWorkMapHiddenEffortSchema
  })
  .strict();

export const HouseholdWorkMapTotalsSchema = z
  .object({
    shared: WorkMapCountSchema,
    unassigned: WorkMapCountSchema,
    paused: WorkMapCountSchema,
    notApplicable: WorkMapCountSchema,
    dueReview: WorkMapCountSchema
  })
  .strict();

export const HouseholdWorkMapSchema = z
  .object({
    personas: z
      .object({
        alex: PersonaWorkMapSummarySchema,
        max: PersonaWorkMapSummarySchema
      })
      .strict(),
    household: HouseholdWorkMapTotalsSchema
  })
  .strict();

export type HouseholdWorkMapHiddenEffort = z.infer<
  typeof HouseholdWorkMapHiddenEffortSchema
>;
export type PersonaWorkMapSummary = z.infer<typeof PersonaWorkMapSummarySchema>;
export type HouseholdWorkMapTotals = z.infer<typeof HouseholdWorkMapTotalsSchema>;
export type HouseholdWorkMap = z.infer<typeof HouseholdWorkMapSchema>;
