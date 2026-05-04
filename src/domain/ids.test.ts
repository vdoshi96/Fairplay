import { describe, expect, it } from "vitest";

import { HouseholdUsernameSchema, normalizeHouseholdUsername } from "./ids";

describe("domain id and username helpers", () => {
  it("normalizes household usernames by trimming, lowercasing, and collapsing separators", () => {
    expect(normalizeHouseholdUsername("  Maple   House  ")).toBe("maple-house");
    expect(normalizeHouseholdUsername("MAPLE---HOUSE")).toBe("maple-house");
    expect(normalizeHouseholdUsername("Maple - House")).toBe("maple-house");
    expect(normalizeHouseholdUsername(" maple\t-\nHouse ")).toBe("maple-house");
    expect(normalizeHouseholdUsername("Maple___House")).toBe("maple-house");
  });

  it("parses household usernames to a safe normalized identity key", () => {
    expect(HouseholdUsernameSchema.parse(" Maple House_2026 ")).toBe(
      "maple-house-2026"
    );
    expect(HouseholdUsernameSchema.parse("MAPLE___HOUSE")).toBe("maple-house");
  });

  it("rejects unsafe normalized household usernames", () => {
    for (const username of [
      "   ",
      "---",
      "!!!",
      "ab",
      "maple@house",
      "maple/house",
      "a".repeat(41)
    ]) {
      expect(() => HouseholdUsernameSchema.parse(username)).toThrow();
    }
  });
});
