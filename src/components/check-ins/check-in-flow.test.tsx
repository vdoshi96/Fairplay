import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import { CheckInFlow, NewCheckInLauncher } from "./check-in-flow";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

const checkIn: GuidedCheckIn = {
  id: "550e8400-e29b-41d4-a716-446655440080",
  state: "active",
  scheduledFor: null,
  facilitatorPersonaKey: "alex",
  summary: null,
  completedAt: null,
  items: [
    {
      id: "550e8400-e29b-41d4-a716-446655440081",
      itemType: "radar",
      state: "queued",
      promptKey: "radar_discussion",
      radarItemId: "550e8400-e29b-41d4-a716-446655440090",
      responsibilityId: null,
      sortOrder: 0,
      title: "Clarify morning handoff",
      description: "Shared household",
      visibility: "shared_household",
      response: null,
      decisionId: null
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440082",
      itemType: "responsibility",
      state: "queued",
      promptKey: "responsibility_review",
      radarItemId: null,
      responsibilityId: "550e8400-e29b-41d4-a716-446655440070",
      sortOrder: 1,
      title: "Weekly meal outline",
      description: "Review due",
      visibility: "shared_household",
      response: null,
      decisionId: null
    }
  ]
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

describe("CheckInFlow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the new check-in launcher as a centered workflow with grouped actions", () => {
    render(<NewCheckInLauncher initialSuggestions={checkIn.items} />);

    expect(screen.getByTestId("check-in-new-workflow")).toBeVisible();

    const actions = screen.getByTestId("check-in-launcher-actions");
    expect(
      within(actions).getByRole("button", { name: "Preview agenda" })
    ).toBeVisible();
    expect(
      within(actions).getByRole("button", { name: "Start check-in" })
    ).toBeVisible();

    const agenda = screen.getByTestId("check-in-agenda-preview-list");
    expect(agenda).toHaveAttribute("data-guide-id", "check-in-agenda");
    expect(within(agenda).getByText("Clarify morning handoff")).toBeVisible();
  });

  it("lets users remove suggested agenda items before starting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => checkIn
      })
    );
    render(<NewCheckInLauncher />);

    expect(screen.getByTestId("check-in-new-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(screen.getByTestId("check-in-new-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("check-in-new-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(
      screen.getByRole("button", { name: "Learn this feature" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Preview agenda" }));
    await screen.findByText("Clarify morning handoff");
    expect(fetch).toHaveBeenCalledWith(
      "/api/check-ins/preview",
      expect.objectContaining({ method: "POST" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Weekly meal outline" }));
    expect(screen.getByRole("button", { name: "Start check-in" })).not.toHaveAttribute(
      "data-guide-id",
      "check-in-complete"
    );
    fireEvent.click(screen.getByRole("button", { name: "Start check-in" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/check-ins",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("550e8400-e29b-41d4-a716-446655440090")
        })
      );
    });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1]?.body)
      .not.toContain("550e8400-e29b-41d4-a716-446655440070");
  });

  it("starts with selected preview item ids without expanding linked radar responsibilities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...checkIn,
          items: [
            {
              ...checkIn.items[0],
              responsibilityId: "550e8400-e29b-41d4-a716-446655440070"
            }
          ]
        })
      })
    );
    render(<NewCheckInLauncher />);

    fireEvent.click(screen.getByRole("button", { name: "Preview agenda" }));
    await screen.findByText("Clarify morning handoff");
    fireEvent.click(screen.getByRole("button", { name: "Start check-in" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/check-ins",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("550e8400-e29b-41d4-a716-446655440090")
        })
      );
    });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1]?.body)
      .not.toContain("550e8400-e29b-41d4-a716-446655440070");
  });

  it("sends owner and review date as a structured responsibility decision effect", async () => {
    const onDecision = vi.fn();
    render(
      <CheckInFlow
        initialCheckIn={{ ...checkIn, items: [checkIn.items[1]] }}
        onDecision={onDecision}
      />
    );

    fireEvent.change(screen.getByLabelText("Decision type"), {
      target: { value: "assign_owner" }
    });
    fireEvent.change(screen.getByLabelText("Owner"), {
      target: { value: "max" }
    });
    fireEvent.change(screen.getByLabelText("Decision summary"), {
      target: { value: "Max owns meal planning until the next review." }
    });
    fireEvent.change(screen.getByLabelText("Review date"), {
      target: { value: "2026-06-04" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Record decision" }));

    await waitFor(() => {
      expect(onDecision).toHaveBeenCalledWith(
        checkIn.id,
        checkIn.items[1].id,
        expect.objectContaining({
          decisionType: "assign_owner",
          responsibilityId: "550e8400-e29b-41d4-a716-446655440070",
          reviewOn: "2026-06-04T12:00:00.000Z",
          responsibilityEffect: {
            kind: "assign_owner",
            assignments: [
              {
                personaKey: "max",
                role: "accountable_owner",
                scope: "outcome"
              }
            ],
            revisitAt: "2026-06-04T12:00:00.000Z"
          }
        })
      );
    });
  });

  it("shows current item, visibility label, and skip/defer controls", async () => {
    const onUpdateItem = vi.fn();
    render(<CheckInFlow initialCheckIn={checkIn} onUpdateItem={onUpdateItem} />);

    expect(screen.getByTestId("check-in-active-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(screen.getByTestId("check-in-active-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("check-in-active-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(
      screen.getByRole("button", { name: "Learn this feature" })
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Current item" })).toHaveAttribute(
      "data-guide-id",
      "check-in-agenda"
    );
    expect(screen.getByRole("heading", { name: "Clarify morning handoff" }))
      .toBeVisible();
    expect(screen.getByText("Shared household")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => {
      expect(onUpdateItem).toHaveBeenCalledWith(
        checkIn.id,
        checkIn.items[0].id,
        expect.objectContaining({ state: "skipped" })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Defer" }));
    await waitFor(() => {
      expect(onUpdateItem).toHaveBeenCalledWith(
        checkIn.id,
        checkIn.items[1].id,
        expect.objectContaining({ state: "deferred" })
      );
    });
  });

  it("captures a T02 decision and review date through the decision form", async () => {
    const onDecision = vi.fn();
    render(<CheckInFlow initialCheckIn={checkIn} onDecision={onDecision} />);

    expect(screen.getByRole("region", { name: "Decision form" })).toHaveAttribute(
      "data-guide-id",
      "check-in-decision"
    );
    expect(screen.getByRole("button", { name: "Complete check-in" })).toHaveAttribute(
      "data-guide-id",
      "check-in-complete-action"
    );

    fireEvent.change(screen.getByLabelText("Decision type"), {
      target: { value: "schedule_review" }
    });
    fireEvent.change(screen.getByLabelText("Decision summary"), {
      target: { value: "Review the meal plan in June." }
    });
    fireEvent.change(screen.getByLabelText("Review date"), {
      target: { value: "2026-06-04" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Record decision" }));

    await waitFor(() => {
      expect(onDecision).toHaveBeenCalledWith(
        checkIn.id,
        checkIn.items[0].id,
        expect.objectContaining({
          decisionType: "schedule_review",
          summary: "Review the meal plan in June.",
          reviewOn: "2026-06-04T12:00:00.000Z"
        })
      );
    });
  });

  it("renders the completion summary after complete", async () => {
    const onComplete = vi.fn().mockResolvedValue({
      ...checkIn,
      state: "completed",
      completedAt: "2026-05-04T13:00:00.000Z",
      summary: "Decisions: Review the meal plan in June."
    });
    render(<CheckInFlow initialCheckIn={checkIn} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Complete check-in" }));

    const region = await screen.findByRole("region", { name: "Check-in summary" });
    expect(screen.getByTestId("check-in-complete-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(screen.getByTestId("check-in-complete-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("check-in-complete-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(region).toHaveAttribute("data-guide-id", "check-in-complete-summary");
    expect(within(region).getByText(/Review the meal plan in June/)).toBeVisible();
  });

  it("announces skip failures and blocks duplicate skip submits while pending", async () => {
    const pendingUpdate = deferred<void>();
    const onUpdateItem = vi.fn().mockReturnValue(pendingUpdate.promise);
    render(<CheckInFlow initialCheckIn={checkIn} onUpdateItem={onUpdateItem} />);

    const skip = screen.getByRole("button", { name: "Skip" });
    fireEvent.click(skip);
    fireEvent.click(skip);

    expect(skip).toBeDisabled();
    expect(onUpdateItem).toHaveBeenCalledTimes(1);

    pendingUpdate.reject(new Error("Unable to skip this item."));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to skip this item."
    );
    expect(screen.getByRole("heading", { name: "Clarify morning handoff" }))
      .toBeVisible();
  });

  it("announces defer failures without advancing the current item", async () => {
    const onUpdateItem = vi.fn().mockRejectedValue(new Error("Unable to defer."));
    render(<CheckInFlow initialCheckIn={checkIn} onUpdateItem={onUpdateItem} />);

    fireEvent.click(screen.getByRole("button", { name: "Defer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to defer.");
    expect(screen.getByRole("heading", { name: "Clarify morning handoff" }))
      .toBeVisible();
  });

  it("announces decision save failures, blocks duplicates, and preserves fields", async () => {
    const pendingDecision = deferred<void>();
    const onDecision = vi.fn().mockReturnValue(pendingDecision.promise);
    render(
      <CheckInFlow
        initialCheckIn={{ ...checkIn, items: [checkIn.items[1]] }}
        onDecision={onDecision}
      />
    );

    fireEvent.change(screen.getByLabelText("Decision type"), {
      target: { value: "assign_owner" }
    });
    fireEvent.change(screen.getByLabelText("Owner"), {
      target: { value: "max" }
    });
    fireEvent.change(screen.getByLabelText("Decision summary"), {
      target: { value: "Max owns meal planning until the next review." }
    });
    fireEvent.change(screen.getByLabelText("Review date"), {
      target: { value: "2026-06-04" }
    });
    const record = screen.getByRole("button", { name: "Record decision" });
    fireEvent.click(record);
    fireEvent.click(record);

    expect(record).toBeDisabled();
    expect(onDecision).toHaveBeenCalledTimes(1);

    pendingDecision.reject(new Error("Unable to save decision."));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save decision."
    );
    expect(screen.getByLabelText("Decision summary")).toHaveValue(
      "Max owns meal planning until the next review."
    );
    expect(screen.getByLabelText("Review date")).toHaveValue("2026-06-04");
    expect(screen.getByLabelText("Owner")).toHaveValue("max");
  });

  it("announces completion failures and blocks duplicate complete submits while pending", async () => {
    const pendingComplete = deferred<GuidedCheckIn>();
    const onComplete = vi.fn().mockReturnValue(pendingComplete.promise);
    render(<CheckInFlow initialCheckIn={checkIn} onComplete={onComplete} />);

    const complete = screen.getByRole("button", { name: "Complete check-in" });
    fireEvent.click(complete);
    fireEvent.click(complete);

    expect(complete).toBeDisabled();
    expect(onComplete).toHaveBeenCalledTimes(1);

    pendingComplete.reject(new Error("Unable to complete check-in."));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to complete check-in."
    );
  });

  it("walks through a local dummy check-in workflow without production mutations", () => {
    const onUpdateItem = vi.fn();
    const onDecision = vi.fn();
    const onComplete = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CheckInFlow
        initialCheckIn={checkIn}
        onComplete={onComplete}
        onDecision={onDecision}
        onUpdateItem={onUpdateItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Start dummy Check-in workflow" })
    );
    const practiceRegion = screen.getByRole("region", {
      name: "Dummy Check-in practice"
    });
    expect(practiceRegion).toBeVisible();
    expect(practiceRegion).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(practiceRegion.className).not.toContain("bg-white");

    fireEvent.click(screen.getByRole("button", { name: "Preview dummy agenda" }));
    expect(screen.getByText("Dummy agenda previewed.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy topic owner"), {
      target: { value: "max" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign dummy topic" }));
    expect(screen.getByText("Dummy topic assigned to Max.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy decision summary"), {
      target: { value: "Max owns lunch kit reset until June." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Record dummy decision" }));
    expect(screen.getByText("Dummy decision recorded.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Defer dummy item" }));
    expect(screen.getByText("Dummy item deferred.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Complete dummy check-in" }));
    expect(screen.getByText("Dummy Check-in workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(onUpdateItem).not.toHaveBeenCalled();
    expect(onDecision).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
