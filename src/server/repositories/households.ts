import type { Household } from "@prisma/client";

import type {
  CreateHouseholdResponse,
  HouseholdSummary
} from "../../contracts/auth";
import type { HouseholdId } from "../../domain/ids";
import { mapPrismaConflict } from "../db/errors";
import { prisma } from "../db/prisma";
import { toPersonaSummary } from "./personas";

export type CreateHouseholdWithPersonasInput = {
  householdName: string;
  usernameNormalized: string;
  timezone: string;
  passwordHash: string;
  hashAlgorithm: string;
  hashParamsVersion: string;
};

export function toHouseholdSummary(household: Household): HouseholdSummary {
  return {
    id: household.id,
    name: household.name,
    timezone: household.timezone
  };
}

export async function createHouseholdWithPersonas(
  input: CreateHouseholdWithPersonasInput
): Promise<CreateHouseholdResponse> {
  try {
    const household = await prisma.household.create({
      data: {
        name: input.householdName,
        usernameNormalized: input.usernameNormalized,
        timezone: input.timezone,
        credential: {
          create: {
            passwordHash: input.passwordHash,
            hashAlgorithm: input.hashAlgorithm,
            hashParamsVersion: input.hashParamsVersion,
            lastRotatedAt: new Date()
          }
        },
        personas: {
          create: [
            {
              key: "alex",
              displayName: "Alex",
              avatarKey: "alex"
            },
            {
              key: "max",
              displayName: "Max",
              avatarKey: "max"
            }
          ]
        }
      },
      include: {
        personas: true
      }
    });
    const personas = household.personas.sort((left, right) =>
      left.key === "alex" && right.key === "max" ? -1 : 1
    );

    return {
      household: {
        id: household.id,
        name: household.name,
        timezone: household.timezone
      },
      personas: [toPersonaSummary(personas[0]), toPersonaSummary(personas[1])],
      requiresPersonaSelection: true
    };
  } catch (error) {
    mapPrismaConflict(error, "A household with that username already exists.");
  }
}

export async function findHouseholdByUsernameNormalized(
  usernameNormalized: string
) {
  return prisma.household.findUnique({
    where: {
      usernameNormalized
    },
    include: {
      credential: true,
      personas: {
        orderBy: {
          key: "asc"
        }
      }
    }
  });
}

export async function findHouseholdSummaryById(
  householdId: HouseholdId
): Promise<HouseholdSummary | null> {
  const household = await prisma.household.findUnique({
    where: {
      id: householdId
    }
  });

  return household ? toHouseholdSummary(household) : null;
}
