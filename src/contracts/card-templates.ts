import { z } from "zod";

import {
  CadenceSchema,
  HiddenEffortKeySchema,
  ResponsibilityBoardLaneSchema
} from "../domain/enums";
import { IsoDateTimeSchema } from "../domain/time";

export const CARD_TEMPLATE_LABELS = [
  "Daily Grind",
  "Caregiving",
  "Out",
  "Home",
  "Magic",
  "Wild",
  "Happiness Trio",
  "Kids",
  "Kid Split"
] as const;

export const CardTemplateLabelSchema = z.enum(CARD_TEMPLATE_LABELS);

export const CardTemplateSummarySchema = z
  .object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(140),
    labels: z.array(CardTemplateLabelSchema),
    summary: z.string().trim().min(1).max(700),
    coverAssetPath: z.string().regex(/^\/assets\/fairplay\/cards\/[a-z0-9-]+\.png$/),
    defaultLane: ResponsibilityBoardLaneSchema
  })
  .strict();

export const CardTemplateDetailSchema = CardTemplateSummarySchema.extend({
  sourceCardId: z.string().trim().min(1),
  definition: z.string().trim().min(1).max(3000),
  conception: z.string().trim().min(1).max(3000),
  planning: z.string().trim().min(1).max(3000),
  execution: z.string().trim().min(1).max(3000),
  minimumStandard: z.string().trim().min(1).max(3000),
  defaultCadence: CadenceSchema,
  hiddenEffortKeys: z.array(HiddenEffortKeySchema),
  sourceVersion: z.string().trim().min(1).max(120),
  importedAt: IsoDateTimeSchema
}).strict();

export const CardTemplateSearchParamsSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    labels: z.array(CardTemplateLabelSchema).optional(),
    lane: ResponsibilityBoardLaneSchema.optional()
  })
  .strict();

export type CardTemplateLabel = z.infer<typeof CardTemplateLabelSchema>;
export type CardTemplateSummary = z.infer<typeof CardTemplateSummarySchema>;
export type CardTemplateDetail = z.infer<typeof CardTemplateDetailSchema>;
export type CardTemplateSearchParams = z.infer<typeof CardTemplateSearchParamsSchema>;
