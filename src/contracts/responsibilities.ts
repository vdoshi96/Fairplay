import { z } from "zod";

import {
  AssignmentRoleSchema,
  AssignmentScopeSchema,
  CadenceSchema,
  HiddenEffortKeySchema,
  PersonaKeySchema,
  ResponsibilityBoardLaneSchema,
  ResponsibilityStatusSchema,
  VisibilitySchema
} from "../domain/enums";
import { PersonaIdSchema, ResponsibilityIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";
import { assertVisibilityTransition } from "../domain/visibility";

export const AreaKeySchema = z.string().trim().min(1).max(80);

const SourceCoverAssetPathSchema = z
  .string()
  .trim()
  .regex(
    /^\/(?:assets\/fairplay\/cards\/[a-z0-9-]+\.png|api\/ai-card-drafts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/cover)$/
  )
  .nullable();

const SourceCardTextSchema = z.string().trim().max(3000).nullable();

const ResponsibilityCreateVisibilitySchema = z
  .enum(["shared_household", "partner_visible", "check_in_only"])
  .default("shared_household");

export const ResponsibilityAssignmentSummarySchema = z
  .object({
    personaKey: PersonaKeySchema,
    role: AssignmentRoleSchema,
    scope: AssignmentScopeSchema
  })
  .strict();

export const ResponsibilitySummarySchema = z
  .object({
    id: ResponsibilityIdSchema,
    templateId: z.string().trim().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().max(500).nullable().optional(),
    areaKeys: z.array(AreaKeySchema),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema),
    cadence: CadenceSchema,
    relevantDays: z.array(z.string().trim().min(1).max(40)).default([]),
    status: ResponsibilityStatusSchema,
    visibility: VisibilitySchema,
    boardLane: ResponsibilityBoardLaneSchema,
    boardSortOrder: z.number().int().nonnegative(),
    currentAssignments: z.array(ResponsibilityAssignmentSummarySchema),
    nextReviewAt: NullableIsoDateTimeSchema,
    householdStandard: z.string().trim().max(2000).nullable().optional(),
    sourceDefinition: SourceCardTextSchema.optional(),
    sourceMinimumStandard: SourceCardTextSchema.optional(),
    sourceCoverAssetPath: SourceCoverAssetPathSchema.optional()
  })
  .strict();

export const ResponsibilityLifecycleNotesSchema = z
  .object({
    noticeDecideNotes: z.string().trim().max(2000).nullable(),
    planPrepareNotes: z.string().trim().max(2000).nullable(),
    executeFollowThroughNotes: z.string().trim().max(2000).nullable(),
    dependencies: z.string().trim().max(2000).nullable(),
    blockers: z.string().trim().max(2000).nullable(),
    supportNeeded: z.string().trim().max(2000).nullable(),
    handoffNotes: z.string().trim().max(2000).nullable(),
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const ResponsibilityDetailSchema = ResponsibilitySummarySchema.extend({
  summary: z.string().trim().max(500).nullable(),
  householdStandard: z.string().trim().max(2000).nullable(),
  notes: z.string().trim().max(4000).nullable(),
  lifecycleNotes: ResponsibilityLifecycleNotesSchema.nullable(),
  lastReviewedAt: NullableIsoDateTimeSchema,
  sourceDefinition: SourceCardTextSchema,
  sourceConception: SourceCardTextSchema,
  sourcePlanning: SourceCardTextSchema,
  sourceExecution: SourceCardTextSchema,
  sourceMinimumStandard: SourceCardTextSchema,
  sourceCoverAssetPath: SourceCoverAssetPathSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  archivedAt: NullableIsoDateTimeSchema
}).strict();

const ResponsibilityEditableFieldsSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().max(500).nullable().optional(),
    areaKeys: z.array(AreaKeySchema),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema),
    cadence: CadenceSchema,
    relevantDays: z.array(z.string().trim().min(1).max(40)).nullable().optional(),
    status: ResponsibilityStatusSchema.optional(),
    visibility: VisibilitySchema,
    householdStandard: z.string().trim().max(2000).nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    nextReviewAt: NullableIsoDateTimeSchema.optional(),
    currentAssignments: z.array(ResponsibilityAssignmentSummarySchema).optional()
  })
  .strict();

export const ResponsibilityCreateSchema = ResponsibilityEditableFieldsSchema.extend({
  visibility: ResponsibilityCreateVisibilitySchema
});

const ResponsibilityUpdateFieldsSchema = ResponsibilityEditableFieldsSchema.omit({
  currentAssignments: true,
  status: true,
  visibility: true
});

export const ResponsibilityUpdateSchema = ResponsibilityUpdateFieldsSchema.partial()
  .extend({
    id: ResponsibilityIdSchema
  })
  .strict();

export const ResponsibilityVisibilityMutationSchema = z
  .object({
    responsibilityId: ResponsibilityIdSchema,
    fromVisibility: VisibilitySchema,
    toVisibility: VisibilitySchema,
    confirmedVisibilityChange: z.boolean().default(false),
    confirmationText: z.string().trim().max(500).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    try {
      assertVisibilityTransition({
        from: value.fromVisibility,
        to: value.toVisibility,
        confirmed: value.confirmedVisibilityChange
      });
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmedVisibilityChange"],
        message:
          error instanceof Error
            ? error.message
            : "Explicit confirmation is required before changing visibility."
      });
    }
  });

export const ArchiveResponsibilityMutationSchema = z
  .object({
    id: ResponsibilityIdSchema
  })
  .strict();

export const PauseResponsibilityMutationSchema = z
  .object({
    id: ResponsibilityIdSchema,
    reviewOn: NullableIsoDateTimeSchema.optional(),
    note: z.string().trim().max(1000).optional()
  })
  .strict();

export const ResponsibilityAssignmentMutationSchema = z
  .object({
    responsibilityId: ResponsibilityIdSchema,
    assignments: z.array(ResponsibilityAssignmentSummarySchema),
    effectiveAt: IsoDateTimeSchema,
    handoffNotes: z.string().trim().max(2000).optional()
  })
  .strict();

export const ResponsibilityBoardPlacementMutationSchema = z
  .object({
    responsibilityId: ResponsibilityIdSchema,
    toLane: ResponsibilityBoardLaneSchema,
    sortOrder: z.number().int().nonnegative(),
    actorPersonaId: PersonaIdSchema.optional(),
    note: z.string().trim().max(1000).optional()
  })
  .strict();

export const ResponsibilityFromTemplateMutationSchema = z
  .object({
    templateId: z.string().trim().min(1),
    actorPersonaId: PersonaIdSchema,
    lane: ResponsibilityBoardLaneSchema.optional(),
    titleOverride: z.string().trim().min(1).max(140).optional()
  })
  .strict();

export const LoadSnapshotSummarySchema = z
  .object({
    periodStart: IsoDateTimeSchema,
    periodEnd: IsoDateTimeSchema,
    computedAt: IsoDateTimeSchema,
    ownerDistribution: z.record(z.string(), z.number().int().nonnegative()),
    sharedDistribution: z.record(z.string(), z.number().int().nonnegative()),
    areaDistribution: z.record(z.string(), z.number().int().nonnegative()),
    cadenceDistribution: z.record(z.string(), z.number().int().nonnegative()),
    reviewDueCount: z.number().int().nonnegative(),
    pausedOrNotRelevantCount: z.number().int().nonnegative(),
    hiddenEffortMix: z.record(z.string(), z.number().int().nonnegative())
  })
  .strict();

export type AreaKey = z.infer<typeof AreaKeySchema>;
export type ResponsibilityAssignmentSummary = z.infer<
  typeof ResponsibilityAssignmentSummarySchema
>;
export type ResponsibilitySummary = z.infer<typeof ResponsibilitySummarySchema>;
export type ResponsibilityDetail = z.infer<typeof ResponsibilityDetailSchema>;
export type ResponsibilityCreate = z.infer<typeof ResponsibilityCreateSchema>;
export type ResponsibilityUpdate = z.infer<typeof ResponsibilityUpdateSchema>;
export type ResponsibilityVisibilityMutation = z.infer<
  typeof ResponsibilityVisibilityMutationSchema
>;
export type ArchiveResponsibilityMutation = z.infer<
  typeof ArchiveResponsibilityMutationSchema
>;
export type PauseResponsibilityMutation = z.infer<
  typeof PauseResponsibilityMutationSchema
>;
export type ResponsibilityAssignmentMutation = z.infer<
  typeof ResponsibilityAssignmentMutationSchema
>;
export type ResponsibilityBoardPlacementMutation = z.infer<
  typeof ResponsibilityBoardPlacementMutationSchema
>;
export type ResponsibilityFromTemplateMutation = z.infer<
  typeof ResponsibilityFromTemplateMutationSchema
>;
export type LoadSnapshotSummary = z.infer<typeof LoadSnapshotSummarySchema>;
