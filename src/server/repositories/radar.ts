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
  id: RadarItemId;
  state: RadarState;
  resolvedAt?: string | Date | null;
}): Promise<RadarDetail> {
  const item = await prisma.radarItem.update({
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

  return toRadarDetail(item);
}
