import { describe, expect, it } from "vitest";

import { HouseholdWorkMapSchema } from "./household-work-map";

function validWorkMap() {
  return {
    personas: {
      alex: {
        owned: 3,
        sharedOwned: 1,
        highFrequency: 2,
        dueReview: 1,
        hiddenEffort: {
          noticing: 1,
          planning: 2,
          doing: 3,
          follow_through: 2,
          emotional_attention: 0
        }
      },
      max: {
        owned: 2,
        sharedOwned: 1,
        highFrequency: 1,
        dueReview: 0,
        hiddenEffort: {
          noticing: 1,
          planning: 0,
          doing: 2,
          follow_through: 1,
          emotional_attention: 1
        }
      }
    },
    household: {
      shared: 1,
      unassigned: 2,
      paused: 1,
      notApplicable: 1,
      dueReview: 1
    }
  };
}

describe("HouseholdWorkMapSchema", () => {
  it("accepts a complete descriptive work map", () => {
    expect(HouseholdWorkMapSchema.parse(validWorkMap())).toEqual(validWorkMap());
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5]
  ])("rejects %s counts", (_label, invalidCount) => {
    expect(() =>
      HouseholdWorkMapSchema.parse({
        ...validWorkMap(),
        household: {
          ...validWorkMap().household,
          shared: invalidCount
        }
      })
    ).toThrow();
  });

  it("requires every hidden-effort category", () => {
    const workMap = validWorkMap();
    const incompleteHiddenEffort = {
      noticing: 1,
      planning: 2,
      doing: 3,
      follow_through: 2
    };

    expect(() =>
      HouseholdWorkMapSchema.parse({
        ...workMap,
        personas: {
          ...workMap.personas,
          alex: {
            ...workMap.personas.alex,
            hiddenEffort: incompleteHiddenEffort
          }
        }
      })
    ).toThrow();
  });

  it("rejects scoring, ranking, and recommendation fields", () => {
    expect(() =>
      HouseholdWorkMapSchema.parse({
        ...validWorkMap(),
        score: 83
      })
    ).toThrow();

    expect(() =>
      HouseholdWorkMapSchema.parse({
        ...validWorkMap(),
        personas: {
          ...validWorkMap().personas,
          alex: {
            ...validWorkMap().personas.alex,
            rank: 1
          }
        }
      })
    ).toThrow();

    expect(() =>
      HouseholdWorkMapSchema.parse({
        ...validWorkMap(),
        household: {
          ...validWorkMap().household,
          recommendedOwner: "alex"
        }
      })
    ).toThrow();
  });
});
