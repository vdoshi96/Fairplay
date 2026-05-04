import { z } from "zod";

import {
  HouseholdIdSchema,
  HouseholdUsernameSchema,
  PersonaIdSchema
} from "../domain/ids";
import { IsoDateTimeSchema, TimezoneSchema } from "../domain/time";
import { PersonaSummarySchema } from "./personas";

export const HouseholdSummarySchema = z
  .object({
    id: HouseholdIdSchema,
    name: z.string().trim().min(1).max(120),
    timezone: TimezoneSchema.optional()
  })
  .strict();

export const CreateHouseholdRequestSchema = z
  .object({
    householdName: z.string().trim().min(1).max(120),
    username: HouseholdUsernameSchema,
    password: z.string().min(12).max(1024),
    timezone: TimezoneSchema
  })
  .strict();

export const CreateHouseholdResponseSchema = z
  .object({
    household: HouseholdSummarySchema.required({ timezone: true }),
    personas: z.tuple([PersonaSummarySchema, PersonaSummarySchema]),
    requiresPersonaSelection: z.literal(true)
  })
  .strict();

export const LoginRequestSchema = z
  .object({
    username: HouseholdUsernameSchema,
    password: z.string().min(1).max(1024)
  })
  .strict();

export const LoginResponseSchema = z
  .object({
    household: HouseholdSummarySchema.omit({ timezone: true }),
    personas: z.tuple([PersonaSummarySchema, PersonaSummarySchema]),
    requiresPersonaSelection: z.literal(true)
  })
  .strict();

export const SelectPersonaRequestSchema = z
  .object({
    personaId: PersonaIdSchema
  })
  .strict();

export const SelectPersonaResponseSchema = z
  .object({
    session: z
      .object({
        householdId: HouseholdIdSchema,
        selectedPersonaId: PersonaIdSchema,
        expiresAt: IsoDateTimeSchema
      })
      .strict()
  })
  .strict();

export type HouseholdSummary = z.infer<typeof HouseholdSummarySchema>;
export type CreateHouseholdRequest = z.infer<typeof CreateHouseholdRequestSchema>;
export type CreateHouseholdResponse = z.infer<
  typeof CreateHouseholdResponseSchema
>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SelectPersonaRequest = z.infer<typeof SelectPersonaRequestSchema>;
export type SelectPersonaResponse = z.infer<typeof SelectPersonaResponseSchema>;
