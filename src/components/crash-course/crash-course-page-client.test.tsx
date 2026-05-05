import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PersonaSummary } from "@/contracts/personas";

import { CrashCoursePageClient } from "./crash-course-page-client";

const selectedPersona: PersonaSummary = {
  avatarKey: "alex",
  displayName: "Alex",
  id: "550e8400-e29b-41d4-a716-446655440001",
  key: "alex"
};

describe("crash course page client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the completion splash when saved preferences are completed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        crashCourseCompletedAt: "2026-05-05T12:00:00.000Z",
        crashCourseCurrentStep: 9,
        crashCourseReplayRequestedAt: null,
        crashCourseSkippedAt: null,
        personaId: selectedPersona.id,
        updatedAt: "2026-05-05T12:00:00.000Z",
        welcomeDismissedAt: null
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CrashCoursePageClient selectedPersona={selectedPersona} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Hooray! Congrats on finishing Alex's Fairplay crash course."
        })
      ).toBeVisible()
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/preferences/onboarding");
    expect(
      screen.queryByText("Course marked complete for your active persona.")
    ).not.toBeInTheDocument();
  });
});
