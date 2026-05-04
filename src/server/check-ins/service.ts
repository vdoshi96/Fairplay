import { z } from "zod";

import type {
  CheckInDecision,
  CheckInAgendaItem
} from "@/contracts/check-ins";
import { ResponsibilityAssignmentSummarySchema } from "@/contracts/responsibilities";
import type { CheckInItemState, CheckInState, DecisionType, Visibility } from "@/domain/enums";
import {
  CheckInIdSchema,
  CheckInItemIdSchema,
  ResponsibilityIdSchema,
  type CheckInId,
  type CheckInItemId,
  type HouseholdId,
  type PersonaId,
  type RadarItemId,
  type ResponsibilityId
} from "@/domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "@/domain/time";
import type { CurrentSession } from "@/server/auth/current-session";
import { prisma } from "@/server/db/prisma";
import { radarService } from "@/server/radar/service";
import { responsibilityService } from "@/server/responsibilities/service";
import { buildSuggestedAgenda, type AgendaDraftItem, type AgendaSources } from "./agenda";
import { buildCheckInSummary, containsUnsafeSummaryLanguage } from "./summary";

export type GuidedCheckInItem = CheckInAgendaItem & {
  title: string;
  description: string | null;
  visibility: Visibility | null;
  response: string | null;
  decisionId: string | null;
};

export type GuidedDecision = {
  id: string;
  decisionType: DecisionType;
  summary: string;
  effectiveAt: string;
  reviewOn: string | null;
  responsibilityId: ResponsibilityId | null;
};

export type GuidedCheckIn = {
  id: CheckInId;
  householdId?: HouseholdId;
  state: CheckInState;
  scheduledFor: string | null;
  facilitatorPersonaKey: "alex" | "max" | null;
  startedAt?: string | null;
  completedAt?: string | null;
  summary?: string | null;
  items: GuidedCheckInItem[];
  decisions?: GuidedDecision[];
};

export type GuidedAgendaPreview = {
  items: GuidedCheckInItem[];
};

export const ResponsibilityEffectSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.enum(["assign_owner", "change_role"]),
    assignments: z.array(ResponsibilityAssignmentSummarySchema).min(1),
    handoffNotes: z.string().trim().max(2000).optional(),
    revisitAt: IsoDateTimeSchema.optional()
  }),
  z.object({
    kind: z.literal("change_cadence"),
    cadence: z.enum([
      "daily",
      "weekly",
      "monthly",
      "seasonal",
      "event_based",
      "as_needed",
      "one_time"
    ])
  }),
  z.object({
    kind: z.literal("change_standard"),
    householdStandard: z.string().trim().max(2000).nullable()
  }),
  z.object({
    kind: z.enum(["pause", "mark_not_relevant", "archive", "schedule_review"]),
    reviewOn: NullableIsoDateTimeSchema.optional(),
    confirmedArchive: z.boolean().optional()
  }),
  z.object({
    kind: z.literal("change_visibility"),
    visibility: z.enum(["shared_household", "partner_visible", "check_in_only"])
  })
]);

export type ResponsibilityEffect = z.infer<typeof ResponsibilityEffectSchema>;

export const GuidedDecisionInputSchema = z
  .object({
    decisionType: z.enum([
      "assign_owner",
      "change_role",
      "change_standard",
      "change_cadence",
      "pause",
      "mark_not_relevant",
      "archive",
      "schedule_review",
      "custom_note"
    ]),
    summary: z.string().trim().min(1).max(1000),
    effectiveAt: IsoDateTimeSchema,
    reviewOn: NullableIsoDateTimeSchema.optional(),
    responsibilityId: ResponsibilityIdSchema.nullable().optional(),
    responsibilityEffect: ResponsibilityEffectSchema.optional()
  })
  .strict();

export type GuidedDecisionInput = Omit<
  z.infer<typeof GuidedDecisionInputSchema>,
  "responsibilityId"
> & {
  responsibilityId?: ResponsibilityId | null;
};

export type CreateCheckInInput = {
  maxItems?: number;
  radarItemIds?: RadarItemId[];
  responsibilityIds?: ResponsibilityId[];
  includeAcknowledgement?: boolean;
};

export type CheckInServiceDeps = {
  ensurePersonaInHousehold: (input: {
    householdId: HouseholdId;
    personaId: PersonaId;
  }) => Promise<boolean>;
  getActiveCheckIn: (input: {
    householdId: HouseholdId;
  }) => Promise<GuidedCheckIn | null>;
  getCheckIn: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
  }) => Promise<GuidedCheckIn | null>;
  listAgendaSources: (input: {
    householdId: HouseholdId;
    selectedPersonaId: PersonaId;
    asOf: Date;
  }) => Promise<AgendaSources>;
  createCheckIn: (input: {
    householdId: HouseholdId;
    facilitatorPersonaId: PersonaId;
    state: "active" | "draft";
    items: AgendaDraftItem[];
  }) => Promise<GuidedCheckIn>;
  updateItem: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
    itemId: CheckInItemId;
    state: CheckInItemState;
    response?: string | null;
  }) => Promise<GuidedCheckInItem>;
  createDecision: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
    itemId: CheckInItemId;
    createdByPersonaId: PersonaId;
    decision: CheckInDecision;
  }) => Promise<GuidedDecision>;
  updateItemDecision: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
    itemId: CheckInItemId;
    decisionId: string;
  }) => Promise<GuidedCheckInItem>;
  applyResponsibilityDecision: (input: {
    session: CurrentSession;
    responsibilityId: ResponsibilityId;
    decision: GuidedDecisionInput;
  }) => Promise<void>;
  applyRadarDecision: (input: {
    session: CurrentSession;
    radarItemId: RadarItemId;
    decisionType: DecisionType;
    effectiveAt: string;
  }) => Promise<void>;
  completeCheckIn: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
    completedAt: string;
    summary: string;
  }) => Promise<GuidedCheckIn>;
};

export type CheckInServiceErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class CheckInServiceError extends Error {
  readonly code: CheckInServiceErrorCode;

  constructor(code: CheckInServiceErrorCode, message: string) {
    super(message);
    this.name = "CheckInServiceError";
    this.code = code;
  }
}

function requireSelectedPersona(session: CurrentSession): PersonaId {
  if (!session.selectedPersonaId) {
    throw new CheckInServiceError("AUTH_REQUIRED", "A selected persona is required.");
  }

  return session.selectedPersonaId;
}

function assertHouseholdRecord(
  record: GuidedCheckIn | null,
  householdId: HouseholdId
): asserts record is GuidedCheckIn {
  if (!record || (record.householdId && record.householdId !== householdId)) {
    throw new CheckInServiceError("NOT_FOUND", "Check-in not found.");
  }
}

function assertActiveItem(record: GuidedCheckIn, itemId: CheckInItemId): void {
  if (
    record.state !== "active" ||
    !record.items.some((item) => item.id === itemId)
  ) {
    throw new CheckInServiceError("NOT_FOUND", "Check-in item not found.");
  }
}

function toCheckInDecision(input: GuidedDecisionInput): CheckInDecision {
  return {
    decisionType: input.decisionType,
    summary: input.summary,
    effectiveAt: input.effectiveAt,
    reviewOn: input.reviewOn ?? null,
    responsibilityId: input.responsibilityId ?? null
  };
}

function previewItemId(item: AgendaDraftItem, index: number): CheckInItemId {
  return (
    item.radarItemId ??
    item.responsibilityId ??
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
  );
}

function toGuidedPreviewItems(items: AgendaDraftItem[]): GuidedCheckInItem[] {
  return items.map((item, index) => ({
    id: previewItemId(item, index),
    itemType: item.itemType,
    state: "queued",
    promptKey: item.promptKey,
    radarItemId: item.radarItemId,
    responsibilityId: item.responsibilityId,
    sortOrder: index,
    title: item.title,
    description: item.description,
    visibility: item.visibility,
    response: null,
    decisionId: null
  }));
}

export function createCheckInService(deps: CheckInServiceDeps) {
  return {
    async preview(
      session: CurrentSession,
      input: CreateCheckInInput
    ): Promise<GuidedAgendaPreview> {
      const selectedPersonaId = requireSelectedPersona(session);
      const validPersona = await deps.ensurePersonaInHousehold({
        householdId: session.householdId,
        personaId: selectedPersonaId
      });

      if (!validPersona) {
        throw new CheckInServiceError(
          "INVALID_INPUT",
          "Selected persona does not belong to household."
        );
      }

      const sources = await deps.listAgendaSources({
        householdId: session.householdId,
        selectedPersonaId,
        asOf: new Date()
      });

      return {
        items: toGuidedPreviewItems(buildSuggestedAgenda(sources, input))
      };
    },

    async create(
      session: CurrentSession,
      input: CreateCheckInInput
    ): Promise<GuidedCheckIn> {
      const selectedPersonaId = requireSelectedPersona(session);
      const validPersona = await deps.ensurePersonaInHousehold({
        householdId: session.householdId,
        personaId: selectedPersonaId
      });

      if (!validPersona) {
        throw new CheckInServiceError(
          "INVALID_INPUT",
          "Selected persona does not belong to household."
        );
      }

      const active = await deps.getActiveCheckIn({ householdId: session.householdId });
      if (active) {
        return active;
      }

      const sources = await deps.listAgendaSources({
        householdId: session.householdId,
        selectedPersonaId,
        asOf: new Date()
      });
      const items = buildSuggestedAgenda(sources, input);

      return deps.createCheckIn({
        householdId: session.householdId,
        facilitatorPersonaId: selectedPersonaId,
        state: "active",
        items
      });
    },

    async get(session: CurrentSession, checkInId: CheckInId): Promise<GuidedCheckIn> {
      requireSelectedPersona(session);
      const record = await deps.getCheckIn({
        householdId: session.householdId,
        checkInId
      });
      assertHouseholdRecord(record, session.householdId);

      return record;
    },

    async updateItem(
      session: CurrentSession,
      checkInId: CheckInId,
      itemId: CheckInItemId,
      input: { state: CheckInItemState; response?: string | null }
    ): Promise<GuidedCheckInItem> {
      requireSelectedPersona(session);
      const record = await deps.getCheckIn({
        householdId: session.householdId,
        checkInId
      });
      assertHouseholdRecord(record, session.householdId);
      assertActiveItem(record, itemId);

      return deps.updateItem({
        householdId: session.householdId,
        checkInId,
        itemId,
        state: input.state,
        response: input.response ?? null
      });
    },

    async recordDecision(
      session: CurrentSession,
      checkInId: CheckInId,
      itemId: CheckInItemId,
      input: GuidedDecisionInput
    ): Promise<GuidedDecision> {
      const selectedPersonaId = requireSelectedPersona(session);
      const record = await deps.getCheckIn({
        householdId: session.householdId,
        checkInId
      });
      assertHouseholdRecord(record, session.householdId);

      const item = record.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        throw new CheckInServiceError("NOT_FOUND", "Check-in item not found.");
      }

      const decision = await deps.createDecision({
        householdId: session.householdId,
        checkInId,
        itemId,
        createdByPersonaId: selectedPersonaId,
        decision: toCheckInDecision(input)
      });

      await deps.updateItemDecision({
        householdId: session.householdId,
        checkInId,
        itemId,
        decisionId: decision.id
      });

      if (input.responsibilityId && input.responsibilityEffect) {
        await deps.applyResponsibilityDecision({
          session,
          responsibilityId: input.responsibilityId,
          decision: input
        });
      }

      if (item.radarItemId) {
        await deps.applyRadarDecision({
          session,
          radarItemId: item.radarItemId,
          decisionType: input.decisionType,
          effectiveAt: input.effectiveAt
        });
      }

      return decision;
    },

    async complete(
      session: CurrentSession,
      checkInId: CheckInId,
      input: { completedAt: string; summary?: string | null }
    ): Promise<GuidedCheckIn> {
      requireSelectedPersona(session);
      const record = await deps.getCheckIn({
        householdId: session.householdId,
        checkInId
      });
      assertHouseholdRecord(record, session.householdId);

      if (input.summary && containsUnsafeSummaryLanguage(input.summary)) {
        throw new CheckInServiceError(
          "INVALID_INPUT",
          "Check-in summaries need neutral decision-focused language."
        );
      }

      const generatedSummary =
        input.summary ??
        buildCheckInSummary({
          decisions: record.decisions ?? [],
          deferredItems: record.items
            .filter((item) => item.state === "deferred")
            .map((item) => item.title),
          skippedItems: record.items
            .filter((item) => item.state === "skipped")
            .map((item) => item.title)
        });

      return deps.completeCheckIn({
        householdId: session.householdId,
        checkInId,
        completedAt: input.completedAt,
        summary: generatedSummary
      });
    }
  };
}

function nullableIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function visibilityLabel(value: Visibility | null) {
  if (!value) {
    return null;
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function toGuidedCheckIn(record: {
  id: string;
  householdId: string;
  state: CheckInState;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  summary: string | null;
  facilitatorPersona: { key: "alex" | "max" } | null;
  items: Array<{
    id: string;
    itemType: "radar" | "responsibility" | "custom";
    state: CheckInItemState;
    promptKey: string;
    radarItemId: string | null;
    responsibilityId: string | null;
    sortOrder: number;
    response: string | null;
    decisionId: string | null;
    radarItem: { topic: string; visibility: Visibility } | null;
    responsibility: { title: string; status: string; nextReviewAt: Date | null } | null;
  }>;
  decisions: Array<{
    id: string;
    decisionType: DecisionType;
    summary: string;
    effectiveAt: Date;
    reviewOn: Date | null;
    responsibilityId: string | null;
  }>;
}): GuidedCheckIn {
  return {
    id: record.id,
    householdId: record.householdId,
    state: record.state,
    scheduledFor: nullableIso(record.scheduledFor),
    startedAt: nullableIso(record.startedAt),
    completedAt: nullableIso(record.completedAt),
    facilitatorPersonaKey: record.facilitatorPersona?.key ?? null,
    summary: record.summary,
    items: record.items
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => {
        const title =
          item.radarItem?.topic ??
          item.responsibility?.title ??
          (item.promptKey === "acknowledgement"
            ? "Name one thing that helped this week"
            : "Check-in topic");
        const visibility = item.radarItem?.visibility ?? "shared_household";

        return {
          id: item.id,
          itemType: item.itemType,
          state: item.state,
          promptKey: item.promptKey,
          radarItemId: item.radarItemId,
          responsibilityId: item.responsibilityId,
          sortOrder: item.sortOrder,
          title,
          description: item.radarItem
            ? visibilityLabel(item.radarItem.visibility)
            : item.responsibility?.nextReviewAt
              ? "Review due"
              : "Check-in topic",
          visibility,
          response: item.response,
          decisionId: item.decisionId
        };
      }),
    decisions: record.decisions.map((decision) => ({
      id: decision.id,
      decisionType: decision.decisionType,
      summary: decision.summary,
      effectiveAt: decision.effectiveAt.toISOString(),
      reviewOn: nullableIso(decision.reviewOn),
      responsibilityId: decision.responsibilityId
    }))
  };
}

const checkInInclude = {
  facilitatorPersona: { select: { key: true } },
  items: {
    include: {
      radarItem: { select: { topic: true, visibility: true } },
      responsibility: { select: { title: true, status: true, nextReviewAt: true } }
    },
    orderBy: { sortOrder: "asc" as const }
  },
  decisions: true
};

export const checkInService = createCheckInService({
  async ensurePersonaInHousehold(input) {
    const count = await prisma.persona.count({
      where: {
        id: input.personaId,
        householdId: input.householdId
      }
    });

    return count === 1;
  },
  async getActiveCheckIn(input) {
    const record = await prisma.checkIn.findFirst({
      where: {
        householdId: input.householdId,
        state: "active"
      },
      include: checkInInclude,
      orderBy: { createdAt: "desc" }
    });

    return record ? toGuidedCheckIn(record) : null;
  },
  async getCheckIn(input) {
    const record = await prisma.checkIn.findFirst({
      where: {
        id: input.checkInId,
        householdId: input.householdId
      },
      include: checkInInclude
    });

    return record ? toGuidedCheckIn(record) : null;
  },
  async listAgendaSources(input) {
    const dueAt = input.asOf;
    const [radarItems, responsibilities] = await Promise.all([
      prisma.radarItem.findMany({
        where: {
          householdId: input.householdId,
          state: { in: ["open", "scheduled"] },
          OR: [
            { visibility: { not: "private" } },
            { visibility: "private", createdByPersonaId: input.selectedPersonaId }
          ]
        },
        orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
        take: 5
      }),
      prisma.responsibility.findMany({
        where: {
          householdId: input.householdId,
          status: { in: ["active", "needs_review", "unassigned"] },
          nextReviewAt: { lte: dueAt }
        },
        orderBy: { nextReviewAt: "asc" },
        take: 5
      })
    ]);

    return {
      radarItems: radarItems.map((item) => ({
        id: item.id,
        topic: item.topic,
        reasonKey: item.reasonKey,
        visibility: item.visibility,
        state: item.state,
        responsibilityId: item.responsibilityId
      })),
      responsibilities: responsibilities.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        cadence: item.cadence,
        nextReviewAt: nullableIso(item.nextReviewAt)
      }))
    };
  },
  async createCheckIn(input) {
    const record = await prisma.checkIn.create({
      data: {
        householdId: input.householdId,
        facilitatorPersonaId: input.facilitatorPersonaId,
        state: input.state,
        startedAt: input.state === "active" ? new Date() : null,
        items: {
          create: input.items.map((item, index) => ({
            itemType: item.itemType,
            radarItemId: item.radarItemId,
            responsibilityId: item.responsibilityId,
            promptKey: item.promptKey,
            state: "queued",
            sortOrder: index
          }))
        }
      },
      include: checkInInclude
    });

    return toGuidedCheckIn(record);
  },
  async updateItem(input) {
    await prisma.checkIn.findFirstOrThrow({
      where: {
        id: input.checkInId,
        householdId: input.householdId
      },
      select: { id: true }
    });
    const update = await prisma.checkInItem.updateMany({
      where: {
        id: input.itemId,
        checkInId: input.checkInId
      },
      data: {
        state: input.state,
        response: input.response ?? null
      }
    });

    if (update.count !== 1) {
      throw new CheckInServiceError("NOT_FOUND", "Check-in item not found.");
    }

    const item = await prisma.checkInItem.findFirstOrThrow({
      where: {
        id: input.itemId,
        checkInId: input.checkInId
      },
      include: {
        radarItem: { select: { topic: true, visibility: true } },
        responsibility: { select: { title: true, status: true, nextReviewAt: true } }
      }
    });

    return toGuidedCheckIn({
      id: input.checkInId,
      householdId: input.householdId,
      state: "active",
      scheduledFor: null,
      startedAt: null,
      completedAt: null,
      summary: null,
      facilitatorPersona: null,
      items: [item],
      decisions: []
    }).items[0];
  },
  async createDecision(input) {
    const decision = await prisma.decision.create({
      data: {
        householdId: input.householdId,
        checkInId: input.checkInId,
        responsibilityId: input.decision.responsibilityId ?? null,
        decisionType: input.decision.decisionType,
        summary: input.decision.summary,
        effectiveAt: new Date(input.decision.effectiveAt),
        reviewOn: input.decision.reviewOn ? new Date(input.decision.reviewOn) : null,
        createdByPersonaId: input.createdByPersonaId
      }
    });

    return {
      id: decision.id,
      decisionType: decision.decisionType,
      summary: decision.summary,
      effectiveAt: decision.effectiveAt.toISOString(),
      reviewOn: nullableIso(decision.reviewOn),
      responsibilityId: decision.responsibilityId
    };
  },
  async updateItemDecision(input) {
    await prisma.checkIn.findFirstOrThrow({
      where: {
        id: input.checkInId,
        householdId: input.householdId
      },
      select: { id: true }
    });
    const update = await prisma.checkInItem.updateMany({
      where: {
        id: input.itemId,
        checkInId: input.checkInId
      },
      data: {
        state: "discussed",
        decisionId: input.decisionId
      }
    });

    if (update.count !== 1) {
      throw new CheckInServiceError("NOT_FOUND", "Check-in item not found.");
    }

    const item = await prisma.checkInItem.findFirstOrThrow({
      where: {
        id: input.itemId,
        checkInId: input.checkInId
      },
      include: {
        radarItem: { select: { topic: true, visibility: true } },
        responsibility: { select: { title: true, status: true, nextReviewAt: true } }
      }
    });

    return toGuidedCheckIn({
      id: input.checkInId,
      householdId: input.householdId,
      state: "active",
      scheduledFor: null,
      startedAt: null,
      completedAt: null,
      summary: null,
      facilitatorPersona: null,
      items: [item],
      decisions: []
    }).items[0];
  },
  async applyResponsibilityDecision(input) {
    const effect = input.decision.responsibilityEffect;
    if (!effect) {
      return;
    }

    if (effect.kind === "assign_owner" || effect.kind === "change_role") {
      await responsibilityService.updateAssignments(input.session, input.responsibilityId, {
        effectiveAt: input.decision.effectiveAt,
        assignments: effect.assignments,
        handoffNotes: effect.handoffNotes,
        revisitAt: effect.revisitAt
      });
      return;
    }

    if (effect.kind === "change_cadence") {
      await responsibilityService.update(input.session, input.responsibilityId, {
        cadence: effect.cadence
      });
      return;
    }

    if (effect.kind === "change_standard") {
      await responsibilityService.update(input.session, input.responsibilityId, {
        householdStandard: effect.householdStandard
      });
      return;
    }

    if (effect.kind === "change_visibility") {
      await responsibilityService.updateVisibility(input.session, input.responsibilityId, {
        responsibilityId: input.responsibilityId,
        fromVisibility: "shared_household",
        toVisibility: effect.visibility,
        confirmedVisibilityChange: true
      });
      return;
    }

    const statusByKind = {
      pause: "paused",
      mark_not_relevant: "not_relevant",
      archive: "archived",
      schedule_review: "needs_review"
    } as const;

    await responsibilityService.updateStatus(input.session, input.responsibilityId, {
      status: statusByKind[effect.kind],
      reviewOn:
        "reviewOn" in effect ? effect.reviewOn ?? input.decision.reviewOn ?? null : null,
      confirmedArchive: effect.kind === "archive" ? true : undefined,
      note: input.decision.summary
    });
  },
  async applyRadarDecision(input) {
    if (input.decisionType === "custom_note") {
      return;
    }

    await radarService.resolve(input.session, input.radarItemId, {
      id: input.radarItemId,
      resolvedAt: input.effectiveAt
    });
  },
  async completeCheckIn(input) {
    const record = await prisma.checkIn.update({
      where: { id: input.checkInId },
      data: {
        state: "completed",
        completedAt: new Date(input.completedAt),
        summary: input.summary
      },
      include: checkInInclude
    });

    return toGuidedCheckIn(record);
  }
});

export function parseCheckInId(value: string): CheckInId | null {
  const parsed = CheckInIdSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

export function parseCheckInItemId(value: string): CheckInItemId | null {
  const parsed = CheckInItemIdSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}
