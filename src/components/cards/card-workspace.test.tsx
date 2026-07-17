import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import { computeHouseholdWorkMap } from "@/domain/household-work-map";
import { CardWorkspace } from "./card-workspace";

const selectedPersona: PersonaSummary = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  key: "alex",
  displayName: "Alex",
  avatarKey: "alex"
};

function card(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "School lunch",
    areaKeys: ["kids", "food"],
    hiddenEffortKeys: ["noticing", "planning"],
    cadence: "daily",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    templateId: null,
    sourceCoverAssetPath: "/assets/fairplay/cards/meals-kids-school-lunch.png",
    sourceDefinition: "Pack and keep lunch ready for the school day.",
    sourceMinimumStandard: "Lunch is packed before school starts.",
    ...overrides
  };
}

function dispatchPointerEvent(
  target: Element,
  type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup",
  init: {
    buttons?: number;
    clientX: number;
    clientY: number;
    pointerId: number;
    pointerType?: string;
  }
) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.entries(init).forEach(([key, value]) => {
    Object.defineProperty(event, key, {
      configurable: true,
      enumerable: true,
      value
    });
  });

  fireEvent(target, event);
  return event;
}

function openAvailableCards() {
  const availableCards = screen.getByTestId("distribution-card-list");
  const toggle = within(availableCards).getByRole("button", {
    name: /^Show \d+$/
  });

  fireEvent.click(toggle);
  return availableCards;
}

function stubMedia({ reducedMotion = false }: { reducedMotion?: boolean } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches:
        query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  );
}

describe("CardWorkspace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the distribution empty state when no deck cards remain", () => {
    render(
      <CardWorkspace
        responsibilities={[card({ boardLane: "player_1" })]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    expect(
      screen.getByText("No more cards to deal. Generate more cards when ready.")
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Ask Greg" })).toHaveAttribute(
      "href",
      "/app/ask-greg"
    );
  });

  it("distributes the top card through fallback buttons", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "alex",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440000"
      })
    );
    await waitFor(() => {
      expect(
        screen.getByText("No more cards to deal. Generate more cards when ready.")
      ).toBeVisible();
    });
  });

  it("shows concise gesture instructions directly above the deal card", () => {
    render(
      <CardWorkspace
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const instructions = screen.getByRole("list", {
      name: "Deal gesture instructions"
    });
    const deck = screen.getByTestId("swipe-deck");

    expect(within(instructions).getByText("Swipe left: Alex")).toBeVisible();
    expect(within(instructions).getByText("Swipe right: Max")).toBeVisible();
    expect(within(instructions).getByText("Swipe up: Save for later")).toBeVisible();
    expect(within(instructions).getByText("Swipe down: Not applicable")).toBeVisible();
    expect(instructions.compareDocumentPosition(deck)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("undoes the most recent Deal assignment and puts that card back on top", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    await screen.findByRole("button", { name: "Undo last assignment" });
    expect(
      screen.getByText("School lunch -> Alex")
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByText("No more cards to deal. Generate more cards when ready.")
      ).toBeVisible()
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo last assignment" }));

    await waitFor(() =>
      expect(onDistribute).toHaveBeenLastCalledWith({
        bucket: "unassigned",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440000"
      })
    );
    expect(screen.getByRole("heading", { name: "School lunch" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Undo last assignment" }))
      .not.toBeInTheDocument();
  });

  it("reveals the next card immediately while the prior move is pending", async () => {
    let resolveMove: (() => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMove = resolve;
        })
    );

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "School lunch", boardSortOrder: 0 }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440001",
            title: "Bills",
            boardSortOrder: 1
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    await waitFor(() => expect(onDistribute).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Bills" })).toBeVisible();
    expect(screen.getByTestId("deal-outgoing-card")).toHaveAttribute(
      "data-direction",
      "alex"
    );
    expect(screen.getByText("Moving...")).toBeInTheDocument();
    expect(
      screen.queryByText("No more cards to deal. Generate more cards when ready.")
    ).not.toBeInTheDocument();

    resolveMove?.();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Alex" })).toBeEnabled()
    );
  });

  it("restores the exact selected card and catalog order when an optimistic move fails", async () => {
    let rejectMove: ((error: Error) => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectMove = reject;
        })
    );

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "Lunch", boardSortOrder: 0 }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440001",
            title: "Bills",
            boardSortOrder: 1
          }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440002",
            title: "Laundry",
            boardSortOrder: 2
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const availableCards = openAvailableCards();
    fireEvent.click(
      within(availableCards).getByRole("button", { name: /Bills/i })
    );
    const orderBefore = within(availableCards)
      .getAllByTestId("available-card-row")
      .map((row) => row.textContent);

    fireEvent.click(screen.getByRole("button", { name: "Max" }));

    expect(screen.getByRole("button", { name: "Laundry" })).toBeVisible();
    rejectMove?.(new Error("save failed"));

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Bills could not be moved. It is back in the same place.");
    expect(screen.getByRole("button", { name: "Bills" })).toBeVisible();
    expect(
      within(availableCards)
        .getByRole("button", { name: /Bills/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(availableCards)
        .getAllByTestId("available-card-row")
        .map((row) => row.textContent)
    ).toEqual(orderBefore);
  });

  it("locks Deal search and catalog selection until a pending move can roll back", async () => {
    let rejectMove: ((error: Error) => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectMove = reject;
        })
    );

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "Lunch", boardSortOrder: 0 }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440001",
            title: "Bills",
            boardSortOrder: 1
          }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440002",
            title: "Laundry",
            boardSortOrder: 2
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const availableCards = openAvailableCards();
    fireEvent.click(
      within(availableCards).getByRole("button", { name: /Bills/i })
    );
    fireEvent.click(screen.getByRole("button", { name: "Max" }));

    const search = screen.getByRole("searchbox", { name: /search cards/i });
    const lunchRow = within(availableCards).getByRole("button", {
      name: /Lunch/i
    });
    const browserToggle = within(availableCards).getByRole("button", {
      name: "Hide 2"
    });
    expect(search).toBeDisabled();
    expect(lunchRow).toBeDisabled();
    expect(browserToggle).toBeDisabled();
    expect(screen.getByRole("button", { name: "Laundry" })).toBeVisible();

    fireEvent.change(search, { target: { value: "Lunch" } });
    fireEvent.click(lunchRow);
    fireEvent.click(browserToggle);

    expect(screen.getByRole("button", { name: "Laundry" })).toBeVisible();
    rejectMove?.(new Error("save failed"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bills could not be moved. It is back in the same place."
    );
    expect(search).toBeEnabled();
    expect(search).toHaveValue("");
    expect(screen.getByRole("button", { name: "Bills" })).toBeVisible();
    expect(
      within(availableCards).getByRole("button", { name: /Bills/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("changes Deal state without directional animation in reduced-motion mode", async () => {
    stubMedia({ reducedMotion: true });
    let resolveMove: (() => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMove = resolve;
        })
    );

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "Lunch", boardSortOrder: 0 }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440001",
            title: "Bills",
            boardSortOrder: 1
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    expect(screen.getByRole("button", { name: "Bills" })).toBeVisible();
    expect(screen.queryByTestId("deal-outgoing-card")).not.toBeInTheDocument();
    resolveMove?.();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Alex" })).toBeEnabled()
    );
  });

  it("shows all available distribution cards and advances after a move", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ id: "550e8400-e29b-41d4-a716-446655440030", title: "Lunch", boardSortOrder: 0 }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440031",
            title: "Bills",
            boardSortOrder: 1,
            sourceCoverAssetPath: "/assets/fairplay/cards/cash-and-bills.png"
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const availableCards = openAvailableCards();
    expect(within(availableCards).getByRole("button", { name: /Lunch/i }))
      .toBeVisible();
    expect(within(availableCards).getByRole("button", { name: /Bills/i }))
      .toBeVisible();
    expect(within(availableCards).getByAltText("Lunch cover")).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/meals-kids-school-lunch.png"
    );

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "alex",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440030"
      })
    );
    expect(screen.getByRole("heading", { name: "Bills" })).toBeVisible();
    expect(
      screen.queryByText("No more cards to deal. Generate more cards when ready.")
    ).not.toBeInTheDocument();
  });

  it("selects and announces a card that was just added to Deal", async () => {
    const selectedId = "550e8400-e29b-41d4-a716-446655440031";
    window.history.pushState(
      null,
      "",
      `/app/distribute?added=greg&selected=${selectedId}`
    );

    render(
      <CardWorkspace
        addedToDeal
        initialSelectedId={selectedId}
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440030",
            title: "Lunch",
            boardSortOrder: 0
          }),
          card({
            id: selectedId,
            title: "Laundry reset",
            boardSortOrder: 1
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    expect(screen.getByRole("heading", { name: "Laundry reset" })).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Laundry reset was added to Deal and selected."
      );
    });
    const availableCards = openAvailableCards();
    expect(
      within(availableCards).getByRole("button", {
        name: /Laundry reset/i
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(window.location.pathname).toBe("/app/distribute");
    expect(window.location.search).toBe("");

    fireEvent.click(
      within(availableCards).getByRole("button", {
        name: /Lunch/i
      })
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("does not reannounce an added card after distributing and undoing it", async () => {
    const selectedId = "550e8400-e29b-41d4-a716-446655440031";
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        addedToDeal
        initialSelectedId={selectedId}
        onDistribute={onDistribute}
        responsibilities={[
          card({
            id: selectedId,
            title: "Laundry reset"
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Laundry reset was added to Deal and selected."
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Alex" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Undo last assignment" })
    );

    await waitFor(() => {
      expect(onDistribute).toHaveBeenLastCalledWith({
        bucket: "unassigned",
        responsibilityId: selectedId
      });
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });
    expect(
      screen.queryByText("Laundry reset was added to Deal and selected.")
    ).not.toBeInTheDocument();
  });

  it("ignores an unknown initial Deal selection and does not announce success", () => {
    render(
      <CardWorkspace
        addedToDeal
        initialSelectedId="550e8400-e29b-41d4-a716-446655449999"
        responsibilities={[card({ title: "Lunch" })]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    expect(screen.getByRole("heading", { name: "Lunch" })).toBeVisible();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("does not show duplicate catalog cards in Available cards", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440130",
            templateId: "tpl_adult-friendships-player-1",
            title: "Adult Friendships (Alex)"
          }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440131",
            templateId: "tpl_adult-friendships-player-1",
            title: "Adult Friendships (Alex)"
          }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440132",
            templateId: "tpl_adult-friendships-player-2",
            title: "Adult Friendships (Max)"
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const availableCards = openAvailableCards();

    expect(
      within(availableCards).getAllByRole("button", {
        name: /Adult Friendships \(Alex\)/i
      })
    ).toHaveLength(1);
    expect(
      within(availableCards).getByRole("button", {
        name: /Adult Friendships \(Max\)/i
      })
    ).toBeVisible();
  });

  it("keeps the Available Cards DOM bounded while the full catalog stays searchable", async () => {
    const responsibilities = Array.from({ length: 45 }, (_, index) =>
      card({
        boardSortOrder: index,
        id: `550e8400-e29b-41d4-a716-${String(446655440000 + index).padStart(12, "0")}`,
        title: `Catalog card ${index + 1}`
      })
    );

    render(
      <CardWorkspace
        responsibilities={responsibilities}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const availableCards = screen.getByTestId("distribution-card-list");
    expect(within(availableCards).queryAllByTestId("available-card-row"))
      .toHaveLength(0);

    fireEvent.click(
      within(availableCards).getByRole("button", { name: "Show 45" })
    );
    expect(within(availableCards).getAllByTestId("available-card-row"))
      .toHaveLength(20);
    expect(within(availableCards).queryByText("Catalog card 21"))
      .not.toBeInTheDocument();

    fireEvent.click(
      within(availableCards).getByRole("button", { name: "Next cards" })
    );
    expect(within(availableCards).getAllByTestId("available-card-row"))
      .toHaveLength(20);
    expect(within(availableCards).getByText("Catalog card 21")).toBeVisible();

    fireEvent.change(screen.getByRole("searchbox", { name: /search cards/i }), {
      target: { value: "Catalog card 45" }
    });

    await waitFor(() =>
      expect(within(availableCards).getAllByTestId("available-card-row"))
        .toHaveLength(1)
    );
    expect(screen.getByRole("heading", { name: "Catalog card 45" })).toBeVisible();
  });

  it("supports arrow keys as desktop gesture fallbacks", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.keyDown(screen.getByTestId("swipe-deck"), { key: "ArrowRight" });

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "max",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440000"
      })
    );
  });

  it("supports vertical swipe gestures for save-later and not-applicable decisions", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const firstCard = screen.getByRole("button", { name: "School lunch" });
    dispatchPointerEvent(firstCard, "pointerdown", {
      buttons: 1,
      clientX: 180,
      clientY: 360,
      pointerId: 11,
      pointerType: "touch"
    });
    dispatchPointerEvent(firstCard, "pointermove", {
      buttons: 1,
      clientX: 180,
      clientY: 150,
      pointerId: 11,
      pointerType: "touch"
    });
    dispatchPointerEvent(firstCard, "pointerup", {
      clientX: 180,
      clientY: 150,
      pointerId: 11,
      pointerType: "touch"
    });

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "savedForLater",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440000"
      })
    );

    onDistribute.mockClear();
    rerender(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440090",
            title: "School forms"
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const secondCard = screen.getByRole("button", { name: "School forms" });
    dispatchPointerEvent(secondCard, "pointerdown", {
      buttons: 1,
      clientX: 180,
      clientY: 240,
      pointerId: 12,
      pointerType: "touch"
    });
    dispatchPointerEvent(secondCard, "pointermove", {
      buttons: 1,
      clientX: 180,
      clientY: 450,
      pointerId: 12,
      pointerType: "touch"
    });
    dispatchPointerEvent(secondCard, "pointerup", {
      clientX: 180,
      clientY: 450,
      pointerId: 12,
      pointerType: "touch"
    });

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "notApplicable",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440090"
      })
    );
  });

  it("lets touch scrolling win unless a Deal gesture is clearly intentional", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const firstCard = screen.getByRole("button", { name: "School lunch" });
    const pointerDown = dispatchPointerEvent(firstCard, "pointerdown", {
      buttons: 1,
      clientX: 180,
      clientY: 240,
      pointerId: 21,
      pointerType: "touch"
    });

    expect(pointerDown.defaultPrevented).toBe(false);

    dispatchPointerEvent(firstCard, "pointermove", {
      buttons: 1,
      clientX: 184,
      clientY: 390,
      pointerId: 21,
      pointerType: "touch"
    });
    dispatchPointerEvent(firstCard, "pointerup", {
      clientX: 184,
      clientY: 390,
      pointerId: 21,
      pointerType: "touch"
    });

    expect(onDistribute).not.toHaveBeenCalled();
  });

  it("does not assign on diagonal mobile drags without strong direction dominance", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    const firstCard = screen.getByRole("button", { name: "School lunch" });
    dispatchPointerEvent(firstCard, "pointerdown", {
      buttons: 1,
      clientX: 180,
      clientY: 240,
      pointerId: 22,
      pointerType: "touch"
    });
    dispatchPointerEvent(firstCard, "pointermove", {
      buttons: 1,
      clientX: 280,
      clientY: 320,
      pointerId: 22,
      pointerType: "touch"
    });
    dispatchPointerEvent(firstCard, "pointerup", {
      clientX: 280,
      clientY: 320,
      pointerId: 22,
      pointerType: "touch"
    });

    expect(onDistribute).not.toHaveBeenCalled();
  });

  it("searches distribution cards before assigning one", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ id: "550e8400-e29b-41d4-a716-446655440030", title: "Lunch" }),
          card({
            id: "550e8400-e29b-41d4-a716-446655440031",
            title: "Bills",
            sourceMinimumStandard: "Bills are paid before late fees."
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /search cards/i }), {
      target: { value: "bills" }
    });
    expect(screen.getByRole("heading", { name: "Bills" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Lunch" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Max" }));

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "max",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440031"
      })
    );
  });

  it("flips the distribution card to show purpose, standards, and assignment", () => {
    render(
      <CardWorkspace
        responsibilities={[card()]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "School lunch" }));

    expect(screen.getByText("What is this card for?")).toBeVisible();
    expect(screen.getByText("Pack and keep lunch ready for the school day.")).toBeVisible();
    expect(screen.getByText("Fogging Estandards")).toBeVisible();
    expect(screen.getByText("Lunch is packed before school starts.")).toBeVisible();
    expect(screen.getByText(/Assigned to Unassigned/i)).toBeVisible();
  });

  it("does not clip long card-back purpose or standards text", () => {
    const longPurpose =
      "This card covers every planning step, every reminder, every handoff, and every follow-through detail that needs to remain readable on a narrow phone screen without disappearing behind a fixed-height clamp.";
    const longStandard =
      "Done means the household can see what happened, what remains, and what needs a later check without losing the rest of this sentence on mobile.";

    render(
      <CardWorkspace
        responsibilities={[
          card({
            sourceDefinition: longPurpose,
            sourceMinimumStandard: longStandard
          })
        ]}
        selectedPersona={selectedPersona}
        view="distribute"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "School lunch" }));

    expect(screen.getByText(longPurpose)).not.toHaveClass("line-clamp-5");
    expect(screen.getByText(longStandard)).not.toHaveClass("line-clamp-5");
  });

  it("renders the current persona's cards as a filterable image-first gallery", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440010",
            title: "Lunch",
            boardLane: "player_1"
          }),
          card({ id: "550e8400-e29b-41d4-a716-446655440011", title: "Bills", boardLane: "player_2" })
        ]}
        selectedPersona={selectedPersona}
        view="yourCards"
      />
    );

    expect(screen.getByRole("heading", { name: "Your Deck" })).toBeVisible();
    expect(
      screen.getByText("Find the cards that have been played to you here.")
    ).toBeVisible();
    expect(screen.getByText("Lunch")).toBeVisible();
    expect(screen.queryByText("Bills")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /search your deck/i }))
      .toBeVisible();
    expect(screen.getByTestId("your-card-gallery")).toHaveClass("grid");
    expect(screen.getByAltText("Lunch cover")).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/meals-kids-school-lunch.png"
    );
  });

  it("uses an accessible fallback cover without duplicating the visible card title", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440012",
            sourceCoverAssetPath: null,
            title: "Lunch",
            boardLane: "player_1"
          })
        ]}
        selectedPersona={selectedPersona}
        view="yourCards"
      />
    );

    expect(screen.getByRole("img", { name: "Lunch cover" })).toBeVisible();
    expect(screen.getByText("Card cover")).toBeVisible();
    expect(screen.getAllByText("Lunch")).toHaveLength(1);
  });

  it("flips a Your Deck item without opening the old detail flow", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440012",
            title: "Lunch",
            boardLane: "player_1",
            currentAssignments: [
              {
                personaKey: "alex",
                role: "accountable_owner",
                scope: "outcome"
              }
            ]
          })
        ]}
        selectedPersona={selectedPersona}
        view="yourCards"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lunch" }));

    expect(screen.getByText("What is this card for?")).toBeVisible();
    expect(screen.getByText("Fogging Estandards")).toBeVisible();
    expect(screen.getByText(/Assigned to Alex/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View or update agreement" })
    ).toHaveAttribute(
      "href",
      "/app/responsibilities/550e8400-e29b-41d4-a716-446655440012"
    );
  });

  it("shows ownership phases, hidden effort, and review timing on card backs", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({
            boardLane: "player_1",
            hiddenEffortKeys: ["noticing", "planning"],
            nextReviewAt: "2026-08-01T12:00:00.000Z",
            sourceConception: "Notice supplies running low.",
            sourceExecution: "Restock and put everything away.",
            sourcePlanning: "Make the list and choose a shopping window."
          })
        ]}
        selectedPersona={selectedPersona}
        view="yourCards"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "School lunch" }));

    expect(screen.getByText("Notice supplies running low.")).toBeVisible();
    expect(screen.getByText("Make the list and choose a shopping window.")).toBeVisible();
    expect(screen.getByText("Restock and put everything away.")).toBeVisible();
    expect(screen.getByText("Noticing")).toBeVisible();
    expect(screen.getByText("Review by Aug 1, 2026")).toBeVisible();
  });

  it("renders the grouped board as card buckets", () => {
    render(
      <CardWorkspace
        responsibilities={[
          card({ id: "550e8400-e29b-41d4-a716-446655440020", title: "Lunch", boardLane: "player_1" }),
          card({ id: "550e8400-e29b-41d4-a716-446655440021", title: "Bills", boardLane: "player_2" }),
          card({ id: "550e8400-e29b-41d4-a716-446655440022", title: "Garden", boardLane: "not_in_play" }),
          card({ id: "550e8400-e29b-41d4-a716-446655440023", title: "Old plan", boardLane: "trimmed" }),
          card({ id: "550e8400-e29b-41d4-a716-446655440024", title: "Unclear", boardLane: "cards_of_concern" })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    const board = screen.getByTestId("card-board");
    expect(board.className).not.toContain("overflow-x-auto");
    expect(
      screen.getByText("Organize assigned cards by person or status.")
    ).toBeVisible();
    expect(screen.getByTestId("primary-board-lanes")).toHaveClass(
      "lg:grid-cols-2"
    );
    expect(screen.getByTestId("secondary-board-lanes")).toHaveClass(
      "xl:grid-cols-1"
    );
    expect(within(board).getByRole("heading", { name: "Alex" })).toBeVisible();
    expect(within(board).getByRole("heading", { name: "Max" })).toBeVisible();
    expect(within(board).getByRole("heading", { name: "Saved for Later" })).toBeVisible();
    expect(within(board).getByRole("heading", { name: "Not Applicable" })).toBeVisible();
    expect(within(board).queryByRole("heading", { name: "Unassigned" }))
      .not.toBeInTheDocument();
    expect(within(board).queryByText("Unclear")).not.toBeInTheDocument();
    expect(within(board).getByAltText("Lunch cover")).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/meals-kids-school-lunch.png"
    );
    expect(board.className).not.toContain("table");
  });

  it("shows shared-owner agreements in a derived Shared section and work map", () => {
    const responsibilities = [
      card({
        id: "550e8400-e29b-41d4-a716-446655440030",
        title: "Shared plan",
        boardLane: "player_1",
        currentAssignments: [
          { personaKey: "alex", role: "shared_owner", scope: "part" },
          { personaKey: "max", role: "shared_owner", scope: "part" }
        ]
      }),
      card({
        id: "550e8400-e29b-41d4-a716-446655440031",
        title: "Alex plan",
        boardLane: "player_1",
        currentAssignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ]
      })
    ];

    render(
      <CardWorkspace
        responsibilities={responsibilities}
        selectedPersona={selectedPersona}
        view="board"
        workMap={computeHouseholdWorkMap({
          asOf: "2026-07-16T00:00:00.000Z",
          responsibilities
        })}
      />
    );

    const shared = screen.getByTestId("shared-board-lane");
    const primary = screen.getByTestId("primary-board-lanes");

    expect(within(shared).getByRole("heading", { name: "Shared" })).toBeVisible();
    expect(within(shared).getByText("Shared plan")).toBeVisible();
    expect(within(primary).queryByText("Shared plan")).not.toBeInTheDocument();
    expect(within(primary).getByText("Alex plan")).toBeVisible();
    expect(screen.getByTestId("board-work-map")).toBeVisible();
    expect(
      screen.getAllByText("Shared-owned").map((label) =>
        label.parentElement?.querySelector("dd")?.textContent
      )
    ).toEqual(["1", "1"]);
  });

  it("lets board cards return to the unclassified deal pool", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({
            id: "550e8400-e29b-41d4-a716-446655440020",
            title: "Lunch",
            boardLane: "player_1"
          })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Lunch" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Return to Deal" }));

    await waitFor(() =>
      expect(onDistribute).toHaveBeenCalledWith({
        bucket: "unassigned",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440020"
      })
    );
  });

  it("lets the Move menu escape the card while media content stays clipped", () => {
    render(
      <CardWorkspace
        onDistribute={vi.fn().mockResolvedValue(undefined)}
        responsibilities={[
          card({ title: "Lunch", boardLane: "player_1" })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    const moveButton = screen.getByRole("button", { name: "Move Lunch" });
    const compactCard = moveButton.closest("article");
    expect(compactCard).toHaveClass("overflow-visible");
    expect(
      compactCard?.querySelector("[data-testid='compact-card-content']")
    ).toHaveClass("overflow-hidden");

    fireEvent.click(moveButton);
    expect(screen.getByRole("menu", { name: "Move Lunch" })).toHaveClass(
      "absolute"
    );
  });

  it("shows card-level pending and error feedback for Board moves", async () => {
    let rejectMove: ((error: Error) => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectMove = reject;
        })
    );

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "Lunch", boardLane: "player_1" })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Lunch" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Max" }));

    const moveButton = screen.getByRole("button", { name: "Move Lunch" });
    expect(moveButton).toHaveFocus();
    expect(moveButton).toHaveAttribute("aria-disabled", "true");
    expect(moveButton).toHaveTextContent("Moving...");
    rejectMove?.(new Error("save failed"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lunch could not be moved. Nothing changed."
    );
    expect(moveButton).toHaveAttribute("aria-disabled", "false");
    expect(moveButton).toHaveFocus();
  });

  it("offers Undo for the last successful Board move", async () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({ title: "Lunch", boardLane: "player_1" })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    const moveButton = screen.getByRole("button", { name: "Move Lunch" });
    fireEvent.click(moveButton);
    fireEvent.click(screen.getByRole("menuitem", { name: "Max" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Lunch moved to Max."
    );
    const undoButton = screen.getByRole("button", { name: "Undo last move" });
    expect(undoButton).toHaveFocus();
    fireEvent.click(undoButton);

    await waitFor(() =>
      expect(onDistribute).toHaveBeenLastCalledWith({
        bucket: "alex",
        responsibilityId: "550e8400-e29b-41d4-a716-446655440000"
      })
    );
    expect(screen.queryByRole("button", { name: "Undo last move" }))
      .not.toBeInTheDocument();
    const undoStatus = screen.getByRole("status");
    expect(undoStatus).toHaveTextContent("Lunch restored to Alex.");
    await waitFor(() => expect(undoStatus).toHaveFocus());
  });

  it("focuses the persistent Undo action after a successful server refresh moves the card", async () => {
    let resolveMove: (() => void) | undefined;
    const onDistribute = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMove = resolve;
        })
    );
    const props = {
      onDistribute,
      selectedPersona,
      view: "board" as const
    };
    const { rerender } = render(
      <CardWorkspace
        {...props}
        responsibilities={[card({ title: "Lunch", boardLane: "player_1" })]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Lunch" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Max" }));
    await waitFor(() => expect(onDistribute).toHaveBeenCalledOnce());

    rerender(
      <CardWorkspace
        {...props}
        responsibilities={[card({ title: "Lunch", boardLane: "player_2" })]}
      />
    );
    resolveMove?.();

    const undoButton = await screen.findByRole("button", {
      name: "Undo last move"
    });
    await waitFor(() => expect(undoButton).toHaveFocus());
  });

  it("keeps empty Board lanes compact on mobile", () => {
    render(
      <CardWorkspace
        responsibilities={[]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    const alexEmpty = screen.getByTestId("empty-board-lane-alex");
    expect(alexEmpty).not.toHaveClass("min-h-24");
    expect(alexEmpty.closest("details")?.className).not.toContain("lg:min-h");
  });

  it("routes owned board cards to ownership details instead of a quick move", () => {
    const onDistribute = vi.fn().mockResolvedValue(undefined);
    const responsibilityId = "550e8400-e29b-41d4-a716-446655440025";

    render(
      <CardWorkspace
        onDistribute={onDistribute}
        responsibilities={[
          card({
            id: responsibilityId,
            title: "Shared school plan",
            boardLane: "player_1",
            currentAssignments: [
              {
                personaKey: "alex",
                role: "accountable_owner",
                scope: "outcome"
              },
              {
                personaKey: "max",
                role: "helper",
                scope: "support"
              }
            ]
          })
        ]}
        selectedPersona={selectedPersona}
        view="board"
      />
    );

    const moveButton = screen.getByRole("button", {
      name: "Move Shared school plan"
    });
    expect(moveButton).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.click(moveButton);
    expect(
      screen.getByRole("menuitem", { name: "Update ownership details" })
    ).toHaveAttribute(
      "href",
      `/app/responsibilities/${responsibilityId}#ownership-details`
    );
    expect(
      screen.queryByRole("menuitem", { name: "Return to Deal" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
    expect(onDistribute).not.toHaveBeenCalled();
  });
});
