import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppHomePage from "@/app/app/home/page";
import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import { OnboardingPageClient } from "@/components/onboarding/onboarding-page-client";
import { SettingsPanel } from "@/components/settings/settings-panel";
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

function renderProtectedUi(children: ReactNode) {
  render(
    <AppShell household={household} selectedPersona={selectedPersona}>
      {children}
    </AppShell>
  );
}

describe("protected app UI", () => {
  afterEach(() => {
    pathname.mockReturnValue("/app/load-map");
    routerPush.mockReset();
    routerReplace.mockReset();
  });

  it("renders the app shell around the real home page", () => {
    renderProtectedUi(<AppHomePage />);

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
    expect(
      screen
        .getAllByRole("link", { name: "Crash course" })
        .some((link) => link.getAttribute("href") === "/app/crash-course")
    ).toBe(true);
    expect(screen.getByRole("link", { name: "App Guide 101" })).toHaveAttribute(
      "href",
      "/app/home#app-guide-101"
    );
    expect(screen.getByRole("link", { name: "Card library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
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
      <SettingsPanel household={household} selectedPersona={selectedPersona} />
    );

    expect(screen.getByRole("heading", { name: "Household settings" })).toBeVisible();
    expect(screen.getAllByText("River Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Switch persona" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
  });
});
