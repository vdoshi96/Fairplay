import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import { CheckInFlow, NewCheckInLauncher } from "./check-in-flow";

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

    render(<NewCheckInLauncher />);

    expect(screen.getByTestId("check-in-new-workflow")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Schedule check-in" })).toBeVisible();
    expect(screen.getByText("Pick a time. After it happens, confirm and add notes."))
      .toBeVisible();
    expect(screen.getByTestId("check-in-new-visual")).toHaveAttribute(
      "data-guide-id",
      "check-in-overview"
    );
    expect(screen.getByTestId("check-in-new-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("check-in-new-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/check-in-table.png')"
    });
    expect(screen.queryByRole("button", { name: "Preview agenda" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start check-in" }))
      .not.toBeInTheDocument();

    const scheduleButton = screen.getByRole("button", { name: "Schedule" });
    expect(scheduleButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Date and time"), {
      target: { value: "2026-05-20T18:30" }
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
    expect(screen.getByRole("region", { name: "Confirm check-in" })).toHaveAttribute(
      "data-guide-id",
      "check-in-notes"
    );
    expect(screen.getByRole("button", { name: "Confirm it happened" })).toHaveAttribute(
      "data-guide-id",
      "check-in-complete-action"
    );
    expect(screen.queryByRole("region", { name: "Decision form" }))
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

  it("walks through lightweight practice without production mutations", () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CheckInFlow initialCheckIn={scheduledCheckIn} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
    expect(screen.getByText("Next required click: Start practice.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Start practice" }));
    const practiceRegion = screen.getByRole("region", {
      name: "Practice check-in record"
    });
    expect(practiceRegion).toHaveTextContent(/scheduling, confirming, and saving notes/i);
    expect(practiceRegion).not.toHaveTextContent(/agenda|decision|defer/i);

    fireEvent.change(screen.getByLabelText("Practice date"), {
      target: { value: "2026-05-20T18:30" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule practice check-in" }));
    expect(screen.getByText("Practice check-in scheduled.")).toBeVisible();
    expect(
      screen.getByText("Next required click: Confirm practice check-in.")
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Confirm practice check-in" }));
    expect(screen.getByText("Practice check-in confirmed.")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Practice minutes"), {
      target: { value: "Practice notes." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save practice notes" }));
    expect(screen.getByText("Practice notes saved.")).toBeVisible();
    expect(screen.getByText("Practice complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Clear practice" }));
    expect(within(practiceRegion).getByLabelText("Practice date")).toHaveValue("");
  });
});
