import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import { CardCoverImage } from "./card-cover-image";

function card(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "School lunch",
    areaKeys: ["kids", "food"],
    hiddenEffortKeys: ["noticing", "planning"],
    cadence: "daily",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    templateId: null,
    sourceCoverAssetPath: "/api/ai-card-drafts/draft-1/cover",
    sourceDefinition: null,
    sourceMinimumStandard: null,
    ...overrides
  };
}

describe("CardCoverImage", () => {
  it("keeps authenticated generated covers on their direct API URL", () => {
    render(<CardCoverImage card={card()} />);

    const image = screen.getByRole("img", { name: "School lunch cover" });
    expect(image).toHaveAttribute("src", "/api/ai-card-drafts/draft-1/cover");
    expect(image).not.toHaveAttribute("srcset");
  });
});
