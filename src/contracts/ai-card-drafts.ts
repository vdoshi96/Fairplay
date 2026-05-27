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
  "structuring",
  "ready",
  "failed"
] as const;

export const AI_CARD_SOURCE_INPUT_TYPES = ["text"] as const;

export const AiCardDraftStatusSchema = z.enum(AI_CARD_DRAFT_STATUSES);
export const AiCardGenerationStageSchema = z.enum(AI_CARD_GENERATION_STAGES);
export const AiCardSourceInputTypeSchema = z.enum(AI_CARD_SOURCE_INPUT_TYPES);

const NullableGeneratedTextSchema = z.string().trim().max(3000).nullable();
const GeneratedCoverAssetPathSchema = z
  .string()
  .regex(
    /^\/api\/ai-card-drafts\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/cover$/i
  )
  .nullable();

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
    coverAssetPath: GeneratedCoverAssetPathSchema,
    failureMessage: z.string().trim().max(1000).nullable(),
    acceptedResponsibilityId: ResponsibilityIdSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const AiCardDraftDetailSchema = AiCardDraftSummarySchema.extend({
  inputText: z.string().trim().max(4000).nullable(),
  definition: NullableGeneratedTextSchema,
  conception: NullableGeneratedTextSchema,
  planning: NullableGeneratedTextSchema,
  execution: NullableGeneratedTextSchema,
  minimumStandard: NullableGeneratedTextSchema
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
    minimumStandard: NullableGeneratedTextSchema.optional()
  })
  .strict();

export const AiCardReuseCandidateSearchSchema = z
  .object({
    inputText: z.string().trim().min(1).max(4000)
  })
  .strict();

export const AiCardReuseCandidateSchema = z
  .object({
    id: z.string().uuid(),
    score: z.number().min(0).max(1),
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().min(1).max(700),
    areaKeys: z.array(AreaKeySchema),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema),
    cadence: CadenceSchema,
    definition: z.string().trim().min(1).max(3000),
    conception: z.string().trim().min(1).max(3000),
    planning: z.string().trim().min(1).max(3000),
    execution: z.string().trim().min(1).max(3000),
    minimumStandard: z.string().trim().min(1).max(3000),
    sourceCoverAssetPath: GeneratedCoverAssetPathSchema,
    reuseCount: z.number().int().nonnegative()
  })
  .strict();

export const AiCardReuseCandidateResponseSchema = z
  .object({
    candidates: z.array(AiCardReuseCandidateSchema)
  })
  .strict();

export type AiCardDraftSummary = z.infer<typeof AiCardDraftSummarySchema>;
export type AiCardDraftDetail = z.infer<typeof AiCardDraftDetailSchema>;
export type AiCardDraftUpdate = z.infer<typeof AiCardDraftUpdateSchema>;
export type AiCardDraftCreate = z.infer<typeof AiCardDraftCreateSchema>;
export type AiCardReuseCandidateSearch = z.infer<
  typeof AiCardReuseCandidateSearchSchema
>;
export type AiCardReuseCandidate = z.infer<typeof AiCardReuseCandidateSchema>;
export type AiCardReuseCandidateResponse = z.infer<
  typeof AiCardReuseCandidateResponseSchema
>;
