import { z } from "zod";

import {
  CheckInItemStateSchema,
  CheckInStateSchema,
  DecisionTypeSchema,
  PersonaKeySchema
} from "../domain/enums";
import {
  CheckInIdSchema,
  CheckInItemIdSchema,
  ResponsibilityIdSchema
} from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";

export const CheckInCreateSchema = z
  .object({
    scheduledFor: NullableIsoDateTimeSchema.optional(),
    facilitatorPersonaKey: PersonaKeySchema.nullable().optional(),
    responsibilityIds: z.array(ResponsibilityIdSchema).default([])
  })
  .strict();

export const CheckInAgendaItemSchema = z
  .object({
    id: CheckInItemIdSchema,
    itemType: z.enum(["responsibility", "custom"]),
    state: CheckInItemStateSchema,
    promptKey: z.string().trim().min(1).max(100),
    responsibilityId: ResponsibilityIdSchema.nullable(),
    sortOrder: z.number().int().nonnegative()
  })
  .strict();

export const CheckInAgendaSchema = z
  .object({
    id: CheckInIdSchema,
    state: CheckInStateSchema,
    scheduledFor: NullableIsoDateTimeSchema,
    facilitatorPersonaKey: PersonaKeySchema.nullable(),
    items: z.array(CheckInAgendaItemSchema)
  })
  .strict();

export const CheckInDecisionSchema = z
  .object({
    decisionType: DecisionTypeSchema,
    summary: z.string().trim().min(1).max(1000),
    effectiveAt: IsoDateTimeSchema,
    reviewOn: NullableIsoDateTimeSchema.optional(),
    responsibilityId: ResponsibilityIdSchema.nullable().optional()
  })
  .strict();

export const CheckInItemDecisionMutationSchema = z
  .object({
    checkInId: CheckInIdSchema,
    itemId: CheckInItemIdSchema,
    state: CheckInItemStateSchema,
    response: z.string().trim().max(2000).nullable().optional(),
    decision: CheckInDecisionSchema.nullable().optional()
  })
  .strict();

export const CheckInCompleteMutationSchema = z
  .object({
    id: CheckInIdSchema,
    completedAt: IsoDateTimeSchema,
    summary: z.string().trim().max(2000).nullable().optional()
  })
  .strict();

export type CheckInCreate = z.infer<typeof CheckInCreateSchema>;
export type CheckInAgendaItem = z.infer<typeof CheckInAgendaItemSchema>;
export type CheckInAgenda = z.infer<typeof CheckInAgendaSchema>;
export type CheckInDecision = z.infer<typeof CheckInDecisionSchema>;
export type CheckInItemDecisionMutation = z.infer<
  typeof CheckInItemDecisionMutationSchema
>;
export type CheckInCompleteMutation = z.infer<
  typeof CheckInCompleteMutationSchema
>;
