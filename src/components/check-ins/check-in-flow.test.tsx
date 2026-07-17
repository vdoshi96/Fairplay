import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import {
  CheckInFlow,
  CheckInHistoryTable,
  NewCheckInLauncher
} from "./check-in-flow";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

const scheduledCheckIn: GuidedCheckIn = {
  id: "550e8400-e29b-41d4-a716-446655440080",
  state: "scheduled",
  scheduledFor: "2026-05-20T23:30:00.000Z",
  facilitatorPersonaKey: "alex",
  summary: null,
  completedAt: null,
  items: []
};

function completedCheckIn(
  summary = "Talked through summer routines."
): GuidedCheckIn {
  return {
    ...scheduledCheckIn,
    state: "completed",
    completedAt: "2026-05-21T00:15:00.000Z",
    summary
  };
}

describe("CheckInFlow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a minimal schedule form and creates a scheduled check-in", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => scheduledCheckIn
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <NewCheckInLauncher
        worthReviewing={[
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            title: "Dishes",
            status: "needs_review",
            nextReviewAt: null,
            hiddenEffortKeys: ["planning"]
          }
        ]}
      />
    );

    expect(screen.getByTestId("check-in-new-workflow")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Schedule check-in" })).toBeVisible();
    expect(screen.getByText("Pick a time. After it happens, confirm and add notes."))
      .toBeVisible();
    expect(screen.getByTestId("check-in-new-visual")).not.toHaveAttribute(
      "data-guide-id"
    );
    expect(screen.getByTestId("check-in-new-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    const checkInBackground = screen.getByTestId("check-in-new-background");
    expect(
      checkInBackground.style.getPropertyValue("--fp-background-fallback")
    ).toBe(
      "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    );
    expect(
      checkInBackground.style.getPropertyValue("--fp-background-mobile")
    ).toContain("check-in-table-768.avif");
    expect(
      checkInBackground.style.getPropertyValue("--fp-background-desktop")
    ).toContain("check-in-table-1536.webp");
    expect(screen.queryByRole("button", { name: "Preview agenda" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start check-in" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Learn this feature" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Worth reviewing" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View or update agreement for Dishes" })
    ).toHaveAttribute(
      "href",
      "/app/responsibilities/550e8400-e29b-41d4-a716-446655440011"
    );
    expect(screen.queryByText(/agenda/i)).not.toBeInTheDocument();

    const scheduleButton = screen.getByRole("button", { name: "Schedule" });
    expect(scheduleButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Check-in date"), {
      target: { value: "2026-05-20" }
    });
    fireEvent.change(screen.getByLabelText("Check-in time"), {
      target: { value: "18:30" }
    });
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/check-ins",
        expect.objectContaining({ method: "POST" })
      );
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.scheduledFor).toBe(new Date("2026-05-20T18:30").toISOString());
    expect(body).not.toHaveProperty("maxItems");
    expect(body).not.toHaveProperty("responsibilityIds");
    expect(await screen.findByRole("heading", { name: "Scheduled check-in" }))
      .toBeVisible();
  });

  it("confirms a scheduled check-in with optional minutes", async () => {
    const onComplete = vi.fn().mockResolvedValue(completedCheckIn("Discussed summer routines."));

    render(<CheckInFlow initialCheckIn={scheduledCheckIn} onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: "Scheduled check-in" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Confirm check-in" }))
      .not.toHaveAttribute("data-guide-id");
    expect(screen.getByRole("button", { name: "Confirm it happened" }))
      .not.toHaveAttribute("data-guide-id");
    expect(screen.queryByRole("region", { name: "Decision form" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Learn this feature" }))
      .not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Minutes / notes"), {
      target: { value: "Discussed summer routines." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm it happened" }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        scheduledCheckIn.id,
        expect.objectContaining({
          summary: "Discussed summer routines.",
          completedAt: expect.any(String)
        })
      );
    });
    expect(await screen.findByRole("heading", { name: "Check-in record" }))
      .toBeVisible();
    expect(screen.getByText("Check-in recorded.")).toBeVisible();
  });

  it("updates notes on a completed check-in record", async () => {
    const onComplete = vi.fn().mockResolvedValue(completedCheckIn("Updated notes."));

    render(<CheckInFlow initialCheckIn={completedCheckIn()} onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: "Check-in record" })).toBeVisible();
    expect(screen.getByLabelText("Minutes / notes")).toHaveValue(
      "Talked through summer routines."
    );

    fireEvent.change(screen.getByLabelText("Minutes / notes"), {
      target: { value: "Updated notes." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Update notes" }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(scheduledCheckIn.id, {
        completedAt: "2026-05-21T00:15:00.000Z",
        summary: "Updated notes."
      });
    });
    expect(screen.getByText("Notes updated.")).toBeVisible();
  });

  it("sends blank minutes when a completed check-in has no notes", async () => {
    const onComplete = vi.fn().mockResolvedValue(completedCheckIn(""));

    render(<CheckInFlow initialCheckIn={scheduledCheckIn} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm it happened" }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        scheduledCheckIn.id,
        expect.objectContaining({
          summary: null
        })
      );
    });
  });

  it("announces save failures and blocks duplicate confirms", async () => {
    let rejectCompletion: (reason?: unknown) => void = () => undefined;
    const onComplete = vi.fn(
      () =>
        new Promise<GuidedCheckIn>((_resolve, reject) => {
          rejectCompletion = reject;
        })
    );

    render(<CheckInFlow initialCheckIn={scheduledCheckIn} onComplete={onComplete} />);

    const confirm = screen.getByRole("button", { name: "Confirm it happened" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(confirm).toBeDisabled();
    expect(onComplete).toHaveBeenCalledTimes(1);

    rejectCompletion(new Error("Unable to save this check-in."));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save this check-in."
    );
  });

  it("does not render the old guided practice controls", () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckInFlow initialCheckIn={scheduledCheckIn} onComplete={onComplete} />);

    expect(screen.queryByRole("button", { name: "Learn this feature" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start practice" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Practice check-in record" }))
      .not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders persisted check-in history rows", () => {
    render(
      <CheckInHistoryTable
        records={[
          {
            id: "550e8400-e29b-41d4-a716-446655440081",
            minutes: "Discussed summer routines.",
            occurred: true,
            previousCheckInDate: "2026-05-21T00:15:00.000Z"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440082",
            minutes: "",
            occurred: false,
            previousCheckInDate: "2026-05-28T00:15:00.000Z"
          }
        ]}
      />
    );

    const table = screen.getByRole("table", { name: "Check-in history" });

    expect(within(table).getByText("Previous check-in date")).toBeVisible();
    expect(within(table).getByText("Previous check-in occurred")).toBeVisible();
    expect(within(table).getByText("Minutes")).toBeVisible();
    expect(within(table).getByText("Discussed summer routines.")).toBeVisible();
    expect(within(table).getByText("Yes")).toBeVisible();
    expect(within(table).getByText("No")).toBeVisible();

    const cards = screen.getByRole("list", { name: "Check-in history cards" });
    expect(cards).toHaveClass("md:hidden");
    expect(within(cards).getAllByRole("article")).toHaveLength(2);
    expect(within(cards).getAllByRole("link")[0]).toHaveClass("min-h-11");
    expect(within(cards).getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/app/check-ins/550e8400-e29b-41d4-a716-446655440081"
    );
    expect(within(cards).getByText("Discussed summer routines.")).toBeVisible();
    expect(within(cards).getByText("No notes recorded.")).toBeVisible();
    expect(table.parentElement).toHaveClass("hidden", "md:block");
  });
});
