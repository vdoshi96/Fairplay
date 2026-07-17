import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DesktopLittleAlex,
  LITTLE_ALEX_DESKTOP_MEDIA,
  type LittleAlexPhysicsLoader
} from "./desktop-little-alex";

function stubDesktopMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();
  const media = {
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    addListener: (listener: () => void) => {
      listeners.add(listener);
    },
    dispatchEvent: vi.fn(),
    get matches() {
      return matches;
    },
    media: LITTLE_ALEX_DESKTOP_MEDIA,
    onchange: null,
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    removeListener: (listener: () => void) => {
      listeners.delete(listener);
    }
  } as unknown as MediaQueryList;

  const matchMedia = vi.fn((query: string) => {
    if (query !== LITTLE_ALEX_DESKTOP_MEDIA) {
      throw new Error(`Unexpected media query: ${query}`);
    }

    return media;
  });

  vi.stubGlobal("matchMedia", matchMedia);

  return {
    matchMedia,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => listener());
    }
  };
}

function physicsLoader() {
  const loader = vi.fn(async () => ({
    LittleAlexPhysics: ({ chatPhrase }: { chatPhrase?: string }) => (
      <div data-testid="lazy-little-alex">{chatPhrase}</div>
    )
  })) as LittleAlexPhysicsLoader;

  return loader;
}

describe("DesktopLittleAlex", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not import or render physics for mobile and touch-first media", () => {
    const media = stubDesktopMedia(false);
    const loader = physicsLoader();

    render(<DesktopLittleAlex chatPhrase="desktop only" loader={loader} />);

    expect(media.matchMedia).toHaveBeenCalledWith(LITTLE_ALEX_DESKTOP_MEDIA);
    expect(loader).not.toHaveBeenCalled();
    expect(screen.queryByTestId("lazy-little-alex")).not.toBeInTheDocument();
  });

  it("imports and renders physics lazily after the desktop fine-pointer match", async () => {
    stubDesktopMedia(true);
    const loader = physicsLoader();

    render(<DesktopLittleAlex chatPhrase="ready on desktop" loader={loader} />);

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId("lazy-little-alex")).toHaveTextContent(
      "ready on desktop"
    );
  });

  it("loads on a later desktop match and unmounts if the device becomes touch-first", async () => {
    const media = stubDesktopMedia(false);
    const loader = physicsLoader();

    render(<DesktopLittleAlex loader={loader} />);

    act(() => media.setMatches(true));

    expect(await screen.findByTestId("lazy-little-alex")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => media.setMatches(false));

    expect(screen.queryByTestId("lazy-little-alex")).not.toBeInTheDocument();
  });
});
