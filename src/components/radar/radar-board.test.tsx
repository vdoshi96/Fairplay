import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RadarSummary } from "@/contracts/radar";
import { RadarBoard } from "./radar-board";

function item(overrides: Partial<RadarSummary> = {}): RadarSummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    topic: "Clarify morning handoff",
    responsibilityId: null,
    reasonKey: "unclear_expectation",
    urgency: "normal",
    visibility: "private",
    state: "draft",
    ...overrides
  };
}

describe("RadarBoard", () => {
  it("shows visibility labels on every item and groups private, open, check-in, deferred, and resolved items", () => {
    render(
      <RadarBoard
        items={[
          item(),
          item({
            id: "550e8400-e29b-41d4-a716-446655440011",
            topic: "Shared calendar snag",
            reasonKey: "blocked",
            visibility: "shared_household",
            state: "open"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440012",
            topic: "Choose check-in agenda",
            reasonKey: "review_due",
            visibility: "check_in_only",
            state: "scheduled"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440013",
            topic: "Return after travel week",
            reasonKey: "too_much",
            visibility: "partner_visible",
            state: "deferred"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440014",
            topic: "Settled pickup plan",
            reasonKey: "handoff_needed",
            visibility: "shared_household",
            state: "resolved"
          })
        ]}
      />
    );

    expect(
      within(screen.getByRole("region", { name: "Private drafts" })).getByText(
        "Private draft"
      )
    ).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Shared and open" })).getByText(
        "Shared household"
      )
    ).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Check-in topics" })).getByText(
        "Check-in only"
      )
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Show deferred" }));
    expect(screen.getByText("Return after travel week")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Show resolved" }));
    expect(screen.getByText("Settled pickup plan")).toBeVisible();
  });

  it("names the new visibility before publishing a private draft", () => {
    const onPublish = vi.fn();
    render(<RadarBoard items={[item()]} onPublish={onPublish} />);

    fireEvent.change(screen.getByLabelText("Publish visibility"), {
      target: { value: "check_in_only" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    const dialog = screen.getByRole("dialog", {
      name: "Publish to Check-in only?"
    });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByText(/make this visible as Check-in only/i)
    ).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm publish" }));

    expect(onPublish).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440010",
      "private",
      "check_in_only",
      true
    );
  });
});
