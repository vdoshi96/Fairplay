import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type {
  LoadSnapshotSummary,
  ResponsibilitySummary
} from "@/contracts/responsibilities";
import { ResponsibilityLoadMap } from "./responsibility-load-map";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

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
    expect(screen.getByTestId("load-map-practice-board")).toHaveAttribute(
      "data-guide-id",
      "load-map-board"
    );
    expect(
      document.querySelector('[data-guide-id="load-map-move-target"]')
    ).toBeInTheDocument();
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

  it("renders Trello board lanes with counts and explanations", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[
          responsibility({ title: "Auto", boardLane: "not_in_play" }),
          responsibility({
            id: "550e8400-e29b-41d4-a716-446655440011",
            title: "Weekly meal outline",
            boardLane: "cards_of_concern"
          }),
          responsibility({
            id: "550e8400-e29b-41d4-a716-446655440012",
            title: "Laundry",
            boardLane: "player_1"
          })
        ]}
      />
    );

    const reserveLane = screen.getByRole("region", { name: "Not in Play" });
    const concernLane = screen.getByRole("region", { name: "Cards of Concern" });
    const playerOneLane = screen.getByRole("region", { name: "Player 1" });

    expect(
      screen.getByRole("button", { name: "Learn this feature" })
    ).toBeVisible();
    expect(screen.getByTestId("load-map-board")).toHaveAttribute(
      "data-guide-id",
      "load-map-board"
    );
    expect(screen.getByTestId("load-map-board")).toContainElement(
      document.querySelector('[data-guide-id="load-map-lanes"]')
    );
    expect(
      document.querySelector('[data-guide-id="load-map-filters"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-guide-id="load-map-move-target"]')
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[data-guide-id="load-map-move-target"]'))
      .toHaveLength(1);
    expect(
      within(reserveLane).getByRole("heading", { name: "Not in Play" })
    ).toBeVisible();
    expect(within(reserveLane).getByText("1 card")).toBeVisible();
    expect(within(reserveLane).getByText(/reserve cards/i)).toBeVisible();
    expect(within(concernLane).getByText("1 card")).toBeVisible();
    expect(within(playerOneLane).getByText("1 card")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Player 2" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Kid Split" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Trimmed" })).toBeVisible();
  });

  it("keeps a dummy move target when filters hide every real card", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility({ title: "Auto", boardLane: "not_in_play" })]}
      />
    );

    fireEvent.change(screen.getByLabelText("Search responsibilities"), {
      target: { value: "missing card" }
    });

    expect(screen.getByText("No responsibilities match these filters.")).toBeVisible();
    expect(screen.getByTestId("load-map-practice-board")).toHaveAttribute(
      "data-guide-id",
      "load-map-board"
    );
    expect(document.querySelectorAll('[data-guide-id="load-map-move-target"]'))
      .toHaveLength(1);
  });

  it("moves a card through the keyboard action menu", async () => {
    const onMove = vi.fn();

    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        onMove={onMove}
        responsibilities={[
          responsibility({
            id: "550e8400-e29b-41d4-a716-446655440040",
            title: "Auto",
            boardLane: "not_in_play"
          })
        ]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Move Auto" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Player 1" }));

    expect(onMove).toHaveBeenCalledWith({
      responsibilityId: "550e8400-e29b-41d4-a716-446655440040",
      toLane: "player_1"
    });
  });

  it("walks through a local dummy setup workflow without moving real responsibilities", async () => {
    const onMove = vi.fn();
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        onMove={onMove}
        responsibilities={[responsibility({ title: "Auto", boardLane: "not_in_play" })]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));

    expect(screen.getByRole("dialog", { name: "Load Map guide" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await userEvent.click(
      screen.getByRole("button", { name: "Start dummy Load Map workflow" })
    );
    expect(screen.getByTestId("load-map-practice-board")).toBeVisible();
    expect(screen.getByTestId("load-map-practice-board")).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(screen.getByTestId("load-map-practice-board").className).not.toContain(
      "bg-white"
    );

    await userEvent.click(screen.getByRole("button", { name: "Open dummy move menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Player 1" }));
    expect(screen.getByText("Dummy lunch plan is in Player 1.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText("Dummy card title"));
    await userEvent.type(screen.getByLabelText("Dummy card title"), "Lunch handoff");
    await userEvent.click(screen.getByRole("button", { name: "Save dummy card edit" }));
    expect(screen.getByText("Lunch handoff is in Player 1.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Trim dummy duplicate" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete dummy duplicate" }));

    expect(screen.getByText("Dummy card moved, edited, trimmed, and deleted."))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("completes dummy trim credit when deleting a duplicate before trimming", async () => {
    const onMove = vi.fn();
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        onMove={onMove}
        responsibilities={[responsibility({ title: "Auto", boardLane: "not_in_play" })]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Start dummy Load Map workflow" })
    );

    await userEvent.click(screen.getByRole("button", { name: "Open dummy move menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Player 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Save dummy card edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete dummy duplicate" }));

    expect(screen.getByText("Dummy card moved, edited, trimmed, and deleted."))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(onMove).not.toHaveBeenCalled();
  });
});
