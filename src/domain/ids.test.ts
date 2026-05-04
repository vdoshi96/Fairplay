import { describe, expect, it } from "vitest";

import { normalizeHouseholdUsername } from "./ids";

describe("domain id and username helpers", () => {
  it("normalizes household usernames by trimming, lowercasing, and collapsing whitespace or hyphens", () => {
    expect(normalizeHouseholdUsername("  Maple   House  ")).toBe("maple-house");
    expect(normalizeHouseholdUsername("MAPLE---HOUSE")).toBe("maple-house");
    expect(normalizeHouseholdUsername("Maple - House")).toBe("maple-house");
    expect(normalizeHouseholdUsername(" maple\t-\nHouse ")).toBe("maple-house");
  });
});
