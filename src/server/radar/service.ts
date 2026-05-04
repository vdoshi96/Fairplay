import type {
  RadarReasonKey,
  RadarState,
  Urgency,
  Visibility
} from "@/domain/enums";
import type {
  CheckInId,
  HouseholdId,
  PersonaId,
  RadarItemId,
  ResponsibilityId
} from "@/domain/ids";
import type {
  RadarCreate,
  RadarDeferMutation,
  RadarDetail,
  RadarPublishMutation,
  RadarResolveMutation,
  RadarSummary,
  RadarUpdate
} from "@/contracts/radar";
import { assertVisibilityTransition } from "@/domain/visibility";
import type { CurrentSession } from "@/server/auth/current-session";
import { prisma } from "@/server/db/prisma";

export type RadarServiceErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class RadarServiceError extends Error {
  readonly code: RadarServiceErrorCode;

  constructor(code: RadarServiceErrorCode, message: string) {
    super(message);
    this.name = "RadarServiceError";
    this.code = code;
  }
}

export type RadarRecord = RadarDetail & {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
};

type CreateRadarRecordInput = RadarCreate & {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  state: RadarState;
  targetCheckInId?: CheckInId | null;
};

type UpdateRadarRecordInput = Partial<
  Pick<
    RadarRecord,
    | "topic"
    | "notes"
    | "responsibilityId"
    | "reasonKey"
    | "urgency"
    | "visibility"
    | "state"
    | "targetCheckInId"
    | "resolvedAt"
  >
> & {
  id: RadarItemId;
};

export type RadarServiceDeps = {
  ensurePersonaInHousehold: (input: {
    householdId: HouseholdId;
    personaId: PersonaId;
  }) => Promise<boolean>;
  ensureResponsibilityInHousehold: (input: {
    householdId: HouseholdId;
    responsibilityId: ResponsibilityId;
  }) => Promise<boolean>;
  ensureCheckInInHousehold: (input: {
    householdId: HouseholdId;
    checkInId: CheckInId;
  }) => Promise<boolean>;
  listRecords: (input: {
    householdId: HouseholdId;
    selectedPersonaId: PersonaId;
  }) => Promise<RadarRecord[]>;
  getRecord: (input: {
    householdId: HouseholdId;
    id: RadarItemId;
  }) => Promise<RadarRecord | null>;
  createRecord: (input: CreateRadarRecordInput) => Promise<RadarDetail>;
  updateRecord: (input: UpdateRadarRecordInput) => Promise<RadarDetail>;
};

export type RadarScheduleMutation = {
  targetCheckInId?: CheckInId | null;
};

function requireSelectedPersona(session: CurrentSession): PersonaId {
  if (!session.selectedPersonaId) {
    throw new RadarServiceError("AUTH_REQUIRED", "A selected persona is required.");
  }

  return session.selectedPersonaId;
}

function defaultStateForVisibility(visibility: Visibility): RadarState {
  return visibility === "private" ? "draft" : "open";
}

function canSeeRecord(record: RadarRecord, session: CurrentSession): boolean {
  return (
    record.householdId === session.householdId &&
    (record.visibility !== "private" ||
      record.createdByPersonaId === session.selectedPersonaId)
  );
}

function toSummary(record: RadarRecord): RadarSummary {
  return {
    id: record.id,
    topic: record.topic,
    responsibilityId: record.responsibilityId,
    reasonKey: record.reasonKey,
    urgency: record.urgency,
    visibility: record.visibility,
    state: record.state
  };
}

async function assertPersonaInHousehold(
  deps: RadarServiceDeps,
  householdId: HouseholdId,
  selectedPersonaId: PersonaId
) {
  const valid = await deps.ensurePersonaInHousehold({
    householdId,
    personaId: selectedPersonaId
  });

  if (!valid) {
    throw new RadarServiceError(
      "INVALID_INPUT",
      "Selected persona does not belong to household."
    );
  }
}

async function assertResponsibilityInHousehold(
  deps: RadarServiceDeps,
  householdId: HouseholdId,
  responsibilityId?: ResponsibilityId | null
) {
  if (!responsibilityId) {
    return;
  }

  const valid = await deps.ensureResponsibilityInHousehold({
    householdId,
    responsibilityId
  });

  if (!valid) {
    throw new RadarServiceError(
      "INVALID_INPUT",
      "Radar responsibility must belong to household."
    );
  }
}

async function assertCheckInInHousehold(
  deps: RadarServiceDeps,
  householdId: HouseholdId,
  checkInId?: CheckInId | null
) {
  if (!checkInId) {
    return;
  }

  const valid = await deps.ensureCheckInInHousehold({
    householdId,
    checkInId
  });

  if (!valid) {
    throw new RadarServiceError(
      "INVALID_INPUT",
      "Target check-in must belong to household."
    );
  }
}

async function getVisibleRecord(
  deps: RadarServiceDeps,
  session: CurrentSession,
  id: RadarItemId
) {
  requireSelectedPersona(session);
  const record = await deps.getRecord({
    householdId: session.householdId,
    id
  });

  if (!record || !canSeeRecord(record, session)) {
    throw new RadarServiceError("NOT_FOUND", "Radar item not found.");
  }

  return record;
}

export function createRadarService(deps: RadarServiceDeps) {
  return {
    async list(session: CurrentSession): Promise<RadarSummary[]> {
      const selectedPersonaId = requireSelectedPersona(session);
      await assertPersonaInHousehold(deps, session.householdId, selectedPersonaId);
      const records = await deps.listRecords({
        householdId: session.householdId,
        selectedPersonaId
      });

      return records.filter((record) => canSeeRecord(record, session)).map(toSummary);
    },

    async get(
      session: CurrentSession,
      radarItemId: RadarItemId
    ): Promise<RadarDetail> {
      const record = await getVisibleRecord(deps, session, radarItemId);

      return {
        id: record.id,
        topic: record.topic,
        responsibilityId: record.responsibilityId,
        reasonKey: record.reasonKey,
        urgency: record.urgency,
        visibility: record.visibility,
        state: record.state,
        notes: record.notes,
        targetCheckInId: record.targetCheckInId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        resolvedAt: record.resolvedAt
      };
    },

    async create(
      session: CurrentSession,
      input: RadarCreate
    ): Promise<RadarDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      await assertPersonaInHousehold(deps, session.householdId, createdByPersonaId);
      await assertResponsibilityInHousehold(
        deps,
        session.householdId,
        input.responsibilityId
      );

      return deps.createRecord({
        ...input,
        householdId: session.householdId,
        createdByPersonaId,
        notes: input.notes ?? null,
        responsibilityId: input.responsibilityId ?? null,
        visibility: input.visibility ?? "private",
        urgency: input.urgency ?? "normal",
        state: defaultStateForVisibility(input.visibility ?? "private")
      });
    },

    async update(
      session: CurrentSession,
      radarItemId: RadarItemId,
      input: Partial<Omit<RadarUpdate, "id" | "visibility">>
    ): Promise<RadarDetail> {
      await getVisibleRecord(deps, session, radarItemId);
      await assertResponsibilityInHousehold(
        deps,
        session.householdId,
        input.responsibilityId
      );
      await assertCheckInInHousehold(
        deps,
        session.householdId,
        input.targetCheckInId
      );

      return deps.updateRecord({
        ...input,
        id: radarItemId
      });
    },

    async publish(
      session: CurrentSession,
      radarItemId: RadarItemId,
      input: RadarPublishMutation
    ): Promise<RadarDetail> {
      if (input.id !== radarItemId) {
        throw new RadarServiceError(
          "INVALID_INPUT",
          "Publish request does not match this radar item."
        );
      }

      const record = await getVisibleRecord(deps, session, radarItemId);
      if (record.visibility !== input.fromVisibility) {
        throw new RadarServiceError(
          "INVALID_INPUT",
          "Publish request is based on stale radar visibility."
        );
      }

      try {
        assertVisibilityTransition({
          from: input.fromVisibility,
          to: input.visibility,
          confirmed: input.confirmPrivateDraftPublish
        });
      } catch (error) {
        throw new RadarServiceError(
          "INVALID_INPUT",
          error instanceof Error
            ? error.message
            : "Publishing a private draft needs confirmation."
        );
      }

      return deps.updateRecord({
        id: radarItemId,
        visibility: input.visibility,
        state: "open",
        resolvedAt: null
      });
    },

    async defer(
      session: CurrentSession,
      radarItemId: RadarItemId,
      input: RadarDeferMutation
    ): Promise<RadarDetail> {
      if (input.id !== radarItemId) {
        throw new RadarServiceError(
          "INVALID_INPUT",
          "Defer request does not match this radar item."
        );
      }

      await getVisibleRecord(deps, session, radarItemId);

      return deps.updateRecord({
        id: radarItemId,
        state: "deferred",
        resolvedAt: null
      });
    },

    async resolve(
      session: CurrentSession,
      radarItemId: RadarItemId,
      input: RadarResolveMutation
    ): Promise<RadarDetail> {
      if (input.id !== radarItemId) {
        throw new RadarServiceError(
          "INVALID_INPUT",
          "Resolve request does not match this radar item."
        );
      }

      await getVisibleRecord(deps, session, radarItemId);

      return deps.updateRecord({
        id: radarItemId,
        state: "resolved",
        resolvedAt: input.resolvedAt
      });
    },

    async schedule(
      session: CurrentSession,
      radarItemId: RadarItemId,
      input: RadarScheduleMutation
    ): Promise<RadarDetail> {
      await getVisibleRecord(deps, session, radarItemId);
      await assertCheckInInHousehold(
        deps,
        session.householdId,
        input.targetCheckInId
      );

      return deps.updateRecord({
        id: radarItemId,
        state: "scheduled",
        targetCheckInId: input.targetCheckInId ?? null
      });
    }
  };
}

function nullableIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function toRadarRecord(item: {
  id: string;
  householdId: string;
  createdByPersonaId: string;
  responsibilityId: string | null;
  topic: string;
  notes: string | null;
  reasonKey: RadarReasonKey;
  urgency: Urgency;
  visibility: Visibility;
  state: RadarState;
  targetCheckInId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}): RadarRecord {
  return {
    id: item.id,
    householdId: item.householdId,
    createdByPersonaId: item.createdByPersonaId,
    responsibilityId: item.responsibilityId,
    topic: item.topic,
    notes: item.notes,
    reasonKey: item.reasonKey,
    urgency: item.urgency,
    visibility: item.visibility,
    state: item.state,
    targetCheckInId: item.targetCheckInId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    resolvedAt: nullableIso(item.resolvedAt)
  };
}

function toRadarDetail(record: RadarRecord): RadarDetail {
  return {
    id: record.id,
    topic: record.topic,
    responsibilityId: record.responsibilityId,
    reasonKey: record.reasonKey,
    urgency: record.urgency,
    visibility: record.visibility,
    state: record.state,
    notes: record.notes,
    targetCheckInId: record.targetCheckInId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    resolvedAt: record.resolvedAt
  };
}

export const radarService = createRadarService({
  async ensurePersonaInHousehold(input) {
    const count = await prisma.persona.count({
      where: {
        id: input.personaId,
        householdId: input.householdId
      }
    });

    return count === 1;
  },
  async ensureResponsibilityInHousehold(input) {
    const count = await prisma.responsibility.count({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      }
    });

    return count === 1;
  },
  async ensureCheckInInHousehold(input) {
    const count = await prisma.checkIn.count({
      where: {
        id: input.checkInId,
        householdId: input.householdId
      }
    });

    return count === 1;
  },
  async listRecords(input) {
    const items = await prisma.radarItem.findMany({
      where: {
        householdId: input.householdId,
        OR: [
          {
            visibility: {
              not: "private"
            }
          },
          {
            visibility: "private",
            createdByPersonaId: input.selectedPersonaId
          }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return items.map(toRadarRecord);
  },
  async getRecord(input) {
    const item = await prisma.radarItem.findFirst({
      where: {
        id: input.id,
        householdId: input.householdId
      }
    });

    return item ? toRadarRecord(item) : null;
  },
  async createRecord(input) {
    const item = await prisma.radarItem.create({
      data: {
        householdId: input.householdId,
        createdByPersonaId: input.createdByPersonaId,
        responsibilityId: input.responsibilityId ?? null,
        topic: input.topic,
        notes: input.notes ?? null,
        reasonKey: input.reasonKey,
        urgency: input.urgency,
        visibility: input.visibility ?? "private",
        state: input.state,
        targetCheckInId: input.targetCheckInId ?? null
      }
    });

    return toRadarDetail(toRadarRecord(item));
  },
  async updateRecord(input) {
    const item = await prisma.radarItem.update({
      where: {
        id: input.id
      },
      data: {
        topic: input.topic,
        notes: input.notes,
        responsibilityId: input.responsibilityId,
        reasonKey: input.reasonKey,
        urgency: input.urgency,
        visibility: input.visibility,
        state: input.state,
        targetCheckInId: input.targetCheckInId,
        resolvedAt:
          input.resolvedAt === undefined || input.resolvedAt === null
            ? input.resolvedAt
            : new Date(input.resolvedAt)
      }
    });

    return toRadarDetail(toRadarRecord(item));
  }
});
