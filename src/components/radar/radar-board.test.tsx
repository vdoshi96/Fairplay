import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RadarSummary } from "@/contracts/radar";
import { RadarBoard } from "./radar-board";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

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

  it("names the new visibility before publishing a private draft", async () => {
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

    await waitFor(() => {
      expect(onPublish).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440010",
        "private",
        "check_in_only",
        true
      );
    });
  });

  it("keeps the publish confirmation keyboard-modal and restores focus on Escape", async () => {
    render(<RadarBoard items={[item()]} />);

    const trigger = screen.getByRole("button", { name: "Publish" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Publish to Shared household?"
    });
    const confirmButton = within(dialog).getByRole("button", {
      name: "Confirm publish"
    });
    const cancelButton = within(dialog).getByRole("button", {
      name: "Keep private"
    });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(confirmButton).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(confirmButton).toHaveFocus();

    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes the publish confirmation with cancel and restores focus", async () => {
    render(<RadarBoard items={[item()]} />);

    const trigger = screen.getByRole("button", { name: "Publish" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Publish to Shared household?"
    });
    const cancelButton = within(dialog).getByRole("button", {
      name: "Keep private"
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Confirm publish" })
      ).toHaveFocus()
    );

    fireEvent.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
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

    expect(
      screen.getByRole("button", { name: "Learn this feature" })
    ).toBeVisible();
    expect(screen.getByLabelText("Topic")).toHaveAttribute(
      "data-guide-id",
      "radar-create"
    );
    expect(screen.getByLabelText("Visibility")).toHaveAttribute(
      "data-guide-id",
      "radar-visibility"
    );

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

  it("keeps create input and shows an error when create fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Server declined the radar item." })
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server declined the radar item."
    );
    expect(screen.getByLabelText("Topic")).toHaveValue("New timing concern");
    expect(screen.getByLabelText("Desired timing")).toHaveValue("Before Friday");
  });

  it("keeps edit state and shows an error when edit fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unable to save the edit." })
      })
    );
    render(
      <RadarBoard
        items={[item({ visibility: "shared_household", state: "open" })]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Edit topic"), {
      target: { value: "Edited timing concern" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save edit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save the edit."
    );
    expect(screen.getByLabelText("Edit topic")).toHaveValue(
      "Edited timing concern"
    );
    expect(screen.getByRole("button", { name: "Save edit" })).toBeVisible();
  });

  it("keeps publish confirmation open and shows an error when publish fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unable to publish right now." })
      })
    );
    render(<RadarBoard items={[item()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog", {
      name: "Publish to Shared household?"
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm publish" })
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Unable to publish right now."
    );
    expect(
      screen.getByRole("dialog", { name: "Publish to Shared household?" })
    ).toBeVisible();
  });

  it("keeps transition context and shows an error when a transition fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unable to defer right now." })
      })
    );
    render(
      <RadarBoard
        items={[item({ visibility: "shared_household", state: "open" })]}
      />
    );

    const radarActions = document.querySelector('[data-guide-id="radar-actions"]');
    expect(radarActions).toBeInTheDocument();
    expect(radarActions).toHaveTextContent("Schedule");
    expect(radarActions).toHaveTextContent("Defer");
    expect(radarActions).toHaveTextContent("Resolve");
    expect(radarActions).not.toHaveTextContent("Show deferred");
    expect(radarActions).not.toHaveTextContent("Show resolved");
    expect(radarActions).not.toHaveTextContent("Show dismissed");

    fireEvent.change(screen.getByLabelText("Revisit date"), {
      target: { value: "2026-05-11" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Defer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to defer right now."
    );
    expect(screen.getByLabelText("Revisit date")).toHaveValue("2026-05-11");
    expect(
      within(screen.getByRole("region", { name: "Shared and open" })).getByText(
        "Clarify morning handoff"
      )
    ).toBeVisible();
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

  it("does not show stale revisit metadata outside deferred items", () => {
    render(
      <RadarBoard
        items={[
          item({
            id: "550e8400-e29b-41d4-a716-446655440011",
            topic: "Resolved stale revisit",
            visibility: "shared_household",
            state: "resolved",
            deferredUntil: "2026-05-11T12:00:00.000Z"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440012",
            topic: "Scheduled stale revisit",
            visibility: "check_in_only",
            state: "scheduled",
            deferredUntil: "2026-05-12T12:00:00.000Z"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440013",
            topic: "Open stale revisit",
            visibility: "shared_household",
            state: "open",
            deferredUntil: "2026-05-13T12:00:00.000Z"
          }),
          item({
            id: "550e8400-e29b-41d4-a716-446655440014",
            topic: "Real deferred revisit",
            visibility: "shared_household",
            state: "deferred",
            deferredUntil: "2026-05-14T12:00:00.000Z"
          })
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Show resolved" }));
    fireEvent.click(screen.getByRole("button", { name: "Show deferred" }));

    expect(screen.queryByText("Revisit: May 11, 2026")).not.toBeInTheDocument();
    expect(screen.queryByText("Revisit: May 12, 2026")).not.toBeInTheDocument();
    expect(screen.queryByText("Revisit: May 13, 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Revisit: May 14, 2026")).toBeVisible();
  });

  it("walks through a local dummy radar workflow without production mutations", async () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onPublish = vi.fn();
    const onTransition = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RadarBoard
        items={[]}
        onCreate={onCreate}
        onPublish={onPublish}
        onTransition={onTransition}
        onUpdate={onUpdate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Start dummy Radar workflow" }));
    expect(screen.getByRole("region", { name: "Dummy Radar practice" }))
      .toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy radar topic"), {
      target: { value: "Clarify lunch packing ownership" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create dummy radar draft" }));
    expect(screen.getByText("Dummy radar draft created.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Edit dummy radar topic"), {
      target: { value: "Clarify lunch kit reset" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save dummy radar edit" }));
    expect(screen.getByText("Dummy radar draft edited.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy visibility"), {
      target: { value: "check_in_only" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply dummy visibility" }));
    expect(screen.getByText("Dummy visibility set to Check-in only.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy revisit date"), {
      target: { value: "2026-05-11" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Defer dummy item" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule dummy item" }));
    fireEvent.click(screen.getByRole("button", { name: "Resolve dummy item" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss dummy item" }));

    expect(screen.getByText("Dummy Radar workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(onCreate).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onPublish).not.toHaveBeenCalled();
    expect(onTransition).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
