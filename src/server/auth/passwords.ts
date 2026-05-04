import { hash, verify } from "@node-rs/argon2";

export const PASSWORD_HASH_METADATA = {
  algorithm: "argon2id",
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  paramsVersion: "v1"
} as const;

const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: PASSWORD_HASH_METADATA.memoryCost,
  timeCost: PASSWORD_HASH_METADATA.timeCost,
  parallelism: PASSWORD_HASH_METADATA.parallelism,
  outputLen: PASSWORD_HASH_METADATA.hashLength,
  version: 1
};

export const MISSING_CREDENTIAL_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$cMyt4aJvRIArqwUohxPEyw$bTeSZeXpwqZlVvM8xGSNJBmIVL1py/42yLqN/hqV7ew";

export type PasswordHashResult = {
  passwordHash: string;
  hashAlgorithm: typeof PASSWORD_HASH_METADATA.algorithm;
  hashParamsVersion: typeof PASSWORD_HASH_METADATA.paramsVersion;
};

export async function hashPassword(password: string): Promise<PasswordHashResult> {
  const passwordHash = await hash(password, ARGON2_OPTIONS);

  return {
    passwordHash,
    hashAlgorithm: PASSWORD_HASH_METADATA.algorithm,
    hashParamsVersion: PASSWORD_HASH_METADATA.paramsVersion
  };
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
