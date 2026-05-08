import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import type { LittleAlexPreferences } from "@/contracts/preferences";
import {
  THEME_STORAGE_KEY,
  ThemeProvider
} from "@/components/theme/theme-provider";
import { SettingsPanel } from "./settings-panel";

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const routerRefresh = vi.hoisted(() => vi.fn());
const queryValue = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(queryValue.value),
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
    refresh: routerRefresh
  })
}));

const household: HouseholdSummary = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "River Home",
  timezone: "America/Chicago"
};

const selectedPersona: PersonaSummary = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  key: "alex",
  displayName: "Alex",
  avatarKey: "alex"
};

const littleAlexPreferences: LittleAlexPreferences = {
  personaId: selectedPersona.id,
  genderPresentation: "neutral",
  chatPhrase: "i'm little alex horne",
  skinTone: "tone_2",
  updatedAt: "2026-05-06T12:00:00.000Z"
};

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

function renderSettings() {
  render(
    <ThemeProvider>
      <SettingsPanel
        household={household}
        littleAlexPreferences={littleAlexPreferences}
        selectedPersona={selectedPersona}
      />
    </ThemeProvider>
  );
}

function openSwitchDialog() {
  const trigger = screen.getByRole("button", { name: "Switch persona" });
  trigger.focus();
  fireEvent.click(trigger);
  return {
    trigger,
    dialog: screen.getByRole("dialog", { name: "Switch active persona?" }),
    continueButton: screen.getByRole("button", { name: "Continue" }),
    cancelButton: screen.getByRole("button", { name: "Cancel" })
  };
}

describe("settings panel", () => {
  beforeEach(() => {
    queryValue.value = "";
  });

  afterEach(() => {
    routerPush.mockReset();
    routerReplace.mockReset();
    routerRefresh.mockReset();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses a system-follow switch and persists explicit light or dark overrides", async () => {
    renderSettings();

    expect(screen.getByTestId("settings-preferences-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/settings-preferences.png')"
    });
    expect(screen.getByTestId("settings-preferences-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("settings-preferences-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/settings-preferences.png')"
    });
    expect(screen.getByTestId("settings-preferences-background")).toHaveClass(
      "opacity-50"
    );
    const systemSwitch = screen.getByRole("switch", {
      name: "Follow system settings"
    });
    expect(systemSwitch).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("group", { name: "Theme override" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Light" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dark" })).toBeDisabled();

    fireEvent.click(systemSwitch);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
      expect(document.documentElement).toHaveAttribute("data-theme-mode", "light");
    });
    expect(systemSwitch).toHaveAttribute("aria-checked", "false");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
      expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(systemSwitch);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
      expect(document.documentElement).toHaveAttribute(
        "data-theme-mode",
        "system"
      );
    });
    expect(systemSwitch).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("customizes Little Alex preferences for the selected persona", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...littleAlexPreferences,
        genderPresentation: "feminine",
        chatPhrase: "well done everyone",
        skinTone: "tone_4"
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    expect(
      screen.getByRole("group", { name: "Little Alex gender presentation" })
    ).toBeVisible();
    expect(screen.getByLabelText("Little Alex chat bubble phrase")).toHaveValue(
      "i'm little alex horne"
    );

    fireEvent.click(screen.getByRole("button", { name: "Feminine" }));
    fireEvent.change(screen.getByLabelText("Little Alex chat bubble phrase"), {
      target: { value: "well done everyone" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Tone 4" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Little Alex" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/little-alex",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      genderPresentation: "feminine",
      chatPhrase: "well done everyone",
      skinTone: "tone_4"
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Little Alex updated for Alex."
    );
  });

  it("shows the mobile desktop-only Little Alex note without hiding preferences", () => {
    renderSettings();

    expect(
      screen.getByText(
        "Little Alex is available on desktop. Open FairPlay on a desktop browser to play with him."
      )
    ).toBeVisible();
    expect(screen.getByLabelText("Little Alex chat bubble phrase")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save Little Alex" })).toBeVisible();
  });

  it("keeps Little Alex phrases to 30 characters", () => {
    renderSettings();

    expect(screen.getByLabelText("Little Alex chat bubble phrase")).toHaveAttribute(
      "maxLength",
      "30"
    );
    expect(screen.getByText("21/30")).toBeVisible();
  });

  it("uses theme primary tokens for selected appearance and persona dialog actions", async () => {
    renderSettings();

    fireEvent.click(
      screen.getByRole("switch", { name: "Follow system settings" })
    );
    const selectedAppearanceMode = screen.getByRole("button", { name: "Light" });
    expect(selectedAppearanceMode).toHaveClass(
      "bg-fp-primary",
      "text-fp-on-primary"
    );
    expect(selectedAppearanceMode.className).not.toContain("text-white");
    expect(screen.getByRole("button", { name: "Log out" }).className).not.toContain(
      "bg-white"
    );

    const { cancelButton, continueButton } = openSwitchDialog();

    await waitFor(() => expect(continueButton).toHaveFocus());
    expect(continueButton).toHaveClass("bg-fp-primary", "text-fp-on-primary");
    expect(continueButton.className).not.toContain("text-white");
    expect(cancelButton.className).not.toContain("bg-white");
  });

  it("moves focus into the persona switch dialog when opened", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();

    await waitFor(() => expect(continueButton).toHaveFocus());
    expect(
      screen.getByText("You will choose Alex or Max again before returning to the app.")
    ).toBeVisible();
  });

  it("keeps tab focus inside the persona switch dialog", async () => {
    renderSettings();

    const { dialog, continueButton, cancelButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(continueButton).toHaveFocus();
  });

  it("hides background settings controls from the accessibility tree while open", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    expect(screen.queryByRole("button", { name: "Switch persona" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("closes with Cancel and restores focus to the trigger", async () => {
    renderSettings();

    const { trigger, cancelButton, continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    renderSettings();

    const { trigger, dialog, continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("continues to persona selection when confirmed", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.click(continueButton);

    expect(routerPush).toHaveBeenCalledWith("/choose-persona?next=/app/distribute");
  });

  it("restarts Theory through onboarding preferences", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Restart Theory" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/onboarding",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      crashCourseCurrentStep: 0,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).crashCourseReplayRequestedAt)
      .toEqual(expect.any(String));
    expect(routerPush).toHaveBeenCalledWith("/app/crash-course");
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not offer the retired welcome banner replay action", () => {
    renderSettings();

    expect(
      screen.queryByRole("button", { name: "Show welcome again" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Restart Theory or open the card deck.")).toBeVisible();
  });

  it("marks settings guide targets and links back to replay learning", () => {
    const { container } = render(
      <ThemeProvider>
        <SettingsPanel
          household={household}
          littleAlexPreferences={littleAlexPreferences}
          selectedPersona={selectedPersona}
        />
      </ThemeProvider>
    );

    expect(container.querySelector('[data-guide-id="settings-appearance"]')).not.toBeNull();
    expect(container.querySelector('[data-guide-id="settings-overview"]')).not.toBeNull();
    expect(container.querySelector('[data-guide-id="settings-persona"]')).not.toBeNull();
    expect(
      container.querySelector('[data-guide-id="settings-guided-start"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-guide-id="settings-logout"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Deal cards" })).toHaveAttribute(
      "href",
      "/app/distribute"
    );
    expect(screen.queryByText(retiredGuideLabel)).not.toBeInTheDocument();
    expect(
      screen.getByText("Feature guides stay on their pages.")
    ).toBeVisible();
  });

  it("walks through local dummy settings practice without changing account data", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Next required click: Start dummy Settings workflow.")
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Start dummy Settings workflow" }));
    const practiceRegion = screen.getByRole("region", {
      name: "Dummy Settings practice"
    });
    expect(practiceRegion).toBeVisible();
    expect(practiceRegion).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(practiceRegion.className).not.toContain("bg-white");
    expect(
      screen.getByText("Next required action: Choose a dummy appearance mode.")
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy appearance mode"), {
      target: { value: "dark" }
    });
    expect(screen.getByText("Dummy appearance mode changed to Dark.")).toBeVisible();
    expect(
      screen.getByText("Next required click: Open dummy persona confirmation.")
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Open dummy persona confirmation" })
    );
    expect(
      screen.getByRole("dialog", { name: "Dummy persona switch confirmation" })
    ).toBeVisible();
    expect(
      screen.getByText("Next required click: Stay in settings.")
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Stay in settings" }));
    expect(
      screen.getByText("Next required click: Locate dummy learning hub.")
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Locate dummy learning hub" }));
    expect(screen.getByText("Dummy Settings workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("closes dummy settings practice and persona confirmation on guide Skip", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Start dummy Settings workflow" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Open dummy persona confirmation" })
    );

    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Settings guide" })).getByRole(
        "button",
        { name: "Skip" }
      )
    );

    expect(
      screen.queryByRole("region", { name: "Dummy Settings practice" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Dummy persona switch confirmation" })
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("closes dummy settings practice after guide Done without routing or fetch mutations", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Start dummy Settings workflow" }));
    fireEvent.change(screen.getByLabelText("Dummy appearance mode"), {
      target: { value: "dark" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Open dummy persona confirmation" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Locate dummy learning hub" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.queryByRole("region", { name: "Dummy Settings practice" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Dummy persona switch confirmation" })
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("opens the settings-specific guide from the route query on the overview step", () => {
    queryValue.value = "guide=settings";

    renderSettings();

    const guide = screen.getByRole("dialog", { name: "Settings guide" });
    expect(guide).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Board guide" })
    ).not.toBeInTheDocument();
    expect(within(guide).getByText("Step 1 of 4")).toBeVisible();
    expect(
      within(guide).getByRole("heading", { name: "About this feature" })
    ).toBeVisible();
    expect(within(guide).getByTestId("guide-dialog-body")).toHaveTextContent(
      /settings/i
    );
  });
});
