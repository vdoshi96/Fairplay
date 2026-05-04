import { Prisma } from "@prisma/client";

export type RepositoryErrorCode = "CONFLICT" | "NOT_FOUND" | "INVALID_INPUT";

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function mapPrismaConflict(error: unknown, message: string): never {
  if (isUniqueConstraintError(error)) {
    throw new RepositoryError("CONFLICT", message);
  }

  throw error;
}
