import type { Prisma } from "@prisma/client";

import type { PersonaSummary } from "@/contracts/personas";
import type {
  LoadSnapshotSummary,
  ResponsibilityAssignmentSummary,
  ResponsibilityCreate,
  ResponsibilityDetail,
  ResponsibilitySummary,
  ResponsibilityUpdate,
  ResponsibilityVisibilityMutation
} from "@/contracts/responsibilities";
import type {
  ResponsibilityStatus,
  Visibility
} from "@/domain/enums";
import type { HouseholdId, PersonaId, ResponsibilityId } from "@/domain/ids";
import { assertVisibilityTransition } from "@/domain/visibility";
import type { CurrentSession } from "@/server/auth/current-session";
import { prisma } from "@/server/db/prisma";
import { ensureHouseholdCatalogResponsibilities } from "@/server/repositories/card-templates";
import {
  addResponsibilityAssignments,
  createResponsibility,
  getResponsibilityDetail,
  listResponsibilitiesForHousehold
} from "@/server/repositories/responsibilities";
import { listPersonasForHousehold } from "@/server/repositories/personas";
import { buildLoadSnapshot } from "./load-snapshot";

export type ResponsibilityServiceErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class ResponsibilityServiceError extends Error {
  readonly code: ResponsibilityServiceErrorCode;

  constructor(code: ResponsibilityServiceErrorCode, message: string) {
    super(message);
    this.name = "ResponsibilityServiceError";
    this.code = code;
  }
}

export type AssignmentReplacement = ResponsibilityAssignmentSummary & {
  personaId: PersonaId;
};

export type CreateResponsibilityRecordInput = ResponsibilityCreate & {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  status: ResponsibilityStatus;
  visibility: Exclude<Visibility, "private">;
};

export type UpdateResponsibilityRecordInput = Partial<
  Omit<ResponsibilityCreate, "currentAssignments" | "visibility">
> & {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  archivedAt?: string;
  status?: ResponsibilityStatus;
  visibility?: Exclude<Visibility, "private">;
};

export type ReplaceActiveAssignmentsInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  createdByPersonaId: PersonaId;
  effectiveAt: string;
  assignments: AssignmentReplacement[];
};

export type ResponsibilityEventInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  actorPersonaId: PersonaId;
  eventType: string;
  payload: Prisma.InputJsonValue;
  occurredAt: string;
};

export type ResponsibilityServiceDeps = {
  listPersonasForHousehold: (
    householdId: HouseholdId
  ) => Promise<readonly PersonaSummary[]>;
  createResponsibilityRecord: (
    input: CreateResponsibilityRecordInput
  ) => Promise<ResponsibilityDetail>;
  updateResponsibilityRecord: (
    input: UpdateResponsibilityRecordInput
  ) => Promise<ResponsibilityDetail>;
  getResponsibility: (input: {
    householdId: HouseholdId;
    responsibilityId: ResponsibilityId;
  }) => Promise<ResponsibilityDetail | null>;
  listResponsibilities: (
    householdId: HouseholdId
  ) => Promise<ResponsibilitySummary[]>;
  replaceActiveAssignments: (
    input: ReplaceActiveAssignmentsInput
  ) => Promise<ResponsibilityDetail>;
  createResponsibilityEvent: (
    input: ResponsibilityEventInput
  ) => Promise<void>;
  ensureCatalogResponsibilities?: (input: {
    actorPersonaId: PersonaId;
    householdId: HouseholdId;
  }) => Promise<void>;
};

export type AssignmentMutationInput = {
  effectiveAt: string;
  assignments: ResponsibilityAssignmentSummary[];
  handoffNotes?: string;
  revisitAt?: string;
};

export type StatusMutationInput = {
  status: Extract<
    ResponsibilityStatus,
    "active" | "needs_review" | "paused" | "not_relevant" | "archived" | "unassigned"
  >;
  confirmedArchive?: boolean;
  note?: string;
  reviewOn?: string | null;
};

function requireSelectedPersona(session: CurrentSession): PersonaId {
  if (!session.selectedPersonaId) {
    throw new ResponsibilityServiceError(
      "AUTH_REQUIRED",
      "A selected persona is required."
    );
  }

  return session.selectedPersonaId;
}

function assertSharedResponsibilityVisibility(visibility: Visibility) {
  if (visibility === "private") {
    throw new ResponsibilityServiceError(
      "INVALID_INPUT",
      "Private responsibility visibility is not available in v1."
    );
  }
}

function currentAccountableOwners(assignments: readonly ResponsibilityAssignmentSummary[]) {
  return assignments
    .filter((assignment) => assignment.role === "accountable_owner")
    .map((assignment) => assignment.personaKey)
    .sort();
}

function accountableOwnerChanged(
  previous: readonly ResponsibilityAssignmentSummary[],
  next: readonly ResponsibilityAssignmentSummary[]
) {
  return (
    currentAccountableOwners(previous).join(",") !==
    currentAccountableOwners(next).join(",")
  );
}

async function getRequiredResponsibility(
  deps: ResponsibilityServiceDeps,
  householdId: HouseholdId,
  responsibilityId: ResponsibilityId
) {
  const responsibility = await deps.getResponsibility({
    householdId,
    responsibilityId
  });

  if (!responsibility) {
    throw new ResponsibilityServiceError(
      "NOT_FOUND",
      "Responsibility not found for this household."
    );
  }

  return responsibility;
}

async function assignmentsWithPersonaIds(
  deps: ResponsibilityServiceDeps,
  householdId: HouseholdId,
  assignments: readonly ResponsibilityAssignmentSummary[]
): Promise<AssignmentReplacement[]> {
  const personas = await deps.listPersonasForHousehold(householdId);

  return assignments.map((assignment) => {
    const persona = personas.find((candidate) => candidate.key === assignment.personaKey);
    if (!persona) {
      throw new ResponsibilityServiceError(
        "INVALID_INPUT",
        "Assignment persona is not available for this household."
      );
    }

    return {
      ...assignment,
      personaId: persona.id
    };
  });
}

function publicCreateInput(input: ResponsibilityCreate): CreateResponsibilityRecordInput {
  const visibility = input.visibility ?? "shared_household";
  assertSharedResponsibilityVisibility(visibility);

  const hasAssignments = Boolean(input.currentAssignments?.length);

  return {
    ...input,
    householdId: "" as HouseholdId,
    createdByPersonaId: "" as PersonaId,
    status: input.status ?? (hasAssignments ? "active" : "unassigned"),
    visibility
  };
}

export function createResponsibilityService(deps: ResponsibilityServiceDeps) {
  return {
    async listOverview(
      session: CurrentSession,
      options: { asOf?: string | Date } = {}
    ): Promise<{
      responsibilities: ResponsibilitySummary[];
      loadSnapshot: LoadSnapshotSummary;
    }> {
      const actorPersonaId = requireSelectedPersona(session);
      await deps.ensureCatalogResponsibilities?.({
        actorPersonaId,
        householdId: session.householdId
      });
      const responsibilities = await deps.listResponsibilities(session.householdId);

      return {
        responsibilities,
        loadSnapshot: buildLoadSnapshot({
          responsibilities,
          asOf: options.asOf
        })
      };
    },

    async get(
      session: CurrentSession,
      responsibilityId: ResponsibilityId
    ): Promise<ResponsibilityDetail> {
      return getRequiredResponsibility(deps, session.householdId, responsibilityId);
    },

    async create(
      session: CurrentSession,
      input: ResponsibilityCreate
    ): Promise<ResponsibilityDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      const normalized = publicCreateInput(input);
      let responsibility = await deps.createResponsibilityRecord({
        ...normalized,
        householdId: session.householdId,
        createdByPersonaId
      });

      if (input.currentAssignments?.length) {
        responsibility = await this.updateAssignments(session, responsibility.id, {
          effectiveAt: new Date().toISOString(),
          assignments: input.currentAssignments
        });
      }

      return responsibility;
    },

    async update(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: Partial<Omit<ResponsibilityUpdate, "id">>
    ): Promise<ResponsibilityDetail> {
      await getRequiredResponsibility(deps, session.householdId, responsibilityId);

      return deps.updateResponsibilityRecord({
        ...input,
        householdId: session.householdId,
        responsibilityId
      });
    },

    async updateVisibility(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: ResponsibilityVisibilityMutation
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      const responsibility = await getRequiredResponsibility(
        deps,
        session.householdId,
        responsibilityId
      );

      if (input.responsibilityId !== responsibilityId) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Visibility update does not match this responsibility."
        );
      }

      if (input.fromVisibility !== responsibility.visibility) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Visibility update is based on stale responsibility data."
        );
      }

      if (input.toVisibility === "private") {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Private responsibility visibility is not available in v1."
        );
      }

      try {
        assertVisibilityTransition({
          from: input.fromVisibility,
          to: input.toVisibility,
          confirmed: input.confirmedVisibilityChange
        });
      } catch (error) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          error instanceof Error
            ? error.message
            : "Visibility update needs confirmation."
        );
      }

      const updated = await deps.updateResponsibilityRecord({
        householdId: session.householdId,
        responsibilityId,
        visibility: input.toVisibility
      });

      await deps.createResponsibilityEvent({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        eventType: "visibility_changed",
        occurredAt: new Date().toISOString(),
        payload: {
          fromVisibility: input.fromVisibility,
          toVisibility: input.toVisibility,
          confirmationText: input.confirmationText ?? null
        }
      });

      return updated;
    },

    async updateAssignments(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: AssignmentMutationInput
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      const responsibility = await getRequiredResponsibility(
        deps,
        session.householdId,
        responsibilityId
      );

      if (
        currentAccountableOwners(responsibility.currentAssignments).length > 0 &&
        accountableOwnerChanged(
          responsibility.currentAssignments,
          input.assignments
        ) &&
        (!input.handoffNotes || !input.revisitAt)
      ) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Accountable owner changes need handoff context and a revisit date."
        );
      }

      const assignments = await assignmentsWithPersonaIds(
        deps,
        session.householdId,
        input.assignments
      );
      const updated = await deps.replaceActiveAssignments({
        householdId: session.householdId,
        responsibilityId,
        createdByPersonaId: actorPersonaId,
        effectiveAt: input.effectiveAt,
        assignments
      });

      await deps.createResponsibilityEvent({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        eventType: "assignment_changed",
        occurredAt: input.effectiveAt,
        payload: {
          assignments: input.assignments,
          handoffNotes: input.handoffNotes ?? null,
          revisitAt: input.revisitAt ?? null
        }
      });

      return updated;
    },

    async updateStatus(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: StatusMutationInput
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      await getRequiredResponsibility(deps, session.householdId, responsibilityId);

      if (input.status === "archived" && !input.confirmedArchive) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Archive needs explicit confirmation."
        );
      }

      const archivedAt =
        input.status === "archived" ? new Date().toISOString() : undefined;
      const updated = await deps.updateResponsibilityRecord({
        householdId: session.householdId,
        responsibilityId,
        status: input.status,
        nextReviewAt: input.reviewOn ?? undefined,
        ...(archivedAt ? { archivedAt } : {})
      });

      await deps.createResponsibilityEvent({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        eventType: "status_changed",
        occurredAt: new Date().toISOString(),
        payload: {
          status: input.status,
          note: input.note ?? null,
          reviewOn: input.reviewOn ?? null
        }
      });

      return updated;
    }
  };
}

export const responsibilityService = createResponsibilityService({
  listPersonasForHousehold,
  async createResponsibilityRecord(input) {
    return createResponsibility({
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      title: input.title,
      summary: input.summary ?? null,
      areaKeys: input.areaKeys,
      hiddenEffortKeys: input.hiddenEffortKeys,
      cadence: input.cadence,
      relevantDays: input.relevantDays ?? null,
      status: input.status,
      visibility: input.visibility,
      householdStandard: input.householdStandard ?? null,
      notes: input.notes ?? null,
      nextReviewAt: input.nextReviewAt ?? null
    });
  },
  async updateResponsibilityRecord(input) {
    const updated = await prisma.responsibility.update({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      data: {
        title: input.title,
        summary: input.summary,
        areaKeys: input.areaKeys,
        hiddenEffortKeys: input.hiddenEffortKeys,
        cadence: input.cadence,
        relevantDays: input.relevantDays ?? undefined,
        status: input.status,
        visibility: input.visibility,
        householdStandard: input.householdStandard,
        notes: input.notes,
        nextReviewAt:
          input.nextReviewAt === undefined || input.nextReviewAt === null
            ? input.nextReviewAt
            : new Date(input.nextReviewAt),
        archivedAt:
          "archivedAt" in input && typeof input.archivedAt === "string"
            ? new Date(input.archivedAt)
            : undefined
      }
    });

    return getResponsibilityDetail({
      householdId: updated.householdId,
      responsibilityId: updated.id
    }) as Promise<ResponsibilityDetail>;
  },
  getResponsibility: getResponsibilityDetail,
  listResponsibilities: listResponsibilitiesForHousehold,
  ensureCatalogResponsibilities: ensureHouseholdCatalogResponsibilities,
  async replaceActiveAssignments(input) {
    return addResponsibilityAssignments({
      householdId: input.householdId,
      responsibilityId: input.responsibilityId,
      createdByPersonaId: input.createdByPersonaId,
      startsAt: input.effectiveAt,
      assignments: input.assignments.map((assignment) => ({
        personaId: assignment.personaId,
        role: assignment.role,
        scope: assignment.scope
      }))
    });
  },
  async createResponsibilityEvent(input) {
    await prisma.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId,
        eventType: input.eventType,
        payload: input.payload,
        occurredAt: new Date(input.occurredAt)
      }
    });
  },
});
