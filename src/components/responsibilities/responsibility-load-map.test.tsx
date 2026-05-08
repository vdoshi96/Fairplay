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

    expect(screen.getByTestId("load-map-hero-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png')"
    });
    expect(screen.getByTestId("load-map-hero-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("load-map-hero-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png')"
    });
    expect(screen.getByTestId("load-map-empty-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png')"
    });
    expect(screen.getByTestId("load-map-empty-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("load-map-empty-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png')"
    });
    expect(screen.getByText("No responsibilities mapped yet.")).toBeVisible();
    expect(screen.queryByTestId("load-map-practice-board")).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-guide-id="load-map-move-target"]')
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add responsibility" })).toHaveAttribute(
      "href",
      "/app/responsibilities/new"
    );
  });

  it("filters by owner, status, cadence, area, effort, and review timing", () => {
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
            nextReviewAt: "2026-06-01T00:00:00.000Z"
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
    fireEvent.change(screen.getByLabelText("Effort"), {
      target: { value: "doing" }
    });
    fireEvent.change(screen.getByLabelText("Review"), {
      target: { value: "upcoming" }
    });

    expect(screen.getByText("Shared space reset")).toBeVisible();
    expect(screen.queryByText("Weekly meal outline")).not.toBeInTheDocument();
  });

  it("keeps filters in one compact focus section", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility()]}
      />
    );

    const filters = screen.getByRole("group", { name: "Filters" });

    expect(screen.getByRole("heading", { name: "Focus" })).toBeVisible();
    expect(screen.getByText("All cards shown.")).toBeVisible();
    expect(filters).toContainElement(screen.getByLabelText("Owner"));
    expect(filters).toContainElement(screen.getByLabelText("Status"));
    expect(filters).toContainElement(screen.getByLabelText("Cadence"));
    expect(filters).toContainElement(screen.getByLabelText("Area"));
    expect(filters).toContainElement(screen.getByLabelText("Effort"));
    expect(filters).toContainElement(screen.getByLabelText("Review"));
    expect(screen.getByTestId("load-map-filters")).toHaveClass(
      "bg-[var(--fp-surface-strong)]"
    );
    const diagnostics = within(screen.getByTestId("load-map-diagnostics"));

    expect(diagnostics.getByText("Owners")).toBeVisible();
    expect(diagnostics.getByText("Due")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Owner"), {
      target: { value: "alex" }
    });

    expect(screen.getByText("1 filter on.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("All cards shown.")).toBeVisible();
    expect(screen.getByLabelText("Owner")).toHaveDisplayValue("All");
  });

  it("keeps the page shell unclipped while exposing an intentional lane scroller", async () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility()]}
      />
    );

    expect(screen.getByTestId("load-map-dashboard-shell").className)
      .not.toContain("overflow-x-clip");
    expect(screen.getByTestId("load-map-dashboard-shell")).toHaveClass(
      "max-w-full"
    );
    expect(screen.getByTestId("load-map-dashboard")).toContainElement(
      screen.getByTestId("load-map-hero-background")
    );
    expect(
      document.querySelector('[data-guide-id="load-map-filters"]')
    ).toHaveClass("min-w-0");

    const scroller = screen.getByTestId("load-map-board-scroller");
    const scrollBy = vi.fn();
    Object.defineProperty(scroller, "scrollBy", {
      configurable: true,
      value: scrollBy
    });

    expect(scroller).toHaveAttribute("aria-label", "Responsibility lanes");
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(scroller).toHaveClass(
      "max-w-full",
      "overflow-x-auto",
      "overscroll-x-contain",
      "touch-pan-x"
    );
    expect(screen.getByTestId("load-map-lane-strip")).toHaveClass(
      "w-max",
      "min-w-full"
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Scroll lanes right" })
    );

    expect(scrollBy).toHaveBeenCalledWith({ left: 320 });

    await userEvent.click(
      screen.getByRole("button", { name: "Scroll lanes left" })
    );

    expect(scrollBy).toHaveBeenCalledWith({ left: -320 });
  });

  it("wraps diagnostic values inside compact signal tiles", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility()]}
      />
    );

    expect(screen.getByTestId("load-map-signal-owner")).toHaveClass("min-w-0");
    expect(screen.getByTestId("load-map-signal-owner-value")).toHaveClass(
      "break-words"
    );
    expect(screen.getByTestId("load-map-signal-reserve-value")).toHaveClass(
      "[overflow-wrap:anywhere]"
    );
  });

  it("keeps area and effort as compact filter fields", () => {
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        responsibilities={[responsibility()]}
      />
    );

    expect(screen.getByLabelText("Area")).toHaveDisplayValue("All");
    expect(screen.getByRole("option", { name: "Food Flow" })).toBeVisible();
    expect(screen.getByLabelText("Effort")).toHaveDisplayValue("All");
    expect(screen.getByRole("option", { name: "Planning" })).toBeVisible();
  });

  it("renders Trello board lanes with counts and Alex/Max explanations", () => {
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

    const reserveLane = screen.getByRole("region", { name: "Saved for Later" });
    const concernLane = screen.getAllByRole("region", { name: "Unassigned" })[0];
    const alexLane = screen.getByRole("region", { name: "Alex" });

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
      within(reserveLane).getByRole("heading", { name: "Saved for Later" })
    ).toBeVisible();
    expect(within(reserveLane).getByText("1 card")).toBeVisible();
    expect(
      within(reserveLane).getByText("Useful, but not ready to assign.")
    ).toBeVisible();
    expect(within(concernLane).getByText("1 card")).toBeVisible();
    expect(within(alexLane).getByText("1 card")).toBeVisible();
    expect(within(alexLane).getByText(/owned by Alex/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Max" })).toBeVisible();
    expect(screen.getByText(/owned by Max/i)).toBeVisible();
    expect(screen.queryByText(/Player 1|Player 2/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Unassigned" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Not Applicable" })).toBeVisible();
  });

  it("keeps dummy move targets hidden when filters hide every real card", () => {
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
    expect(screen.queryByTestId("load-map-practice-board")).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-guide-id="load-map-move-target"]'))
      .toHaveLength(0);
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
    await userEvent.click(screen.getByRole("menuitem", { name: "Alex" }));

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

    expect(screen.getByRole("dialog", { name: "Board guide" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Next required click: Start dummy Board workflow.")
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Start dummy Board workflow" })
    );
    expect(screen.getByTestId("load-map-practice-board")).toBeVisible();
    expect(screen.getByTestId("load-map-practice-board")).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(screen.getByTestId("load-map-practice-board").className).not.toContain(
      "bg-white"
    );
    expect(
      screen.getByText("Next required click: Open dummy move menu.")
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Open dummy move menu" }));
    expect(screen.getByText("Next required click: Alex.")).toBeVisible();
    await userEvent.click(screen.getByRole("menuitem", { name: "Alex" }));
    expect(screen.getByText("Dummy lunch plan is in Alex.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Next required click: Save dummy card edit.")
    ).toBeVisible();

    await userEvent.clear(screen.getByLabelText("Dummy card title"));
    await userEvent.type(screen.getByLabelText("Dummy card title"), "Lunch handoff");
    await userEvent.click(screen.getByRole("button", { name: "Save dummy card edit" }));
    expect(screen.getByText("Lunch handoff is in Alex.")).toBeVisible();
    expect(
      screen.getByText("Next required click: Trim dummy duplicate.")
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Trim dummy duplicate" }));
    expect(
      screen.getByText("Next required click: Delete dummy duplicate.")
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Delete dummy duplicate" }));

    expect(screen.getByText("Dummy card moved, edited, trimmed, and deleted."))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it.each([
    ["Skip", "button" as const],
    ["Escape", "key" as const]
  ])("removes the dummy setup workflow on guide %s", async (_label, exitType) => {
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
      screen.getByRole("button", { name: "Start dummy Board workflow" })
    );

    expect(screen.getByTestId("load-map-practice-board")).toBeVisible();

    if (exitType === "button") {
      await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    } else {
      fireEvent.keyDown(document, { key: "Escape" });
    }

    expect(screen.queryByTestId("load-map-practice-board")).not.toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("keeps an open real move menu usable after guide practice cleanup", async () => {
    const onMove = vi.fn();
    render(
      <ResponsibilityLoadMap
        loadSnapshot={loadSnapshot}
        onMove={onMove}
        responsibilities={[
          responsibility({
            id: "550e8400-e29b-41d4-a716-446655440041",
            title: "Auto",
            boardLane: "not_in_play"
          })
        ]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Move Auto" }));
    expect(screen.getByRole("menuitem", { name: "Alex" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Start dummy Board workflow" })
    );
    expect(screen.getByTestId("load-map-practice-board")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.queryByTestId("load-map-practice-board")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Alex" })).toBeVisible();

    await userEvent.click(screen.getByRole("menuitem", { name: "Alex" }));

    expect(onMove).toHaveBeenCalledWith({
      responsibilityId: "550e8400-e29b-41d4-a716-446655440041",
      toLane: "player_1"
    });
  });

  it("removes the dummy setup workflow after guide completion", async () => {
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
      screen.getByRole("button", { name: "Start dummy Board workflow" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Open dummy move menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Alex" }));
    await userEvent.click(screen.getByRole("button", { name: "Save dummy card edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete dummy duplicate" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByTestId("load-map-practice-board")).not.toBeInTheDocument();
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
      screen.getByRole("button", { name: "Start dummy Board workflow" })
    );

    await userEvent.click(screen.getByRole("button", { name: "Open dummy move menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Alex" }));
    await userEvent.click(screen.getByRole("button", { name: "Save dummy card edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete dummy duplicate" }));

    expect(screen.getByText("Dummy card moved, edited, trimmed, and deleted."))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(onMove).not.toHaveBeenCalled();
  });
});
