import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import type { LittleAlexPreferences } from "@/contracts/preferences";
import { OnboardingPageClient } from "@/components/onboarding/onboarding-page-client";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppShell } from "./app-shell";

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => vi.fn(() => "/app/distribute"));

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
    pathname.mockReturnValue("/app/distribute");
    routerPush.mockReset();
    routerReplace.mockReset();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
  });

  it("renders the card-first app shell without the old homepage", () => {
    const { container } = renderProtectedUi(
      <section>
        <h1>Swipe the next card</h1>
      </section>
    );

    expect(screen.getByRole("heading", { name: "Swipe the next card" }))
      .toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /River Home/i })[0]
    ).toHaveAttribute("href", "/app/your-cards");
    expect(screen.queryByRole("link", { name: /^Home$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Learn Fairplay" }))
      .not.toBeInTheDocument();
    expect(screen.getByTestId("page-shell")).toHaveAttribute(
      "data-page-shell",
      "foreground"
    );
    expect(screen.getByTestId("page-shell")).toHaveAttribute(
      "data-page-background-id",
      "distribute"
    );
    expect(container.querySelector("[data-page-shell-content]")).toHaveClass(
      "min-w-0"
    );
    expect(screen.getByTestId("page-shell-background-distribute")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png')"
    });
  });

  it("renders four primary tabs and keeps secondary routes in More", () => {
    renderProtectedUi(<div>Distribution workspace</div>);

    expect(screen.getByTestId("app-main")).toHaveAttribute(
      "data-layout",
      "standard"
    );
    expect(screen.getAllByRole("navigation", { name: "Primary" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Your Cards" })[0]).toHaveAttribute(
      "href",
      "/app/your-cards"
    );
    expect(screen.getAllByRole("link", { name: "Distribute" })[0]).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getAllByRole("link", { name: "Board" })[0]).toHaveAttribute(
      "href",
      "/app/board"
    );
    expect(screen.getAllByRole("link", { name: "Ask Greg" })[0]).toHaveAttribute(
      "href",
      "/app/ask-greg"
    );
    expect(screen.getAllByRole("navigation", { name: "More" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Theory" })[0]).toHaveAttribute(
      "href",
      "/app/crash-course"
    );
    expect(screen.getAllByRole("link", { name: "Card Library" })[0]).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(screen.queryByRole("link", { name: /Load map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Crash course/i }))
      .not.toBeInTheDocument();
  });

  it("keeps mobile overflow in the bottom action area instead of the top header", () => {
    renderProtectedUi(<div>Distribution workspace</div>);

    const mobileHeader = screen.getByTestId("mobile-app-header");
    const bottomNav = screen.getByTestId("mobile-bottom-navigation");

    expect(mobileHeader).not.toContainElement(
      screen.getByRole("button", { name: "Open more actions" })
    );
    expect(bottomNav).toContainElement(
      screen.getByRole("button", { name: "Open more actions" })
    );
    expect(bottomNav.querySelector(".grid")).toHaveClass("grid-cols-5");

    fireEvent.click(screen.getByRole("button", { name: "Open more actions" }));

    const mobileMore = screen.getByTestId("mobile-bottom-more-menu");
    expect(mobileMore).toHaveAttribute("aria-label", "More");
    expect(mobileMore).toHaveClass("bottom-full");
    expect(within(mobileMore).getByRole("link", { name: "Card Library" }))
      .toHaveAttribute("href", "/app/library");
  });

  it("keeps shell chrome constrained to the viewport on narrow mobile widths", () => {
    const { container } = renderProtectedUi(<div>Distribution workspace</div>);

    expect(screen.getByTestId("app-shell-root")).toHaveClass(
      "w-full",
      "max-w-full",
      "overflow-x-clip"
    );
    expect(screen.getByTestId("mobile-app-header")).toHaveClass(
      "w-full",
      "max-w-full",
      "overflow-x-clip"
    );
    expect(screen.getByTestId("mobile-bottom-navigation")).toHaveClass(
      "w-full",
      "max-w-full",
      "overflow-x-clip"
    );
    expect(container.querySelector("[data-page-shell-content]")).toHaveClass(
      "max-w-full"
    );
  });

  it("renders Little Alex as a decorative physics object on standard protected pages", () => {
    renderProtectedUi(<div>Distribution workspace</div>);

    const littleAlex = screen.getByTestId("little-alex-horne");
    expect(littleAlex).toHaveAttribute("aria-hidden", "true");
    expect(littleAlex).toHaveAttribute("data-physics-engine", "matter-js");
    expect(littleAlex).toHaveAttribute("data-motion-mode", "physics");
    expect(littleAlex).toHaveAttribute("data-chat-phrase", "hello from alex");
    expect(littleAlex).toHaveAttribute("data-gender-presentation", "masculine");
    expect(littleAlex).toHaveStyle({ "--little-alex-skin": "#8f5f45" });
    expect(screen.getByTestId("little-alex-full-sprite")).toHaveAttribute(
      "src",
      "/assets/fairplay/little-alex-sprites/masculine-tone_5-full.png"
    );
    expect(littleAlex).toHaveStyle({ pointerEvents: "none" });
    expect(screen.queryByRole("button", { name: /little alex/i })).not.toBeInTheDocument();
    expect(screen.getAllByTestId("little-alex-body-part")).toHaveLength(6);
    expect(screen.getByTestId("little-alex-grab-target")).toHaveStyle({
      pointerEvents: "auto"
    });
  });

  it("uses theme primary tokens for active bottom and sidebar tab items", () => {
    renderProtectedUi(<div>Distribution workspace</div>);

    const activeDistributeLinks = screen
      .getAllByRole("link", { name: "Distribute" })
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeDistributeLinks).toHaveLength(2);
    activeDistributeLinks.forEach((link) => {
      expect(link).toHaveClass("bg-fp-primary", "text-fp-on-primary");
      expect(link.className).not.toContain("text-white");
    });
  });

  it("lets the Theory route use the full app canvas", () => {
    pathname.mockReturnValue("/app/crash-course");

    renderProtectedUi(<div>Immersive theory</div>);

    const main = screen.getByTestId("app-main");
    expect(main).toHaveAttribute("data-layout", "immersive");
    expect(main).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png')"
    });
    expect(main.className).toContain("w-full");
    expect(main.className).not.toContain("max-w-6xl");
    expect(screen.getAllByRole("link", { name: "Theory" })[0]).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByTestId("little-alex-horne")).toBeInTheDocument();
  });

  it("settles Little Alex into a draggable-safe static mode for reduced motion", () => {
    stubReducedMotion(true);

    renderProtectedUi(<div>Distribution workspace</div>);

    const littleAlex = screen.getByTestId("little-alex-horne");
    expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");
    expect(littleAlex).toHaveAttribute("data-physics-engine", "matter-js");
    expect(screen.getByTestId("little-alex-grab-target")).toHaveStyle({
      pointerEvents: "auto"
    });
  });

  it("renders onboarding inside the app shell and routes skip to distribution", () => {
    renderProtectedUi(<OnboardingPageClient />);

    expect(
      screen.getByRole("heading", { name: "Set up your household rhythm" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(routerPush).toHaveBeenCalledWith("/app/distribute");
  });

  it("renders settings inside the app shell with household and persona state", () => {
    pathname.mockReturnValue("/app/settings");

    renderProtectedUi(
      <SettingsPanel
        household={household}
        littleAlexPreferences={littleAlexPreferences}
        selectedPersona={selectedPersona}
      />
    );

    expect(screen.getByRole("heading", { name: "Settings" })).toBeVisible();
    expect(screen.getByTestId("page-shell")).toHaveAttribute(
      "data-page-background-id",
      "settings"
    );
    expect(screen.getByTestId("page-shell-background-settings")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/settings-preferences.png')"
    });
    expect(screen.getAllByText("River Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Switch persona" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
  });
});
