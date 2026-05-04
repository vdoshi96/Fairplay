import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL =
    "postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public";
}

const globalForPrisma = globalThis as typeof globalThis & {
  fairplayPrisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient();
}

export const prisma = globalForPrisma.fairplayPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.fairplayPrisma = prisma;
}
