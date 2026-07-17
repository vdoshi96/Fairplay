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
    coverAssetPath: null,
    failureMessage: null,
    acceptedResponsibilityId: null,
    createdAt: "2026-05-05T12:00:00.000Z",
    updatedAt: "2026-05-05T12:00:00.000Z"
  }
];

function expectOptimizedLocalImage(image: HTMLElement, sourcePath: string) {
  expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
    sourcePath
  );
  expect(image).toHaveAttribute("srcset");
}

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
    expect(
      screen
        .getByTestId("library-shelf-background")
        .style.getPropertyValue("--fp-background-mobile")
    ).toContain("library-shelf-768.avif");
    expect(
      screen.getByRole("button", { name: "Ask Greg" })
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
      .toBeNull();
    expect(screen.getByRole("region", { name: "AI drafts" })).toBeVisible();
    expect(screen.getByText("Laundry reset")).toBeVisible();
  });

  it("searches cards and flips one for purpose without offering a Library put-in-play workflow", async () => {
    render(
      <CardLibrary
        aiDrafts={aiDrafts}
        templates={templates}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Learn this feature" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /search cards/i }))
      .not.toHaveAttribute("data-guide-id");

    await userEvent.type(screen.getByRole("searchbox", { name: /search cards/i }), "auto");

    const autoCard = screen.getByRole("article", { name: /auto/i });
    expect(within(autoCard).getByText("Vehicle responsibility summary.")).toBeVisible();
    expectOptimizedLocalImage(
      within(autoCard).getByRole("img", { name: /auto cover/i }),
      "/assets/fairplay/cards/auto.png"
    );
    expect(within(autoCard).queryByRole("button", { name: "Alex" }))
      .not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-guide-id="library-put-in-play"]'))
      .toHaveLength(0);
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();
    expect(screen.getByText("Laundry reset")).toBeVisible();

    await userEvent.click(within(autoCard).getByRole("button", { name: /flip auto/i }));
    expect(within(autoCard).getByText("What is this card for?")).toBeVisible();
    expect(within(autoCard).getByText("Fogging Estandards")).toBeVisible();
    expect(within(autoCard).queryByText("Choose lane")).not.toBeInTheDocument();
  });

  it("shows the full catalog without a separate unclassified-card shelf", () => {
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    expect(screen.getByRole("article", { name: "Auto" })).toBeVisible();
    expect(screen.getByRole("article", { name: "Homework" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Cards ready to deal" }))
      .not.toBeInTheDocument();
  });

  it("filters by source label while preserving stable card presentation", async () => {
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    expect(screen.getByLabelText("Card labels")).not.toHaveAttribute(
      "data-guide-id"
    );

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await userEvent.click(screen.getByRole("button", { name: "Kids" }));

    expect(screen.getByRole("button", { name: "Kids" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Kids" })).toHaveClass(
      "min-h-11"
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    expect(screen.getByText("Homework")).toBeVisible();
    expect(screen.queryByText("Auto")).not.toBeInTheDocument();
    expect(screen.getByText("Laundry reset")).toBeVisible();
    expect(screen.getByRole("article", { name: /homework/i })).toHaveClass(
      "min-h-[430px]",
      "min-w-0",
      "overflow-hidden"
    );
  });

  it("keeps long source-card text inside the card frame", () => {
    const longTitle =
      "Cleaning conception planning pushing boxes and seasonal storage handoff with a very long title";
    const longTemplates: CardTemplateSummary[] = [
      {
        id: "tpl_long",
        slug: "long-card",
        title: longTitle,
        labels: ["Home", "Daily Grind"],
        summary:
          "This deliberately long summary checks that library cards clamp text instead of letting words escape the card frame on desktop or mobile layouts.",
        coverAssetPath: "/assets/fairplay/cards/auto.png",
        defaultLane: "not_in_play"
      }
    ];

    render(<CardLibrary templates={longTemplates} />);

    const cardArticle = screen.getByRole("article", { name: longTitle });
    const heading = within(cardArticle).getByRole("heading", { name: longTitle });

    expect(cardArticle).toHaveClass("min-w-0", "overflow-hidden");
    expect(heading).toHaveClass("line-clamp-2", "[overflow-wrap:anywhere]");
    expect(
      within(cardArticle).getByText(/deliberately long summary/i)
    ).toHaveClass("line-clamp-3", "[overflow-wrap:anywhere]");
    expect(within(cardArticle).queryByText("Choose lane")).not.toBeInTheDocument();
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
    expectOptimizedLocalImage(
      screen.getByRole("img", { name: "Adult Friendships (Alex) cover" }),
      "/assets/fairplay/cards/adult-friendships-player-1.png"
    );
    expectOptimizedLocalImage(
      screen.getByRole("img", { name: "Adult Friendships (Max) cover" }),
      "/assets/fairplay/cards/adult-friendships-player-2.png"
    );
  });

  it("does not expose the old dummy Library guide or onboarding preview workflow", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    expect(
      screen.queryByRole("region", { name: "Practice a card" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ask Greg" })
    ).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Library guide" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Practice draft/i)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
