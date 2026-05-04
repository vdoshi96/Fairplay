import { PrismaClient } from "@prisma/client";

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS ?? 1000);
const startedAt = Date.now();
let lastError;

while (Date.now() - startedAt < timeoutMs) {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    lastError = error;
    await prisma.$disconnect().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

console.error("Timed out waiting for the database.");

if (lastError) {
  console.error(lastError);
}

process.exit(1);
