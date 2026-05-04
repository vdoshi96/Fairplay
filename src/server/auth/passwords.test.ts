import { describe, expect, it } from "vitest";

import {
  PASSWORD_HASH_METADATA,
  hashPassword,
  verifyPassword
} from "./passwords";

describe("password hashing", () => {
  it("hashes with versioned Argon2id metadata and verifies the password", async () => {
    const password = "correct horse battery staple";

    const result = await hashPassword(password);

    expect(result.passwordHash).not.toBe(password);
    expect(result.passwordHash).toContain("$argon2id$");
    expect(result.hashAlgorithm).toBe("argon2id");
    expect(result.hashParamsVersion).toBe("v1");
    expect(PASSWORD_HASH_METADATA).toMatchObject({
      algorithm: "argon2id",
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
      paramsVersion: "v1"
    });
    await expect(verifyPassword(result.passwordHash, password)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const result = await hashPassword("correct horse battery staple");

    await expect(verifyPassword(result.passwordHash, "wrong password")).resolves.toBe(
      false
    );
  });

  it("treats malformed stored hashes as invalid passwords", async () => {
    await expect(
      verifyPassword("not-an-argon2-hash", "correct horse battery staple")
    ).resolves.toBe(false);
  });
});
