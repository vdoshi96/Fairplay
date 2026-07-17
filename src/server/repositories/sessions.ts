import type { Session } from "@prisma/client";

import type { SelectPersonaResponse } from "../../contracts/auth";
import type { HouseholdId, PersonaId } from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";
import { personaBelongsToHousehold } from "./personas";

export type SessionSummary = {
  id: string;
  householdId: HouseholdId;
  selectedPersonaId: PersonaId | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userAgentHash: string | null;
};

function toSessionSummary(session: Session): SessionSummary {
  return {
    id: session.id,
    householdId: session.householdId,
    selectedPersonaId: session.selectedPersonaId,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    revokedAt: session.revokedAt?.toISOString() ?? null,
    userAgentHash: session.userAgentHash
  };
}

export async function createSession(input: {
  householdId: HouseholdId;
  tokenHash: string;
  expiresAt: string | Date;
  selectedPersonaId?: PersonaId | null;
  userAgentHash?: string | null;
}): Promise<SessionSummary> {
  if (input.selectedPersonaId) {
    const belongs = await personaBelongsToHousehold({
      householdId: input.householdId,
      personaId: input.selectedPersonaId
    });

    if (!belongs) {
      throw new RepositoryError("INVALID_INPUT", "Persona does not belong to household.");
    }
  }

  const session = await prisma.session.create({
    data: {
      householdId: input.householdId,
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.expiresAt),
      selectedPersonaId: input.selectedPersonaId ?? null,
      userAgentHash: input.userAgentHash ?? null
    }
  });

  return toSessionSummary(session);
}

export async function findSessionByTokenHash(
  tokenHash: string
): Promise<SessionSummary | null> {
  const session = await prisma.session.findUnique({
    where: {
      tokenHash
    }
  });

  return session ? toSessionSummary(session) : null;
}

export async function touchSessionActivity(input: {
  sessionId: string;
  householdId: HouseholdId;
  seenAt: string | Date;
  lastSeenAtOrBefore: string | Date;
}): Promise<SessionSummary | null> {
  const updated = await prisma.session.updateMany({
    where: {
      id: input.sessionId,
      householdId: input.householdId,
      revokedAt: null,
      lastSeenAt: {
        lte: new Date(input.lastSeenAtOrBefore)
      }
    },
    data: {
      lastSeenAt: new Date(input.seenAt)
    }
  });

  if (updated.count !== 0 && updated.count !== 1) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: input.sessionId,
      householdId: input.householdId
    }
  });

  return session ? toSessionSummary(session) : null;
}

export async function selectSessionPersona(input: {
  sessionId: string;
  householdId: HouseholdId;
  selectedPersonaId: PersonaId;
}): Promise<SelectPersonaResponse> {
  const session = await prisma.$transaction(async (tx) => {
    const existing = await tx.session.findFirst({
      where: {
        id: input.sessionId,
        householdId: input.householdId
      },
      select: {
        id: true
      }
    });
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Session not found for household.");
    }

    const belongs = await tx.persona.count({
      where: {
        id: input.selectedPersonaId,
        householdId: input.householdId
      }
    });
    if (belongs !== 1) {
      throw new RepositoryError("INVALID_INPUT", "Persona does not belong to household.");
    }

    return tx.session.update({
      where: {
        id: input.sessionId
      },
      data: {
        selectedPersonaId: input.selectedPersonaId,
        lastSeenAt: new Date()
      }
    });
  });

  return {
    session: {
      householdId: session.householdId,
      selectedPersonaId: session.selectedPersonaId ?? input.selectedPersonaId,
      expiresAt: session.expiresAt.toISOString()
    }
  };
}

export async function revokeSession(input: {
  householdId: HouseholdId;
  sessionId: string;
}): Promise<SessionSummary> {
  const session = await prisma.$transaction(async (tx) => {
    const existing = await tx.session.findFirst({
      where: {
        id: input.sessionId,
        householdId: input.householdId
      },
      select: {
        id: true
      }
    });
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Session not found for household.");
    }

    return tx.session.update({
      where: {
        id: input.sessionId
      },
      data: {
        revokedAt: new Date()
      }
    });
  });

  return toSessionSummary(session);
}
