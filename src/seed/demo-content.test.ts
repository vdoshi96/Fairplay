import { describe, expect, it } from "vitest";

import {
  APPROVED_DEMO_AREA_KEYS,
  APPROVED_DEMO_EXAMPLE_TITLES,
  DEMO_RESPONSIBILITY_TEMPLATES
} from "./demo-content";

describe("reviewed demo content", () => {
  it("contains exactly the approved tiny area and example set", () => {
    expect(APPROVED_DEMO_AREA_KEYS).toEqual([
      "home_base",
      "food_flow",
      "calendar_lane",
      "care_circle",
      "paper_trail",
      "fix_and_fetch",
      "recharge",
      "big_shifts"
    ]);
    expect(APPROVED_DEMO_EXAMPLE_TITLES).toEqual([
      "Evening kitchen reset",
      "Weekly meal outline",
      "Appointment follow-through",
      "Laundry rhythm",
      "Supply restock",
      "Weekend plan check",
      "Shared space reset",
      "Bill due-date review"
    ]);
    expect(DEMO_RESPONSIBILITY_TEMPLATES).toHaveLength(8);
    expect(DEMO_RESPONSIBILITY_TEMPLATES.map((template) => template.title)).toEqual(
      APPROVED_DEMO_EXAMPLE_TITLES
    );
  });

  it("marks every template as approved original with a content version", () => {
    expect(
      DEMO_RESPONSIBILITY_TEMPLATES.every(
        (template) =>
          template.sourceReviewStatus === "approved_original" &&
          typeof template.contentVersion === "string" &&
          template.contentVersion.length > 0
      )
    ).toBe(true);
  });
});
