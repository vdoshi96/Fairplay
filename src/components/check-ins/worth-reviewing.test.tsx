import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorthReviewing } from "./worth-reviewing";

const dueResponsibility = {
  id: "550e8400-e29b-41d4-a716-446655440011",
  title: "Dishes",
  status: "active",
  nextReviewAt: "2026-07-10T00:00:00.000Z",
  hiddenEffortKeys: ["noticing", "planning", "planning"]
} as const;

describe("WorthReviewing", () => {
  it("renders due cards as a responsive, read-only list with agreement links", () => {
    render(
      <WorthReviewing
        responsibilities={[
          dueResponsibility,
          {
            id: "550e8400-e29b-41d4-a716-446655440012",
            title: "Laundry",
            status: "needs_review",
            nextReviewAt: null,
            hiddenEffortKeys: ["doing", "follow_through"]
          }
        ]}
      />
    );

    const section = screen.getByRole("region", { name: "Worth reviewing" });
    const cards = within(section).getAllByRole("listitem");
    const cardList = within(section).getAllByRole("list")[0];

    expect(cardList).toHaveClass("sm:grid-cols-2");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(within(section).getByText(/Review due/)).toBeVisible();
    expect(within(section).getByText("Marked for review")).toBeVisible();
    expect(within(section).getByRole("list", { name: "Dishes hidden effort" }))
      .toHaveTextContent("NoticingPlanning");
    expect(within(section).getAllByText("Planning")).toHaveLength(1);

    const agreementLink = within(section).getByRole("link", {
      name: "View or update agreement for Dishes"
    });
    expect(agreementLink).toHaveAttribute(
      "href",
      `/app/responsibilities/${dueResponsibility.id}`
    );
    expect(agreementLink).toHaveClass("min-h-11");

    const scheduleLink = within(section).getByRole("link", {
      name: "Schedule the next check-in"
    });
    expect(scheduleLink).toHaveAttribute("href", "#schedule-check-in");
    expect(scheduleLink).toHaveClass("min-h-11");
    expect(within(section).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(section).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a calm empty state without the optional schedule action", () => {
    render(<WorthReviewing responsibilities={[]} />);

    expect(screen.getByText(/Nothing needs review right now/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Schedule the next check-in" }))
      .not.toBeInTheDocument();
  });

  it("can hide the next-check-in action after a check-in is scheduled", () => {
    render(
      <WorthReviewing
        responsibilities={[dueResponsibility]}
        showNextCheckInAction={false}
      />
    );

    expect(screen.queryByRole("link", { name: "Schedule the next check-in" }))
      .not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View or update agreement for Dishes" })
    ).toBeVisible();
  });
});
