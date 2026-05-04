import type {
  RadarItem,
  RadarReasonKey,
  RadarState,
  Urgency,
  Visibility
} from "@prisma/client";

import type { RadarDetail, RadarSummary } from "../../contracts/radar";
import type {
  CheckInId,
  HouseholdId,
  PersonaId,
  RadarItemId,
  ResponsibilityId
} from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";

export type CreateRadarItemInput = {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  responsibilityId?: ResponsibilityId | null;
  topic: string;
  notes?: string | null;
  reasonKey: RadarReasonKey;
  urgency: Urgency;
  visibility: Visibility;
  targetCheckInId?: CheckInId | null;
};

function nullableIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function toRadarSummary(item: RadarItem): RadarSummary {
  return {
    id: item.id,
    topic: item.topic,
    responsibilityId: item.responsibilityId,
    reasonKey: item.reasonKey,
    urgency: item.urgency,
    visibility: item.visibility,
    state: item.state
  };
}

function toRadarDetail(item: RadarItem): RadarDetail {
  return {
    ...toRadarSummary(item),
    notes: item.notes,
    targetCheckInId: item.targetCheckInId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    resolvedAt: nullableIso(item.resolvedAt)
  };
}

function defaultStateForVisibility(visibility: Visibility): RadarState {
  return visibility === "private" ? "draft" : "open";
}

export async function createRadarItem(
  input: CreateRadarItemInput
): Promise<RadarDetail> {
  const [creatorCount, responsibilityCount, checkInCount] = await Promise.all([
    prisma.persona.count({
      where: {
        id: input.createdByPersonaId,
        householdId: input.householdId
      }
    }),
    input.responsibilityId
      ? prisma.responsibility.count({
          where: {
            id: input.responsibilityId,
            householdId: input.householdId
          }
        })
      : Promise.resolve(1),
    input.targetCheckInId
      ? prisma.checkIn.count({
          where: {
            id: input.targetCheckInId,
            householdId: input.householdId
          }
        })
      : Promise.resolve(1)
  ]);

  if (creatorCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Creator persona does not belong to household.");
  }

  if (responsibilityCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Radar responsibility must belong to household.");
  }

  if (checkInCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Target check-in must belong to household.");
  }

  const radarItem = await prisma.radarItem.create({
    data: {
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      responsibilityId: input.responsibilityId ?? null,
      topic: input.topic,
      notes: input.notes ?? null,
      reasonKey: input.reasonKey,
      urgency: input.urgency,
      visibility: input.visibility,
      state: defaultStateForVisibility(input.visibility),
      targetCheckInId: input.targetCheckInId ?? null
    }
  });

  return toRadarDetail(radarItem);
}

export async function listRadarItemsForPersona(input: {
  householdId: HouseholdId;
  selectedPersonaId: PersonaId;
}): Promise<RadarSummary[]> {
  const selectedPersonaCount = await prisma.persona.count({
    where: {
      id: input.selectedPersonaId,
      householdId: input.householdId
    }
  });

  if (selectedPersonaCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Selected persona does not belong to household.");
  }

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

  return items.map(toRadarSummary);
}

export async function updateRadarState(input: {
  householdId: HouseholdId;
  selectedPersonaId: PersonaId;
  id: RadarItemId;
  state: RadarState;
  resolvedAt?: string | Date | null;
}): Promise<RadarDetail> {
  const item = await prisma.$transaction(async (tx) => {
    const selectedPersonaCount = await tx.persona.count({
      where: {
        id: input.selectedPersonaId,
        householdId: input.householdId
      }
    });
    if (selectedPersonaCount !== 1) {
      throw new RepositoryError("INVALID_INPUT", "Selected persona does not belong to household.");
    }

    const existing = await tx.radarItem.findFirst({
      where: {
        id: input.id,
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
      select: {
        id: true
      }
    });
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Radar item not found for household and persona.");
    }

    return tx.radarItem.update({
      where: {
        id: input.id
      },
      data: {
        state: input.state,
        resolvedAt:
          input.resolvedAt === undefined || input.resolvedAt === null
            ? null
            : new Date(input.resolvedAt)
      }
    });
  });

  return toRadarDetail(item);
}
