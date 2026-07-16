import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HouseholdWorkMap } from "@/contracts/household-work-map";
import { HouseholdWorkMapSummary } from "./household-work-map-summary";

const workMap: HouseholdWorkMap = {
  personas: {
    alex: {
      owned: 4,
      sharedOwned: 1,
      highFrequency: 3,
      dueReview: 1,
      hiddenEffort: {
        noticing: 2,
        planning: 1,
        doing: 0,
        follow_through: 0,
        emotional_attention: 0
      }
    },
    max: {
      owned: 3,
      sharedOwned: 1,
      highFrequency: 2,
      dueReview: 0,
      hiddenEffort: {
        noticing: 0,
        planning: 0,
        doing: 2,
        follow_through: 1,
        emotional_attention: 0
      }
    }
  },
  household: {
    shared: 1,
    unassigned: 2,
    paused: 3,
    notApplicable: 4,
    dueReview: 1
  }
};

describe("HouseholdWorkMapSummary", () => {
  it("renders descriptive persona and household context on Board", () => {
    render(<HouseholdWorkMapSummary variant="board" workMap={workMap} />);

    const summary = screen.getByTestId("board-work-map");
    expect(
      within(summary).getByRole("heading", { name: "Household work map" })
    ).toBeVisible();
    expect(
      within(summary).getByText(
        "Active and needs-review responsibilities only. Counts describe responsibilities, not people."
      )
    ).toBeVisible();

    const alex = within(summary).getByRole("region", {
      name: "Alex responsibility summary"
    });
    expect(within(alex).getByText("Owned").parentElement).toHaveTextContent("4");
    expect(within(alex).getByText("Shared-owned").parentElement)
      .toHaveTextContent("1");
    expect(within(alex).getByText("Noticing 2")).toBeVisible();
    expect(within(alex).getByText("Planning 1")).toBeVisible();

    const household = within(summary).getByRole("region", {
      name: "Household responsibility summary"
    });
    expect(within(household).getByText("No owner").parentElement)
      .toHaveTextContent("2");
    expect(within(household).getByText("Paused").parentElement)
      .toHaveTextContent("3");
    expect(within(household).getByText("Not applicable").parentElement)
      .toHaveTextContent("4");
  });

  it("keeps the Deal reference collapsed until requested", () => {
    render(<HouseholdWorkMapSummary variant="deal" workMap={workMap} />);

    const details = screen.getByTestId("deal-work-map");
    const summary = within(details).getByText("Household work in view").closest(
      "summary"
    );

    expect(details).not.toHaveAttribute("open");
    expect(summary).not.toBeNull();

    fireEvent.click(summary!);

    expect(details).toHaveAttribute("open");
    expect(
      within(details).queryByText(/score|rank|winner|loser/i)
    ).not.toBeInTheDocument();
  });
});
