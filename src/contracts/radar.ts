import { z } from "zod";

import {
  RadarReasonKeySchema,
  RadarStateSchema,
  UrgencySchema,
  VisibilitySchema
} from "../domain/enums";
import {
  CheckInIdSchema,
  RadarItemIdSchema,
  ResponsibilityIdSchema
} from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";
import { isPrivateDraftPublish } from "../domain/visibility";

export const RadarSummarySchema = z
  .object({
    id: RadarItemIdSchema,
    topic: z.string().trim().min(1).max(160),
    responsibilityId: ResponsibilityIdSchema.nullable(),
    reasonKey: RadarReasonKeySchema,
    urgency: UrgencySchema,
    visibility: VisibilitySchema,
    state: RadarStateSchema,
    desiredTiming: z.string().trim().max(280).nullable(),
    deferredUntil: NullableIsoDateTimeSchema
  })
  .strict();

export const RadarDetailSchema = RadarSummarySchema.extend({
  notes: z.string().trim().max(4000).nullable(),
  targetCheckInId: CheckInIdSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  resolvedAt: NullableIsoDateTimeSchema
}).strict();

export const RadarCreateSchema = z
  .object({
    topic: z.string().trim().min(1).max(160),
    notes: z.string().trim().max(4000).nullable().optional(),
    desiredTiming: z.string().trim().max(280).nullable().optional(),
    responsibilityId: ResponsibilityIdSchema.nullable().optional(),
    reasonKey: RadarReasonKeySchema,
    urgency: UrgencySchema.default("normal"),
    visibility: VisibilitySchema.default("private")
  })
  .strict();

export const RadarUpdateSchema = z
  .object({
    id: RadarItemIdSchema,
    topic: z.string().trim().min(1).max(160).optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    desiredTiming: z.string().trim().max(280).nullable().optional(),
    responsibilityId: ResponsibilityIdSchema.nullable().optional(),
    reasonKey: RadarReasonKeySchema.optional(),
    urgency: UrgencySchema.optional(),
    state: RadarStateSchema.optional(),
    targetCheckInId: CheckInIdSchema.nullable().optional()
  })
  .strict();

export const RadarPublishMutationSchema = z
  .object({
    id: RadarItemIdSchema,
    fromVisibility: VisibilitySchema,
    visibility: VisibilitySchema,
    confirmPrivateDraftPublish: z.boolean().default(false)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      isPrivateDraftPublish(value.fromVisibility, value.visibility) &&
      !value.confirmPrivateDraftPublish
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPrivateDraftPublish"],
        message:
          "Explicit confirmation is required before publishing a private draft."
      });
    }
  });

export const RadarDeferMutationSchema = z
  .object({
    id: RadarItemIdSchema,
    deferredUntil: NullableIsoDateTimeSchema.optional(),
    note: z.string().trim().max(1000).optional()
  })
  .strict();

export const RadarResolveMutationSchema = z
  .object({
    id: RadarItemIdSchema,
    resolvedAt: IsoDateTimeSchema,
    note: z.string().trim().max(1000).optional()
  })
  .strict();

export type RadarSummary = z.infer<typeof RadarSummarySchema>;
export type RadarDetail = z.infer<typeof RadarDetailSchema>;
export type RadarCreate = z.infer<typeof RadarCreateSchema>;
export type RadarUpdate = z.infer<typeof RadarUpdateSchema>;
export type RadarPublishMutation = z.infer<typeof RadarPublishMutationSchema>;
export type RadarDeferMutation = z.infer<typeof RadarDeferMutationSchema>;
export type RadarResolveMutation = z.infer<typeof RadarResolveMutationSchema>;
