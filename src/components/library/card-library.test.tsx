import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type { CardTemplateSummary } from "@/contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";
import { CardLibrary } from "./card-library";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

const templates: CardTemplateSummary[] = [
  {
    id: "tpl_auto",
    slug: "auto",
    title: "Auto",
    labels: ["Out", "Daily Grind"],
    summary: "Vehicle responsibility summary.",
    coverAssetPath: "/assets/fairplay/cards/auto.png",
    defaultLane: "not_in_play"
  },
  {
    id: "tpl_homework",
    slug: "homework",
    title: "Homework",
    labels: ["Kids", "Home"],
    summary: "School follow-through.",
    coverAssetPath: "/assets/fairplay/cards/homework.png",
    defaultLane: "not_in_play"
  }
];

const aiDrafts: AiCardDraftSummary[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    title: "Laundry reset",
    promptPreview: "Laundry keeps slipping after school.",
    status: "ready",
    generationStage: "ready",
    sourceInputType: "text",
    summary: "Keep laundry moving from hamper to folded.",
    areaKeys: [],
    hiddenEffortKeys: [],
    cadence: null,
    failureMessage: null,
    acceptedResponsibilityId: null,
    createdAt: "2026-05-05T12:00:00.000Z",
    updatedAt: "2026-05-05T12:00:00.000Z"
  }
];

describe("CardLibrary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Greg avatar above source card filters without local Little Alex copy", () => {
    const { container } = render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    expect(screen.getByTestId("library-shelf-visual")).not.toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/library-shelf.png')"
    });
    expect(screen.getByTestId("library-shelf-background")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("library-shelf-background")).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/library-shelf.png')"
    });
    expect(
      screen.getByRole("button", { name: "Greg - The Taskmaster" })
    ).toBeVisible();
    expect(screen.getByTestId("greg-taskmaster-control")).toHaveClass(
      "grid",
      "justify-items-center"
    );
    expect(screen.getByTestId("greg-taskmaster-avatar")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/greg-taskmaster-avatar.png"
    );
    expect(screen.queryByText("hi im little alex horne")).not.toBeInTheDocument();
    expect(screen.queryByTestId("little-alex-horne-sidekick-image"))
      .not.toBeInTheDocument();
    expect(container.querySelector('[data-guide-id="library-ai-task-manager"]'))
      .not.toBeNull();
    expect(screen.getByRole("region", { name: "AI-created cards" })).toBeVisible();
    expect(screen.getByText("Laundry reset")).toBeVisible();
  });

  it("searches source cards and starts a household card from a template", async () => {
    const onCreateFromTemplate = vi.fn();
    render(
      <CardLibrary
        aiDrafts={aiDrafts}
        onCreateFromTemplate={onCreateFromTemplate}
        templates={templates}
      />
    );

    expect(
      screen.getByRole("button", { name: "Learn this feature" })
    ).toBeVisible();
    expect(screen.getByRole("searchbox", { name: /search cards/i })).toHaveAttribute(
      "data-guide-id",
      "library-search"
    );

    await userEvent.type(screen.getByRole("searchbox", { name: /search cards/i }), "auto");

    const autoCard = screen.getByRole("article", { name: /auto/i });
    expect(within(autoCard).getByText("Vehicle responsibility summary.")).toBeVisible();
    expect(within(autoCard).getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByRole("button", { name: /put Auto in play/i })).toHaveAttribute(
      "data-guide-id",
      "library-put-in-play"
    );
    expect(document.querySelectorAll('[data-guide-id="library-put-in-play"]'))
      .toHaveLength(1);
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();
    expect(screen.getByText("Laundry reset")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /put Auto in play/i }));

    expect(onCreateFromTemplate).toHaveBeenCalledWith("tpl_auto");
  });

  it("filters by source label while preserving stable card presentation", async () => {
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    expect(screen.getByLabelText("Source labels")).toHaveAttribute(
      "data-guide-id",
      "library-labels"
    );

    await userEvent.click(screen.getByRole("button", { name: "Kids" }));

    expect(screen.getByText("Homework")).toBeVisible();
    expect(screen.queryByText("Auto")).not.toBeInTheDocument();
    expect(screen.getByText("Laundry reset")).toBeVisible();
    expect(screen.getByRole("article", { name: /homework/i })).toHaveClass(
      "min-h-[420px]"
    );
  });

  it("renders duplicate personal seed cards with Alex and Max display labels", () => {
    const duplicatePersonalCards: CardTemplateSummary[] = FAIRPLAY_SOURCE_CARDS.filter(
      (card) =>
        card.slug === "adult-friendships-player-1" ||
        card.slug === "adult-friendships-player-2"
    ).map((card) => ({
      defaultLane: card.defaultLane,
      coverAssetPath: card.coverAssetPath,
      id: card.id,
      labels: card.labels,
      slug: card.slug,
      summary: card.summary,
      title: card.title
    }));

    render(<CardLibrary templates={duplicatePersonalCards} />);

    expect(screen.getByRole("article", { name: "Adult Friendships (Alex)" }))
      .toBeVisible();
    expect(screen.getByRole("article", { name: "Adult Friendships (Max)" }))
      .toBeVisible();
    expect(screen.queryByText(/Player 1|Player 2/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Adult Friendships (Alex) cover" })
    ).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/adult-friendships-player-1.png"
    );
    expect(
      screen.getByRole("img", { name: "Adult Friendships (Max) cover" })
    ).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/adult-friendships-player-2.png"
    );
  });

  it("walks through dummy Library practice without creating a real card", async () => {
    const onCreateFromTemplate = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CardLibrary
        aiDrafts={aiDrafts}
        onCreateFromTemplate={onCreateFromTemplate}
        templates={templates}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));

    expect(screen.getByRole("dialog", { name: "Library guide" })).toBeVisible();
    expect(screen.getByText("Step 1 of 4")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await userEvent.click(
      screen.getByRole("button", { name: "Start dummy Library workflow" })
    );

    const practiceRegion = screen.getByRole("region", {
      name: "Dummy Library practice"
    });
    expect(practiceRegion).toBeVisible();
    expect(practiceRegion).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(practiceRegion.className).not.toContain("bg-white");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("Dummy card request"),
      "Make a card for lunch packing handoffs."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create dummy draft" }));
    expect(screen.getByText("Dummy draft created from Greg capture.")).toBeVisible();
    expect(screen.getByRole("region", { name: "Temporary Library workspace" }))
      .toBeVisible();
    expect(screen.getByText(/temporary workspace keeps mock artifacts/i))
      .toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Review dummy draft" }));
    expect(screen.getByLabelText("Dummy draft title")).toHaveValue(
      "Lunch packing handoff"
    );

    await userEvent.clear(screen.getByLabelText("Dummy draft title"));
    await userEvent.type(screen.getByLabelText("Dummy draft title"), "Lunch kit reset");
    await userEvent.click(screen.getByRole("button", { name: "Save dummy edits" }));
    expect(screen.getByText("Dummy draft edits saved.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Put dummy card in play" }));
    expect(
      screen.getByText("Dummy card is ready for the Load Map. No real card was created.")
    ).toBeVisible();
    expect(screen.getByText("Mock Load Map artifact")).toBeVisible();
    expect(screen.getByText("Dummy Library workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(onCreateFromTemplate).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Clean up dummy workspace" }));
    expect(screen.queryByRole("region", { name: "Temporary Library workspace" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Mock Load Map artifact")).not.toBeInTheDocument();
  });
});
