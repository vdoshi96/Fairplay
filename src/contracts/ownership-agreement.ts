import { z } from "zod";

import {
  ASSIGNMENT_ROLES,
  AssignmentRoleSchema,
  AssignmentScopeSchema,
  PersonaKeySchema
} from "../domain/enums";
import { ResponsibilityIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";

export const OWNERSHIP_HANDOFF_MODES = [
  "replace_former_owner",
  "retain_former_owner_as_helper"
] as const;

export const OwnershipHandoffModeSchema = z.enum(OWNERSHIP_HANDOFF_MODES);

export const OwnershipAgreementAssignmentSchema = z
  .object({
    personaKey: PersonaKeySchema,
    role: AssignmentRoleSchema,
    scope: AssignmentScopeSchema
  })
  .strict();

export const OwnershipAgreementMutationSchema = z
  .object({
    responsibilityId: ResponsibilityIdSchema,
    expectedUpdatedAt: IsoDateTimeSchema,
    expectedOwnerPersonaKeys: z.array(PersonaKeySchema).max(2),
    assignments: z.array(OwnershipAgreementAssignmentSchema).max(2),
    reviewAt: NullableIsoDateTimeSchema,
    handoffMode: OwnershipHandoffModeSchema.nullable().optional(),
    handoffNotes: z.string().trim().min(1).max(2000).nullable().optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    const personaKeys = value.assignments.map((assignment) => assignment.personaKey);
    if (new Set(personaKeys).size !== personaKeys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments"],
        message: "Each household persona can appear only once in an ownership agreement."
      });
    }

    if (
      new Set(value.expectedOwnerPersonaKeys).size !==
      value.expectedOwnerPersonaKeys.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedOwnerPersonaKeys"],
        message: "Expected owner personas must be unique."
      });
    }

    const ownerRoles = new Set<(typeof ASSIGNMENT_ROLES)[number]>([
      "accountable_owner",
      "shared_owner"
    ]);
    const ownerAssignments = value.assignments.filter((assignment) =>
      ownerRoles.has(assignment.role)
    );
    if (ownerAssignments.length === 0) {
      if (value.expectedOwnerPersonaKeys.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assignments"],
          message: "An initially unowned card needs at least one owner."
        });
      } else if (!value.handoffMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["handoffMode"],
          message: "Choose what happens to the former owner before returning the card to Deal."
        });
      } else if (value.assignments.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assignments"],
          message:
            "Clear non-owner roles before returning the card to Deal. Former owners can be retained through the handoff choice."
        });
      }
    }

    if (
      value.assignments.some((assignment) => assignment.role === "shared_owner") &&
      ownerAssignments.length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments"],
        message: "A shared owner needs another owner in the agreement."
      });
    }

    if (
      value.assignments.filter(
        (assignment) => assignment.role === "accountable_owner"
      ).length > 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments"],
        message: "Use shared-owner roles when more than one persona owns the work."
      });
    }
  });

export type OwnershipHandoffMode = z.infer<typeof OwnershipHandoffModeSchema>;
export type OwnershipAgreementAssignment = z.infer<
  typeof OwnershipAgreementAssignmentSchema
>;
export type OwnershipAgreementMutation = z.infer<
  typeof OwnershipAgreementMutationSchema
>;
