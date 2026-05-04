import type {
  CheckIn,
  CheckInItem,
  CheckInItemState,
  Decision,
  DecisionType
} from "@prisma/client";

import type {
  CheckInAgenda,
  CheckInAgendaItem,
  CheckInDecision
} from "../../contracts/check-ins";
import type {
  CheckInId,
  CheckInItemId,
  HouseholdId,
  PersonaId,
  RadarItemId,
  ResponsibilityId
} from "../../domain/ids";
import { prisma } from "../db/prisma";

type CheckInWithItems = CheckIn & {
  facilitatorPersona: {
    key: "alex" | "max";
  } | null;
  items: CheckInItem[];
};

export type CompletedCheckInSummary = {
  id: CheckInId;
  state: "completed";
  completedAt: string;
  summary: string | null;
  discussedItemCount: number;
  decisionCount: number;
};

function nullableIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function toAgendaItem(item: CheckInItem): CheckInAgendaItem {
  return {
    id: item.id,
    itemType: item.itemType,
    state: item.state,
    promptKey: item.promptKey,
    radarItemId: item.radarItemId,
    responsibilityId: item.responsibilityId,
    sortOrder: item.sortOrder
  };
}

function toAgenda(checkIn: CheckInWithItems): CheckInAgenda {
  return {
    id: checkIn.id,
    state: checkIn.state,
    scheduledFor: nullableIso(checkIn.scheduledFor),
    facilitatorPersonaKey: checkIn.facilitatorPersona?.key ?? null,
    items: checkIn.items.sort((left, right) => left.sortOrder - right.sortOrder).map(toAgendaItem)
  };
}

function promptKeyForItem(input: {
  radarItemId?: RadarItemId | null;
  responsibilityId?: ResponsibilityId | null;
}) {
  if (input.radarItemId) {
    return "radar_discussion";
  }

  if (input.responsibilityId) {
    return "responsibility_review";
  }

  return "custom_topic";
}

export async function createCheckIn(input: {
  householdId: HouseholdId;
  facilitatorPersonaId?: PersonaId | null;
  scheduledFor?: string | Date | null;
  radarItemIds: RadarItemId[];
  responsibilityIds: ResponsibilityId[];
}): Promise<CheckInAgenda> {
  const items = [
    ...input.radarItemIds.map((radarItemId) => ({
      radarItemId,
      responsibilityId: null
    })),
    ...input.responsibilityIds.map((responsibilityId) => ({
      radarItemId: null,
      responsibilityId
    }))
  ];
  const checkIn = await prisma.checkIn.create({
    data: {
      householdId: input.householdId,
      facilitatorPersonaId: input.facilitatorPersonaId ?? null,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      state: input.scheduledFor ? "scheduled" : "draft",
      items: {
        create: items.map((item, index) => ({
          itemType: item.radarItemId ? "radar" : "responsibility",
          radarItemId: item.radarItemId,
          responsibilityId: item.responsibilityId,
          state: "queued",
          promptKey: promptKeyForItem(item),
          sortOrder: index
        }))
      }
    },
    include: {
      facilitatorPersona: {
        select: {
          key: true
        }
      },
      items: true
    }
  });

  return toAgenda(checkIn as CheckInWithItems);
}

export async function recordCheckInItemDecision(input: {
  householdId: HouseholdId;
  checkInId: CheckInId;
  itemId: CheckInItemId;
  createdByPersonaId: PersonaId;
  state: CheckInItemState;
  response?: string | null;
  decision?: CheckInDecision | null;
}): Promise<CheckInAgendaItem> {
  const item = await prisma.$transaction(async (tx) => {
    let decision: Decision | null = null;

    if (input.decision) {
      decision = await tx.decision.create({
        data: {
          householdId: input.householdId,
          checkInId: input.checkInId,
          responsibilityId: input.decision.responsibilityId ?? null,
          decisionType: input.decision.decisionType as DecisionType,
          summary: input.decision.summary,
          effectiveAt: new Date(input.decision.effectiveAt),
          reviewOn: input.decision.reviewOn ? new Date(input.decision.reviewOn) : null,
          createdByPersonaId: input.createdByPersonaId
        }
      });
    }

    return tx.checkInItem.update({
      where: {
        id: input.itemId
      },
      data: {
        state: input.state,
        response: input.response ?? null,
        decisionId: decision?.id ?? null
      }
    });
  });

  return toAgendaItem(item);
}

export async function completeCheckIn(input: {
  id: CheckInId;
  completedAt: string | Date;
  summary?: string | null;
}): Promise<CompletedCheckInSummary> {
  const checkIn = await prisma.checkIn.update({
    where: {
      id: input.id
    },
    data: {
      state: "completed",
      completedAt: new Date(input.completedAt),
      summary: input.summary ?? null
    },
    include: {
      items: true,
      decisions: true
    }
  });

  return {
    id: checkIn.id,
    state: "completed",
    completedAt: checkIn.completedAt?.toISOString() ?? new Date(input.completedAt).toISOString(),
    summary: checkIn.summary,
    discussedItemCount: checkIn.items.filter((item) => item.state === "discussed").length,
    decisionCount: checkIn.decisions.length
  };
}
