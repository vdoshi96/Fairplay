import { describe, expect, it } from "vitest";

import {
  DEAL_EXIT_DURATION_MS,
  bucketFromOffset,
  dealExitTransform,
  styleForDealExit,
  styleForDrag,
  touchDealIntent
} from "./deal-transitions";

describe("Deal transition helpers", () => {
  it("maps deliberate dominant gestures to Deal buckets", () => {
    expect(bucketFromOffset(-120, 10)).toBe("alex");
    expect(bucketFromOffset(120, 10)).toBe("max");
    expect(bucketFromOffset(10, -180)).toBe("savedForLater");
    expect(bucketFromOffset(10, 180)).toBe("notApplicable");
    expect(bucketFromOffset(80, 80)).toBeNull();
    expect(bucketFromOffset(Number.NaN, 0)).toBeNull();
  });

  it("keeps normal vertical touch movement available for page scrolling", () => {
    expect(touchDealIntent(2, 24)).toBe("scroll");
    expect(touchDealIntent(20, 2)).toBe("drag");
    expect(touchDealIntent(2, 180)).toBe("drag");
    expect(touchDealIntent(4, 4)).toBe("pending");
  });

  it("produces bounded drag and directional exit styles", () => {
    expect(styleForDrag(null)).toEqual({});
    expect(styleForDrag({ x: 360, y: 20 })).toEqual({
      transform: "translate3d(360px, 20px, 0) rotate(12deg)"
    });
    expect(dealExitTransform("alex")).toContain("-115%");
    expect(dealExitTransform("max")).toContain("115%");
    expect(styleForDealExit({ bucket: "savedForLater", exiting: true })).toEqual({
      opacity: 0,
      transform: "translate3d(0, -115%, 0)",
      transition: `transform ${DEAL_EXIT_DURATION_MS}ms ease-out, opacity ${DEAL_EXIT_DURATION_MS}ms ease-out`
    });
  });
});
