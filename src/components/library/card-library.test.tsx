import { render, screen, waitFor, within } from "@testing-library/react";
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
      .not.toBeNull();
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
    expect(within(autoCard).queryByRole("button", { name: "Alex" }))
      .not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-guide-id="library-put-in-play"]'))
      .toHaveLength(0);
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();
    expect(screen.getByText("Laundry reset")).toBeVisible();

    await userEvent.click(within(autoCard).getByRole("button", { name: /flip auto/i }));
    expect(within(autoCard).getByText("What is this card for?")).toBeVisible();
    expect(within(autoCard).getByText("Fogging E-Standards")).toBeVisible();
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

    expect(screen.getByLabelText("Card labels")).toHaveAttribute(
      "data-guide-id",
      "library-labels"
    );

    await userEvent.click(screen.getByRole("button", { name: "Kids" }));

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

  it("generates a temporary dummy Library preview from the user request without creating a real card", async () => {
    let resolvePreview: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolvePreview = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <CardLibrary
        aiDrafts={aiDrafts}
        templates={templates}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));

    expect(screen.getByRole("dialog", { name: "Library guide" })).toBeVisible();
    expect(screen.getByText("Step 1 of 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Next required click: Start practice.")
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Start practice" })
    );

    const practiceRegion = screen.getByRole("region", {
      name: "Practice a card"
    });
    expect(practiceRegion).toBeVisible();
    expect(practiceRegion).toHaveClass(
      "z-[60]",
      "bg-[var(--fp-surface-strong)]"
    );
    expect(practiceRegion.className).not.toContain("bg-white");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("Practice card request"),
      "Make a card for the weekly backpack reset before school."
    );
    expect(
      screen.getByText("Next required click: Create practice draft.")
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Create practice draft" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts/onboarding-preview",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          inputText: "Make a card for the weekly backpack reset before school."
        })
      })
    );
    expect(
      screen.getByText("Creating a practice draft...")
    ).toBeVisible();

    resolvePreview(
      new Response(
        JSON.stringify({
          title: "Weekly backpack reset",
          summary: "Keep backpacks cleared, signed forms handled, and school items ready.",
          definition: "Reset each backpack before the next school day.",
          conception: "Notice forms, supplies, and items that need attention.",
          planning: "Pick a reset window and place needed items nearby.",
          execution: "Empty the bag, handle papers, and repack essentials.",
          minimumStandard: "Backpacks are ready before school starts."
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );

    expect(await screen.findByText("Practice draft created."))
      .toBeVisible();
    expect(screen.getByRole("region", { name: "Practice workspace" }))
      .toBeVisible();
    expect(screen.getByText(/Temporary drafts stay here/i))
      .toBeVisible();
    expect(screen.getByText("Weekly backpack reset")).toBeVisible();
    expect(
      screen.getByText("Keep backpacks cleared, signed forms handled, and school items ready.")
    ).toBeVisible();
    expect(screen.queryByText(/Lunch packing handoff/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("Next required click: Review practice draft.")
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Review draft" }));
    expect(screen.getByLabelText("Practice draft title")).toHaveValue(
      "Weekly backpack reset"
    );
    expect(screen.getByLabelText("Practice summary")).toHaveValue(
      "Keep backpacks cleared, signed forms handled, and school items ready."
    );

    await userEvent.clear(screen.getByLabelText("Practice draft title"));
    await userEvent.type(screen.getByLabelText("Practice draft title"), "Backpack launch");
    expect(
      screen.getByText("Next required click: Save practice edits.")
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Save edits" }));
    expect(screen.getByText("Practice edits saved.")).toBeVisible();
    expect(
      screen.getByText("Next required click: Preview on Board.")
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Preview on Board" }));
    expect(
      screen.getByText("Practice card is ready for Board. No real card was created.")
    ).toBeVisible();
    expect(screen.getByText("Board preview")).toBeVisible();
    expect(screen.getByText("Practice complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringMatching(/put-in-play|card-templates/),
        expect.anything()
      );
    });

    await userEvent.click(screen.getByRole("button", { name: "Clear practice" }));
    expect(screen.queryByRole("region", { name: "Practice workspace" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Board preview")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Next required click: Preview on Board.")
    ).not.toBeInTheDocument();
  });

  it("closes and resets dummy Library practice after guide Skip", async () => {
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Start practice" })
    );
    await userEvent.type(
      screen.getByLabelText("Practice card request"),
      "Make a card for the weekly backpack reset."
    );

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(
      screen.queryByRole("region", { name: "Practice a card" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ask Greg" })
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Start practice" })
    );

    expect(screen.getByLabelText("Practice card request")).toHaveValue("");
    expect(screen.queryByText(/weekly backpack reset/i)).not.toBeInTheDocument();
  });

  it("closes dummy Library practice after guide completion without hiding Greg", async () => {
    let resolvePreview: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolvePreview = resolve;
          })
      )
    );
    render(<CardLibrary aiDrafts={aiDrafts} templates={templates} />);

    await userEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Start practice" })
    );
    await userEvent.type(screen.getByLabelText("Practice card request"), "Lunch kits");
    await userEvent.click(screen.getByRole("button", { name: "Create practice draft" }));
    resolvePreview(
      new Response(
        JSON.stringify({
          title: "Lunch kits",
          summary: "Keep lunch supplies ready."
        }),
        { headers: { "content-type": "application/json" }, status: 200 }
      )
    );
    expect(await screen.findByText("Lunch kits")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Review draft" }));
    await userEvent.click(screen.getByRole("button", { name: "Save edits" }));
    await userEvent.click(screen.getByRole("button", { name: "Preview on Board" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.queryByRole("region", { name: "Practice a card" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ask Greg" })
    ).toBeVisible();
  });
});
