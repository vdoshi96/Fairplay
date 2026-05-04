import { describe, expect, it } from "vitest";

import { assertVisibilityTransition } from "./visibility";

describe("visibility transitions", () => {
  it("allows private drafts to remain private without confirmation", () => {
    expect(
      assertVisibilityTransition({
        from: "private",
        to: "private"
      })
    ).toEqual({ from: "private", to: "private", confirmed: false });
  });

  it("rejects publishing private drafts without explicit confirmation", () => {
    expect(() =>
      assertVisibilityTransition({
        from: "private",
        to: "shared_household"
      })
    ).toThrow(/confirmation/);

    expect(() =>
      assertVisibilityTransition({
        from: "private",
        to: "partner_visible",
        confirmed: false
      })
    ).toThrow(/confirmation/);

    expect(() =>
      assertVisibilityTransition({
        from: "private",
        to: "check_in_only"
      })
    ).toThrow(/confirmation/);
  });

  it("allows confirmed private draft publishing", () => {
    expect(
      assertVisibilityTransition({
        from: "private",
        to: "check_in_only",
        confirmed: true
      })
    ).toEqual({ from: "private", to: "check_in_only", confirmed: true });
  });
});
