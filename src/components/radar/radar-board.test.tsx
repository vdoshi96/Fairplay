import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    desiredTiming: null,
    deferredUntil: null,
    ...overrides
  };
}

describe("RadarBoard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("adds a created item to the visible production board after the fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...item(),
          id: "550e8400-e29b-41d4-a716-446655440099",
          topic: "New timing concern",
          desiredTiming: "Before Friday",
          deferredUntil: null,
          notes: null,
          targetCheckInId: null,
          createdAt: "2026-05-04T12:00:00.000Z",
          updatedAt: "2026-05-04T12:00:00.000Z",
          resolvedAt: null
        })
      })
    );
    render(<RadarBoard items={[]} />);

    fireEvent.change(screen.getByLabelText("Topic"), {
      target: { value: "New timing concern" }
    });
    fireEvent.change(screen.getByLabelText("Desired timing"), {
      target: { value: "Before Friday" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create radar item" }));

    await waitFor(() => {
      expect(
        within(screen.getByRole("region", { name: "Private drafts" })).getByText(
          "New timing concern"
        )
      ).toBeVisible();
    });
    expect(screen.getByText("Timing: Before Friday")).toBeVisible();
  });

  it.each([
    ["publish", "Check-in topics", "Confirm publish"],
    ["schedule", "Check-in topics", "Schedule"],
    ["defer", "Deferred", "Defer"],
    ["resolve", "Resolved", "Resolve"],
    ["dismiss", "Dismissed", "Dismiss"]
  ])(
    "moves an item on the visible production board after %s succeeds",
    async (action, expectedSection, buttonName) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            ...item({
              visibility: action === "publish" ? "check_in_only" : "shared_household",
              state:
                action === "publish"
                  ? "open"
                  : action === "schedule"
                    ? "scheduled"
                    : action === "defer"
                      ? "deferred"
                      : action === "resolve"
                        ? "resolved"
                        : "dismissed"
            }),
            desiredTiming: "This week",
            deferredUntil:
              action === "defer" ? "2026-05-11T12:00:00.000Z" : null,
            notes: null,
            targetCheckInId: null,
            createdAt: "2026-05-04T12:00:00.000Z",
            updatedAt: "2026-05-04T12:00:00.000Z",
            resolvedAt:
              action === "resolve" ? "2026-05-04T13:00:00.000Z" : null
          })
        })
      );
      render(
        <RadarBoard
          items={[
            item({
              visibility: action === "publish" ? "private" : "shared_household",
              state: action === "publish" ? "draft" : "open",
              desiredTiming: "This week"
            })
          ]}
        />
      );

      if (action === "publish") {
        fireEvent.change(screen.getByLabelText("Publish visibility"), {
          target: { value: "check_in_only" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      }

      fireEvent.click(screen.getByRole("button", { name: buttonName }));
      if (expectedSection === "Deferred") {
        fireEvent.click(screen.getByRole("button", { name: "Show deferred" }));
      }
      if (expectedSection === "Resolved") {
        fireEvent.click(screen.getByRole("button", { name: "Show resolved" }));
      }
      if (expectedSection === "Dismissed") {
        fireEvent.click(screen.getByRole("button", { name: "Show dismissed" }));
      }

      await waitFor(() => {
        expect(
          within(screen.getByRole("region", { name: expectedSection })).getByText(
            "Clarify morning handoff"
          )
        ).toBeVisible();
      });
    }
  );

  it("sends a selected revisit date when deferring and surfaces the returned date", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...item({
          visibility: "shared_household",
          state: "deferred",
          desiredTiming: "This week",
          deferredUntil: "2026-05-11T12:00:00.000Z"
        }),
        notes: null,
        targetCheckInId: null,
        createdAt: "2026-05-04T12:00:00.000Z",
        updatedAt: "2026-05-04T12:00:00.000Z",
        resolvedAt: null
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RadarBoard
        items={[
          item({
            visibility: "shared_household",
            state: "open",
            desiredTiming: "This week"
          })
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Revisit date"), {
      target: { value: "2026-05-11" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Defer" }));
    fireEvent.click(screen.getByRole("button", { name: "Show deferred" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/radar/550e8400-e29b-41d4-a716-446655440010/defer",
        expect.objectContaining({
          body: JSON.stringify({
            id: "550e8400-e29b-41d4-a716-446655440010",
            deferredUntil: "2026-05-11T12:00:00.000Z"
          })
        })
      );
    });
    expect(screen.getByText("Revisit: May 11, 2026")).toBeVisible();
  });
});
