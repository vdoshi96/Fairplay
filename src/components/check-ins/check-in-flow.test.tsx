import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import { CheckInFlow, NewCheckInLauncher } from "./check-in-flow";

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

describe("CheckInFlow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

    fireEvent.click(screen.getByRole("button", { name: "Preview agenda" }));
    await screen.findByText("Clarify morning handoff");
    expect(fetch).toHaveBeenCalledWith(
      "/api/check-ins/preview",
      expect.objectContaining({ method: "POST" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Weekly meal outline" }));
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
    expect(within(region).getByText(/Review the meal plan in June/)).toBeVisible();
  });
});
