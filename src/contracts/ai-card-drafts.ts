import { z } from "zod";

import { CadenceSchema, HiddenEffortKeySchema } from "../domain/enums";
import { ResponsibilityIdSchema } from "../domain/ids";
import { IsoDateTimeSchema } from "../domain/time";
import { AreaKeySchema } from "./responsibilities";

export const AI_CARD_DRAFT_STATUSES = [
  "processing",
  "ready",
  "failed",
  "accepted",
  "canceled"
] as const;

export const AI_CARD_GENERATION_STAGES = [
  "queued",
  "transcribing",
  "structuring",
  "generating_image",
  "saving_image",
  "ready",
  "failed"
] as const;

export const AI_CARD_SOURCE_INPUT_TYPES = ["text", "audio"] as const;

export const AiCardDraftStatusSchema = z.enum(AI_CARD_DRAFT_STATUSES);
export const AiCardGenerationStageSchema = z.enum(AI_CARD_GENERATION_STAGES);
export const AiCardSourceInputTypeSchema = z.enum(AI_CARD_SOURCE_INPUT_TYPES);

const NullableGeneratedTextSchema = z.string().trim().max(3000).nullable();
const AiCardDraftCoverUrlSchema = z
  .string()
  .regex(/^\/api\/ai-card-drafts\/[0-9a-f-]{36}\/cover$/);

export const AiCardDraftCreateSchema = z
  .object({
    inputText: z.string().trim().min(1).max(4000).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.inputText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inputText"],
        message: "Text input is required for JSON card draft captures."
      });
    }
  });

export const AiCardDraftSummarySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(140).nullable(),
    promptPreview: z.string().trim().min(1).max(180),
    status: AiCardDraftStatusSchema,
    generationStage: AiCardGenerationStageSchema,
    sourceInputType: AiCardSourceInputTypeSchema,
    summary: z.string().trim().max(700).nullable(),
    areaKeys: z.array(AreaKeySchema),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema),
    cadence: CadenceSchema.nullable(),
    coverUrl: AiCardDraftCoverUrlSchema.nullable(),
    failureMessage: z.string().trim().max(1000).nullable(),
    acceptedResponsibilityId: ResponsibilityIdSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const AiCardDraftDetailSchema = AiCardDraftSummarySchema.extend({
  inputText: z.string().trim().max(4000).nullable(),
  audioTranscript: z.string().trim().max(4000).nullable(),
  definition: NullableGeneratedTextSchema,
  conception: NullableGeneratedTextSchema,
  planning: NullableGeneratedTextSchema,
  execution: NullableGeneratedTextSchema,
  minimumStandard: NullableGeneratedTextSchema,
  imagePrompt: NullableGeneratedTextSchema,
  imageNegativePrompt: NullableGeneratedTextSchema
}).strict();

export const AiCardDraftUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    summary: z.string().trim().max(700).nullable().optional(),
    areaKeys: z.array(AreaKeySchema).optional(),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema).optional(),
    cadence: CadenceSchema.optional(),
    definition: NullableGeneratedTextSchema.optional(),
    conception: NullableGeneratedTextSchema.optional(),
    planning: NullableGeneratedTextSchema.optional(),
    execution: NullableGeneratedTextSchema.optional(),
    minimumStandard: NullableGeneratedTextSchema.optional(),
    imagePrompt: NullableGeneratedTextSchema.optional(),
    imageNegativePrompt: NullableGeneratedTextSchema.optional()
  })
  .strict();

export type AiCardDraftSummary = z.infer<typeof AiCardDraftSummarySchema>;
export type AiCardDraftDetail = z.infer<typeof AiCardDraftDetailSchema>;
export type AiCardDraftUpdate = z.infer<typeof AiCardDraftUpdateSchema>;
export type AiCardDraftCreate = z.infer<typeof AiCardDraftCreateSchema>;
