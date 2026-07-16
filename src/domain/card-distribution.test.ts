import { describe, expect, it } from "vitest";

import {
  CARD_BUCKET_LABELS,
  bucketForLane,
  bucketForPersona,
  labelForCardBucket,
  laneForBucket
} from "./card-distribution";

describe("card distribution domain contract", () => {
  it("maps product buckets to stable persisted lanes in both directions", () => {
    expect(bucketForLane("cards_of_concern")).toBe("unassigned");
    expect(bucketForLane("kid_split")).toBe("unassigned");
    expect(bucketForLane("player_1")).toBe("alex");
    expect(bucketForLane("player_2")).toBe("max");
    expect(bucketForLane("not_in_play")).toBe("savedForLater");
    expect(bucketForLane("trimmed")).toBe("notApplicable");

    expect(laneForBucket("unassigned")).toBe("cards_of_concern");
    expect(laneForBucket("alex")).toBe("player_1");
    expect(laneForBucket("max")).toBe("player_2");
    expect(laneForBucket("savedForLater")).toBe("not_in_play");
    expect(laneForBucket("notApplicable")).toBe("trimmed");
  });

  it("keeps persona and label helpers available without a UI dependency", () => {
    expect(bucketForPersona("alex")).toBe("alex");
    expect(bucketForPersona("max")).toBe("max");
    expect(labelForCardBucket("savedForLater")).toBe("Saved for Later");
    expect(CARD_BUCKET_LABELS.notApplicable).toBe("Not Applicable");
  });
});
