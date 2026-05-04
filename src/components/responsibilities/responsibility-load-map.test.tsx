import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  LoadSnapshotSummary,
  ResponsibilitySummary
} from "@/contracts/responsibilities";
import { ResponsibilityLoadMap } from "./responsibility-load-map";

function responsibility(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    title: "Weekly meal outline",
    areaKeys: ["food_flow"],
    hiddenEffortKeys: ["planning"],
    cadence: "weekly",
    relevantDays: ["monday"],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    linkedRadarItems: [],
    currentAssignments: [
      { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
    ],
    nextReviewAt: "2026-05-01T00:00:00.000Z",
    ...overrides
  };
}

const loadSnapshot: LoadSnapshotSummary = {
  periodStart: "2026-05-04T12:00:00.000Z",
  periodEnd: "2026-05-04T12:00:00.000Z",
  computedAt: "2026-05-04T12:00:00.000Z",
  ownerDistribution: { alex: 1, max: 1, unassigned: 0 },
  sharedDistribution: { shared: 1, solo: 1 },
  areaDistribution: { food_flow: 1, home_base: 1 },
  cadenceDistribution: { weekly: 1, monthly: 1 },
  reviewDueCount: 1,
  radarOpenCount: 1,
  pausedOrNotRelevantCount: 1,
  hiddenEffortMix: { planning: 1, doing: 1 }
};

describe("ResponsibilityLoadMap", () => {
  it("renders an empty state with a create link", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[]}
      />
    );

    expect(screen.getByText("No responsibilities mapped yet.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Add responsibility" })).toHaveAttribute(
      "href",
      "/app/responsibilities/new"
    );
  });

  it("filters by owner, status, cadence, area, hidden effort, radar flag, and review timing", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[
          responsibility(),
          responsibility({
            id: "550e8400-e29b-41d4-a716-446655440020",
            title: "Shared space reset",
            areaKeys: ["home_base"],
            hiddenEffortKeys: ["doing"],
            cadence: "monthly",
            status: "paused",
            currentAssignments: [
              { personaKey: "max", role: "shared_owner", scope: "part" }
            ],
            nextReviewAt: "2026-06-01T00:00:00.000Z",
            linkedRadarItems: [
              {
                id: "550e8400-e29b-41d4-a716-446655440030",
                state: "open"
              }
            ]
          })
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "max" } });
    expect(screen.getByText("Shared space reset")).toBeVisible();
    expect(screen.queryByText("Weekly meal outline")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "paused" }
    });
    fireEvent.change(screen.getByLabelText("Cadence"), {
      target: { value: "monthly" }
    });
    fireEvent.change(screen.getByLabelText("Area"), {
      target: { value: "home_base" }
    });
    fireEvent.change(screen.getByLabelText("Hidden effort"), {
      target: { value: "doing" }
    });
    fireEvent.change(screen.getByLabelText("Radar"), {
      target: { value: "flagged" }
    });
    fireEvent.change(screen.getByLabelText("Review timing"), {
      target: { value: "upcoming" }
    });

    expect(screen.getByText("Shared space reset")).toBeVisible();
    expect(screen.queryByText("Weekly meal outline")).not.toBeInTheDocument();
  });

  it("treats resolved linked radar items as clear", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[
          responsibility({
            linkedRadarItems: [
              {
                id: "550e8400-e29b-41d4-a716-446655440031",
                state: "resolved"
              }
            ]
          })
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Radar"), {
      target: { value: "clear" }
    });

    expect(screen.getByText("Weekly meal outline")).toBeVisible();
  });

  it("shows area and hidden effort summary signals from the snapshot", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility()]}
      />
    );

    expect(screen.getByText("Area mix")).toBeVisible();
    expect(screen.getByText("Food Flow 1 / Home Base 1")).toBeVisible();
    expect(screen.getByText("Hidden effort mix")).toBeVisible();
    expect(screen.getByText("Planning 1 / Doing 1")).toBeVisible();
  });
});
