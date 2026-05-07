import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppHomePage from "@/app/app/home/page";
import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import type { LittleAlexPreferences } from "@/contracts/preferences";
import { OnboardingPageClient } from "@/components/onboarding/onboarding-page-client";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppShell } from "./app-shell";

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => vi.fn(() => "/app/load-map"));

vi.mock("next/navigation", () => ({
  usePathname: pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace
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
  genderPresentation: "masculine",
  chatPhrase: "hello from alex",
  skinTone: "tone_5",
  updatedAt: "2026-05-06T12:00:00.000Z"
};

const retiredGuideAnchor = ["app", "guide", "101"].join("-");
const retiredGuideLabel = ["App", "Guide", "101"].join(" ");
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function renderProtectedUi(children: ReactNode) {
  return render(
    <ThemeProvider>
      <AppShell
        household={household}
        littleAlexPreferences={littleAlexPreferences}
        selectedPersona={selectedPersona}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === reducedMotionQuery ? matches : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  );
}

describe("protected app UI", () => {
  afterEach(() => {
    pathname.mockReturnValue("/app/load-map");
    routerPush.mockReset();
    routerReplace.mockReset();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
  });

  it("renders the app shell around the real home page", () => {
    const { container } = renderProtectedUi(<AppHomePage />);

    expect(
      screen.getAllByRole("link", { name: /River Home Fairplay/i })[0]
    ).toHaveAttribute("href", "/app/home");
    expect(screen.getAllByRole("link", { name: "Alex" })[0]).toHaveAttribute(
      "href",
      "/app/settings"
    );
    expect(
      screen.getByRole("heading", { name: "Learn Fairplay in layers" })
    ).toBeVisible();
    expect(screen.getByTestId("page-shell")).toHaveAttribute(
      "data-page-shell",
      "foreground"
    );
    const homeBackground = container.querySelector("[data-home-background]");
    expect(homeBackground).not.toBeNull();
    expect(homeBackground).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png')"
    });
    expect(
      screen
        .getAllByRole("link", { name: "Crash course" })
        .some((link) => link.getAttribute("href") === "/app/crash-course")
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Learn a feature" })).toHaveAttribute(
      "href",
      "/app/home#learn-a-feature"
    );
    expect(screen.getByRole("link", { name: "Card library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(
      screen.getByRole("heading", { name: "Learn a feature" })
    ).toBeVisible();
    expect(container.querySelector("#learn-a-feature")).not.toBeNull();
    expect(container.querySelector(`#${retiredGuideAnchor}`)).toBeNull();
    expect(screen.queryByText(retiredGuideLabel)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Learn this feature: Load Map" })
    ).toHaveAttribute("href", "/app/load-map?guide=loadMap");
    expect(
      screen.getByRole("link", { name: "Learn this feature: Library" })
    ).toHaveAttribute("href", "/app/library?guide=library");
    expect(
      screen.getByRole("link", { name: "Learn this feature: Radar" })
    ).toHaveAttribute("href", "/app/radar?guide=radar");
    expect(
      screen.getByRole("link", { name: "Learn this feature: Check-ins" })
    ).toHaveAttribute("href", "/app/check-ins/new?guide=checkIns");
    expect(
      screen.getByRole("link", { name: "Learn this feature: Settings" })
    ).toHaveAttribute("href", "/app/settings?guide=settings");
  });

  it("renders premium route chrome with active load map and personal-use entries", () => {
    renderProtectedUi(<AppHomePage />);

    expect(screen.getByTestId("app-main")).toHaveAttribute(
      "data-layout",
      "standard"
    );
    expect(screen.getByTestId("app-main")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png')"
    });
    expect(screen.getAllByRole("navigation", { name: "Primary" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /Library/i })[0]).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(screen.getAllByRole("link", { name: /Crash course/i })[0]).toHaveAttribute(
      "href",
      "/app/crash-course"
    );
    expect(screen.getAllByRole("link", { name: /Load map/i })[0]).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders Little Alex as a decorative physics object on standard protected pages", () => {
    renderProtectedUi(<AppHomePage />);

    const littleAlex = screen.getByTestId("little-alex-horne");
    expect(littleAlex).toHaveAttribute("aria-hidden", "true");
    expect(littleAlex).toHaveAttribute("data-physics-engine", "matter-js");
    expect(littleAlex).toHaveAttribute("data-motion-mode", "physics");
    expect(littleAlex).toHaveAttribute("data-chat-phrase", "hello from alex");
    expect(littleAlex).toHaveAttribute("data-gender-presentation", "masculine");
    expect(littleAlex).toHaveStyle({ "--little-alex-skin": "#8f5f45" });
    expect(littleAlex).toHaveStyle({ pointerEvents: "none" });
    expect(screen.queryByRole("button", { name: /little alex/i })).not.toBeInTheDocument();
    expect(screen.getAllByTestId("little-alex-body-part")).toHaveLength(6);
    expect(screen.getByTestId("little-alex-grab-target")).toHaveStyle({
      pointerEvents: "auto"
    });
  });

  it("uses theme primary tokens for active app navigation items", () => {
    renderProtectedUi(<AppHomePage />);

    const activeLoadMapLinks = screen
      .getAllByRole("link", { name: /Load map/i })
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeLoadMapLinks).toHaveLength(2);
    activeLoadMapLinks.forEach((link) => {
      expect(link).toHaveClass("bg-fp-primary", "text-fp-on-primary");
      expect(link.className).not.toContain("text-white");
    });
  });

  it("lets the crash course route use the full app canvas", () => {
    pathname.mockReturnValue("/app/crash-course");

    renderProtectedUi(<div>Immersive crash course</div>);

    const main = screen.getByTestId("app-main");
    expect(main).toHaveAttribute("data-layout", "immersive");
    expect(main).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png')"
    });
    expect(main.className).toContain("w-full");
    expect(main.className).not.toContain("max-w-6xl");
    expect(screen.getAllByRole("link", { name: /Crash course/i })[0]).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByTestId("little-alex-horne")).toBeInTheDocument();
  });

  it("settles Little Alex into a draggable-safe static mode for reduced motion", () => {
    stubReducedMotion(true);

    renderProtectedUi(<AppHomePage />);

    const littleAlex = screen.getByTestId("little-alex-horne");
    expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");
    expect(littleAlex).toHaveAttribute("data-physics-engine", "matter-js");
    expect(screen.getByTestId("little-alex-grab-target")).toHaveStyle({
      pointerEvents: "auto"
    });
  });

  it("renders onboarding inside the app shell and routes skip to home", () => {
    renderProtectedUi(<OnboardingPageClient />);

    expect(
      screen.getByRole("heading", { name: "Set up your household rhythm" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(routerPush).toHaveBeenCalledWith("/app/home");
  });

  it("renders settings inside the app shell with household and persona state", () => {
    renderProtectedUi(
      <SettingsPanel
        household={household}
        littleAlexPreferences={littleAlexPreferences}
        selectedPersona={selectedPersona}
      />
    );

    expect(screen.getByRole("heading", { name: "Household settings" })).toBeVisible();
    expect(screen.getAllByText("River Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Switch persona" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
  });
});
