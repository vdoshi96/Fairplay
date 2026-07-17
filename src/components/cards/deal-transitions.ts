import type { CSSProperties } from "react";

import type { CardDistributionBucket } from "./card-state";

export type DealActionBucket = Exclude<CardDistributionBucket, "unassigned">;

export type DealExitState = {
  bucket: DealActionBucket;
  exiting: boolean;
};

export const DEAL_EXIT_DURATION_MS = 200;

const TOUCH_SCROLL_DISTANCE_PX = 12;
const TOUCH_DRAG_LOCK_DISTANCE_PX = 18;
const HORIZONTAL_SWIPE_DISTANCE_PX = 112;
const VERTICAL_SWIPE_DISTANCE_PX = 176;
const HORIZONTAL_DOMINANCE_RATIO = 1.25;
const VERTICAL_DOMINANCE_RATIO = 1.45;

export function bucketFromOffset(
  offsetX: number,
  offsetY: number
): DealActionBucket | null {
  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    return null;
  }

  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  if (
    absX >= HORIZONTAL_SWIPE_DISTANCE_PX &&
    absX > absY * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return offsetX < 0 ? "alex" : "max";
  }

  if (
    absY >= VERTICAL_SWIPE_DISTANCE_PX &&
    absY > absX * VERTICAL_DOMINANCE_RATIO
  ) {
    return offsetY < 0 ? "savedForLater" : "notApplicable";
  }

  return null;
}

export function touchDealIntent(offsetX: number, offsetY: number) {
  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  if (
    absY >= VERTICAL_SWIPE_DISTANCE_PX &&
    absY > absX * VERTICAL_DOMINANCE_RATIO
  ) {
    return "drag" as const;
  }

  if (
    absY >= TOUCH_SCROLL_DISTANCE_PX &&
    absY > absX * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return "scroll" as const;
  }

  if (
    absX >= TOUCH_DRAG_LOCK_DISTANCE_PX &&
    absX > absY * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return "drag" as const;
  }

  return "pending" as const;
}

export function styleForDrag(
  offset: { x: number; y: number } | null
): CSSProperties {
  if (!offset) {
    return {};
  }

  const rotate = Math.max(-12, Math.min(12, offset.x / 18));

  return {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotate}deg)`
  };
}

export function styleForDealExit(outgoing: DealExitState): CSSProperties {
  return {
    opacity: outgoing.exiting ? 0 : 1,
    transform: outgoing.exiting
      ? dealExitTransform(outgoing.bucket)
      : "translate3d(0, 0, 0)",
    transition: `transform ${DEAL_EXIT_DURATION_MS}ms ease-out, opacity ${DEAL_EXIT_DURATION_MS}ms ease-out`
  };
}

export function dealExitTransform(bucket: DealActionBucket) {
  switch (bucket) {
    case "alex":
      return "translate3d(-115%, 0, 0) rotate(-8deg)";
    case "max":
      return "translate3d(115%, 0, 0) rotate(8deg)";
    case "savedForLater":
      return "translate3d(0, -115%, 0)";
    case "notApplicable":
      return "translate3d(0, 115%, 0)";
  }
}
