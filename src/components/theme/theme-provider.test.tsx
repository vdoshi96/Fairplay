import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  useTheme,
  type ThemeMode
} from "./theme-provider";

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = "(prefers-color-scheme: dark)";
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media,
    onchange: null,
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      if (event === "change") {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      if (event === "change") {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    }),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn()
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList)
  );

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    }
  };
}

function ThemeHarness() {
  const { mode, resolvedTheme, setMode } = useTheme();

  return (
    <div>
      <p>Mode: {mode}</p>
      <p>Resolved: {resolvedTheme}</p>
      {(["system", "light", "dark"] satisfies ThemeMode[]).map((themeMode) => (
        <button key={themeMode} onClick={() => setMode(themeMode)} type="button">
          {themeMode}
        </button>
      ))}
    </div>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("applies the system color scheme to the root element", async () => {
    installMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
      expect(document.documentElement).toHaveAttribute(
        "data-theme-mode",
        "system"
      );
    });
    expect(screen.getByText("Mode: system")).toBeVisible();
    expect(screen.getByText("Resolved: dark")).toBeVisible();
  });

  it("responds to system preference changes while in system mode", async () => {
    const media = installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-theme", "light")
    );

    act(() => {
      media.setMatches(true);
    });

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
      expect(screen.getByText("Resolved: dark")).toBeVisible();
    });
  });

  it("persists explicit mode overrides locally", async () => {
    installMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "light" }));

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
      expect(document.documentElement).toHaveAttribute(
        "data-theme-mode",
        "light"
      );
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByText("Mode: light")).toBeVisible();
  });

  it("starts from the server-safe theme state before applying stored preferences", async () => {
    installMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const snapshots: Array<{ mode: ThemeMode; resolvedTheme: string }> = [];

    function SnapshotHarness() {
      const { mode, resolvedTheme } = useTheme();
      snapshots.push({ mode, resolvedTheme });

      return <ThemeHarness />;
    }

    render(
      <ThemeProvider>
        <SnapshotHarness />
      </ThemeProvider>
    );

    expect(snapshots[0]).toEqual({
      mode: "system",
      resolvedTheme: "light"
    });
    await waitFor(() => {
      expect(screen.getByText("Mode: dark")).toBeVisible();
      expect(screen.getByText("Resolved: dark")).toBeVisible();
    });
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
  });

  it("loads a previously selected mode from local storage", async () => {
    installMatchMedia(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
      expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
    });
    expect(screen.getByText("Mode: dark")).toBeVisible();
  });
});
