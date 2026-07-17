import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { ResponsibilityStatus } from "@/domain/enums";

const REVIEWABLE_STATUSES: ReadonlySet<ResponsibilityStatus> = new Set([
  "active",
  "needs_review"
]);

export type SelectResponsibilitiesWorthReviewingInput = {
  responsibilities: readonly ResponsibilitySummary[];
  asOf?: string | Date;
};

function asOfTime(value: string | Date | undefined): number {
  const resolved = value === undefined ? new Date() : new Date(value);
  const time = resolved.getTime();

  if (Number.isNaN(time)) {
    throw new RangeError("Responsibility review asOf must be a valid date.");
  }

  return time;
}

function reviewDateTime(responsibility: ResponsibilitySummary): number | null {
  if (!responsibility.nextReviewAt) {
    return null;
  }

  const time = new Date(responsibility.nextReviewAt).getTime();
  return Number.isNaN(time) ? null : time;
}

export function isResponsibilityWorthReviewingAt(
  responsibility: ResponsibilitySummary,
  asOf: number
): boolean {
  if (!REVIEWABLE_STATUSES.has(responsibility.status)) {
    return false;
  }

  if (responsibility.status === "needs_review") {
    return true;
  }

  const reviewAt = reviewDateTime(responsibility);
  return reviewAt !== null && reviewAt <= asOf;
}

/**
 * Returns a stable, non-scored reference list for the Check-ins surface.
 * Catalog-only, paused, not-applicable, and archived cards stay out of this
 * list even when they retain an old review date.
 */
export function selectResponsibilitiesWorthReviewing({
  responsibilities,
  asOf
}: SelectResponsibilitiesWorthReviewingInput): ResponsibilitySummary[] {
  const resolvedAsOf = asOfTime(asOf);

  return responsibilities
    .filter((responsibility) =>
      isResponsibilityWorthReviewingAt(responsibility, resolvedAsOf)
    )
    .sort((left, right) => {
      const leftTime = reviewDateTime(left) ?? Number.NEGATIVE_INFINITY;
      const rightTime = reviewDateTime(right) ?? Number.NEGATIVE_INFINITY;

      return (
        leftTime - rightTime ||
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id)
      );
    });
}
