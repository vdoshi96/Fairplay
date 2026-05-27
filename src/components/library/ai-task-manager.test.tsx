import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AiCardDraftDetail,
  AiCardDraftSummary
} from "@/contracts/ai-card-drafts";
import { AiTaskManager } from "./ai-task-manager";

const routerPush = vi.hoisted(() => vi.fn());
const routerRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    refresh: routerRefresh
  })
}));

const now = "2026-05-05T12:00:00.000Z";
const draftIds = {
  processing: "550e8400-e29b-41d4-a716-446655440010",
  failed: "550e8400-e29b-41d4-a716-446655440011",
  ready: "550e8400-e29b-41d4-a716-446655440012",
  accepted: "550e8400-e29b-41d4-a716-446655440013",
  canceled: "550e8400-e29b-41d4-a716-446655440014"
};

function draft(
  overrides: Partial<AiCardDraftSummary> & Pick<AiCardDraftSummary, "id" | "status">
): AiCardDraftSummary {
  return {
    id: overrides.id,
    title: overrides.title ?? null,
    promptPreview: overrides.promptPreview ?? "Laundry keeps slipping after school.",
    status: overrides.status,
    generationStage: overrides.generationStage ?? "queued",
    sourceInputType: overrides.sourceInputType ?? "text",
    summary: overrides.summary ?? null,
    areaKeys: overrides.areaKeys ?? [],
    hiddenEffortKeys: overrides.hiddenEffortKeys ?? [],
    cadence: overrides.cadence ?? null,
    coverAssetPath: overrides.coverAssetPath ?? null,
    failureMessage: overrides.failureMessage ?? null,
    acceptedResponsibilityId: overrides.acceptedResponsibilityId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function detail(overrides: Partial<AiCardDraftDetail> = {}): AiCardDraftDetail {
  return {
    ...draft({
      id: overrides.id ?? draftIds.ready,
      status: overrides.status ?? "ready",
      generationStage: overrides.generationStage ?? "ready",
      title: overrides.title ?? "Laundry reset",
      summary: overrides.summary ?? "Keep laundry moving from hamper to folded.",
      areaKeys: overrides.areaKeys ?? ["home"],
      hiddenEffortKeys: overrides.hiddenEffortKeys ?? ["planning"],
      cadence: overrides.cadence ?? "weekly"
    }),
    inputText: overrides.inputText ?? "Laundry is piling up.",
    definition: overrides.definition ?? "Own the laundry flow.",
    conception: overrides.conception ?? "Notice hampers before they overflow.",
    planning: overrides.planning ?? "Start loads when there is enough time.",
    execution: overrides.execution ?? "Wash, dry, fold, and put away.",
    minimumStandard: overrides.minimumStandard ?? "Laundry is folded by Sunday."
  };
}

const reuseCandidate = {
  id: "550e8400-e29b-41d4-a716-446655440020",
  score: 0.76,
  title: "Lunch packing",
  summary: "Keep school lunches packed before the morning rush.",
  areaKeys: ["kids"],
  hiddenEffortKeys: ["planning"],
  cadence: "weekly",
  definition: "Own lunch packing from groceries to packed bags.",
  conception: "Notice the lunch calendar and snack supply.",
  planning: "Plan groceries and containers before the school week.",
  execution: "Pack lunches and place them where kids can grab them.",
  minimumStandard: "Lunches are ready before school.",
  sourceCoverAssetPath: `/api/ai-card-drafts/${draftIds.ready}/cover`,
  reuseCount: 3
};

describe("AiTaskManager", () => {
  beforeEach(() => {
    routerPush.mockReset();
    routerRefresh.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens text-only capture controls from the Greg button", async () => {
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ask Greg" })
    );

    expect(screen.getByTestId("ai-task-manager")).toHaveClass(
      "min-w-0",
      "max-w-full"
    );
    expect(screen.getByTestId("greg-taskmaster-control")).toHaveClass(
      "grid",
      "justify-items-center"
    );
    expect(screen.getByTestId("greg-taskmaster-avatar")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/greg-taskmaster-avatar.png"
    );
    expect(screen.queryByTestId("little-alex-horne-sidekick-image"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("hi im little alex horne")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-capture-sheet")).toHaveClass(
      "min-w-0",
      "max-w-full",
      "overflow-hidden"
    );
    expect(screen.getByRole("region", { name: "Capture AI card draft" })).toBeVisible();
    expect(screen.getByLabelText("Describe the card")).toHaveClass(
      "w-full",
      "min-w-0",
      "max-w-full"
    );
    expect(screen.queryByRole("button", { name: "Start recording" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
  });

  it("can hide the built-in Greg avatar when the page already renders Greg", () => {
    render(<AiTaskManager drafts={[]} showGregAvatar={false} />);

    expect(screen.getByRole("button", { name: "Ask Greg" })).toBeVisible();
    expect(screen.queryByTestId("greg-taskmaster-avatar")).not.toBeInTheDocument();
  });

  it("wraps long Ask Greg draft content instead of forcing mobile overflow", () => {
    const longTitle =
      "SupercalifragilisticexpialidociousSchoolLunchPlanningWithoutSpaces";
    const longSummary =
      "ThisIsAContinuousLongGeneratedResponseThatNeedsToWrapInsideTheMobileAskGregPanelWithoutClippingOrHorizontalOverflow";

    render(
      <AiTaskManager
        drafts={[
          draft({
            id: draftIds.ready,
            status: "ready",
            generationStage: "ready",
            title: longTitle,
            summary: longSummary,
            failureMessage: longSummary,
            coverAssetPath: `/api/ai-card-drafts/${draftIds.ready}/cover`
          })
        ]}
      />
    );

    expect(screen.getByTestId("ai-card-tracker")).toHaveClass(
      "min-w-0",
      "max-w-full",
      "overflow-hidden"
    );
    const draftCard = screen.getByTestId("ai-draft-card");
    expect(draftCard).toHaveClass("min-w-0", "max-w-full");
    expect(within(draftCard).getByText(longTitle)).toHaveClass(
      "[overflow-wrap:anywhere]"
    );
    expect(within(draftCard).getByText(longTitle)).not.toHaveClass("truncate");
    within(draftCard)
      .getAllByText(longSummary)
      .forEach((node) =>
        expect(node).toHaveClass("[overflow-wrap:anywhere]")
      );
  });

  it("shows processing, failed, ready, and accepted drafts with status-specific actions", () => {
    render(
      <AiTaskManager
        drafts={[
          draft({
            id: draftIds.processing,
            status: "processing",
            generationStage: "structuring",
            title: "Lunch packing"
          }),
          draft({
            id: draftIds.failed,
            status: "failed",
            generationStage: "failed",
            failureMessage: "The model timed out."
          }),
          draft({
            id: draftIds.ready,
            status: "ready",
            generationStage: "ready",
            title: "Laundry reset",
            coverAssetPath: `/api/ai-card-drafts/${draftIds.ready}/cover`,
            summary: "Keep the laundry moving from hamper to folded."
          }),
          draft({
            id: draftIds.accepted,
            status: "accepted",
            generationStage: "ready",
            title: "Permission slips",
            acceptedResponsibilityId: "550e8400-e29b-41d4-a716-446655440090"
          })
        ]}
      />
    );

    expect(screen.getByRole("region", { name: "AI drafts" })).toBeVisible();
    expect(screen.getAllByText("Generating").length).toBeGreaterThan(0);
    expect(screen.getByText("Generation failed")).toBeVisible();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("Accepted")).toBeVisible();

    const failedDraft = screen.getByRole("article", { name: /failed draft/i });
    expect(within(failedDraft).getByRole("button", { name: "Retry" })).toBeVisible();
    expect(within(failedDraft).getByRole("button", { name: "Remove" })).toBeVisible();
    expect(within(failedDraft).queryByRole("button", { name: "Cancel" }))
      .not.toBeInTheDocument();

    const readyDraft = screen.getByRole("article", { name: /laundry reset/i });
    expect(
      within(readyDraft).getByRole("img", { name: "Generated cover for Laundry reset" })
    ).toHaveAttribute("src", `/api/ai-card-drafts/${draftIds.ready}/cover`);
    expect(within(readyDraft).getByRole("button", { name: "Review" })).toBeVisible();
    expect(within(readyDraft).getByRole("button", { name: "Add to Board" })).toBeVisible();
    expect(within(readyDraft).getByRole("button", { name: "Discard" })).toBeVisible();
  });

  it("submits text captures to the draft API and refreshes the library", async () => {
    const fetchMock = vi.fn(async (...args: [string, RequestInit?]) => {
      const [url] = args;
      if (url === "/api/ai-card-drafts/reuse-candidates") {
        return {
          ok: true,
          json: async () => ({ candidates: [] })
        };
      }

      return {
        ok: true,
        json: async () => ({ id: draftIds.processing })
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ask Greg" })
    );
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts/reuse-candidates",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      inputText: "Make a card for packing lunches."
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      inputText: "Make a card for packing lunches."
    });
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("offers a reusable generated card before calling generation", async () => {
    const createdResponsibilityId = "550e8400-e29b-41d4-a716-446655440091";
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/ai-card-drafts/reuse-candidates") {
        return {
          ok: true,
          json: async () => ({ candidates: [reuseCandidate] })
        };
      }

      if (
        url === `/api/ai-card-drafts/reuse-candidates/${reuseCandidate.id}/accept`
      ) {
        return {
          ok: true,
          json: async () => ({ id: createdResponsibilityId })
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Ask Greg" }));
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    const suggestion = await screen.findByRole("region", {
      name: "Reusable AI card suggestion"
    });
    expect(within(suggestion).getByText("Reusable card")).toBeVisible();
    expect(within(suggestion).getByText("Lunch packing")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await userEvent.click(
      within(suggestion).getByRole("button", { name: "Use this card" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/reuse-candidates/${reuseCandidate.id}/accept`,
        { method: "POST" }
      )
    );
    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith(
      `/app/responsibilities/${createdResponsibilityId}`
    );
  });

  it("lets users reject a reusable card and generate a new draft", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/ai-card-drafts/reuse-candidates") {
        return {
          ok: true,
          json: async () => ({ candidates: [reuseCandidate] })
        };
      }

      if (url === "/api/ai-card-drafts") {
        return {
          ok: true,
          json: async () =>
            detail({
              id: draftIds.ready,
              title: "Custom lunch system",
              inputText: "Make a card for packing lunches."
            })
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Ask Greg" }));
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));
    const suggestion = await screen.findByRole("region", {
      name: "Reusable AI card suggestion"
    });

    await userEvent.click(
      within(suggestion).getByRole("button", { name: "Generate new" })
    );

    expect(await screen.findByText("Custom lunch system")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("clears the prompt and shows an independent queued request while create is pending", async () => {
    let resolveCreate: (response: Response) => void = () => {};
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/ai-card-drafts/reuse-candidates") {
        return Promise.resolve(
          new Response(JSON.stringify({ candidates: [] }), {
            status: 200,
            headers: { "content-type": "application/json" }
          })
        );
      }

      return new Promise<Response>((resolve) => {
        resolveCreate = resolve;
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ask Greg" })
    );
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(screen.getByLabelText("Describe the card")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
    const queuedDraft = screen.getByRole("article", {
      name: /make a card for packing lunches/i
    });
    expect(within(queuedDraft).getByText("Queued")).toBeVisible();

    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for backpack papers."
    );
    expect(screen.getByRole("button", { name: "Create draft" })).toBeEnabled();

    resolveCreate(
      new Response(
        JSON.stringify(
          detail({
            id: draftIds.ready,
            title: "Lunch packing",
            inputText: "Make a card for packing lunches."
          })
        ),
        { status: 201, headers: { "content-type": "application/json" } }
      )
    );

    expect(await screen.findByText("Lunch packing")).toBeVisible();
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows safe generation failure JSON and refreshes so failed drafts can appear", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/ai-card-drafts/reuse-candidates") {
        return {
          ok: true,
          json: async () => ({ candidates: [] })
        };
      }

      return {
        ok: false,
        json: async () => ({
          error: "AI card draft generation failed.",
          code: "GENERATION_FAILED",
          draftId: draftIds.failed,
          requestId: "fp_ai_test"
        })
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ask Greg" })
    );
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(
      (await screen.findAllByText("AI card draft generation failed. Reference fp_ai_test."))
        .length
    ).toBeGreaterThan(0);
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("lets failed, canceled, and unwanted ready drafts be removed without trapping the tracker", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (
        url === `/api/ai-card-drafts/${draftIds.failed}` &&
        init?.method === "DELETE"
      ) {
        return {
          ok: true,
          json: async () => ({ ok: true })
        };
      }

      if (
        url === `/api/ai-card-drafts/${draftIds.canceled}` &&
        init?.method === "DELETE"
      ) {
        return {
          ok: true,
          json: async () => ({ ok: true })
        };
      }

      if (
        url === `/api/ai-card-drafts/${draftIds.ready}` &&
        init?.method === "DELETE"
      ) {
        return {
          ok: true,
          json: async () => ({ ok: true })
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AiTaskManager
        drafts={[
          draft({
            id: draftIds.failed,
            status: "failed",
            generationStage: "failed",
            promptPreview: "Recycling task request",
            failureMessage: "AI card draft generation failed."
          }),
          draft({
            id: draftIds.canceled,
            status: "canceled",
            generationStage: "failed",
            promptPreview: "Canceled recycling task request",
            failureMessage: "AI card draft generation failed."
          }),
          draft({
            id: draftIds.ready,
            status: "ready",
            generationStage: "ready",
            title: "Generated recycling plan",
            summary: "Generated text looks wrong."
          })
        ]}
      />
    );

    const failedDraft = screen.getByRole("article", {
      name: /recycling task request failed draft/i
    });
    expect(within(failedDraft).getByRole("button", { name: "Retry" })).toBeVisible();
    expect(within(failedDraft).getByRole("button", { name: "Remove" })).toBeVisible();
    expect(within(failedDraft).queryByRole("button", { name: "Cancel" }))
      .not.toBeInTheDocument();

    const canceledDraft = screen.getByRole("article", {
      name: /canceled recycling task request canceled draft/i
    });
    expect(within(canceledDraft).getByRole("button", { name: "Remove" })).toBeVisible();
    expect(within(canceledDraft).queryByRole("button", { name: "Retry" }))
      .not.toBeInTheDocument();
    expect(within(canceledDraft).queryByRole("button", { name: "Cancel" }))
      .not.toBeInTheDocument();

    await userEvent.click(within(failedDraft).getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/${draftIds.failed}`,
        expect.objectContaining({ method: "DELETE" })
      )
    );
    expect(
      screen.queryByRole("article", {
        name: /recycling task request failed draft/i
      })
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(canceledDraft).getByRole("button", { name: "Remove" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/${draftIds.canceled}`,
        expect.objectContaining({ method: "DELETE" })
      )
    );
    expect(
      screen.queryByRole("article", {
        name: /canceled recycling task request canceled draft/i
      })
    ).not.toBeInTheDocument();

    const readyDraft = screen.getByRole("article", {
      name: /generated recycling plan ready draft/i
    });
    await userEvent.click(within(readyDraft).getByRole("button", { name: "Discard" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/${draftIds.ready}`,
        expect.objectContaining({ method: "DELETE" })
      )
    );
    expect(
      screen.queryByRole("article", {
        name: /generated recycling plan ready draft/i
      })
    ).not.toBeInTheDocument();
    expect(routerRefresh).toHaveBeenCalledTimes(3);
  });

  it("updates a failed draft after retry succeeds without waiting for refreshed props", async () => {
    const failedDraft = draft({
      id: draftIds.failed,
      status: "failed",
      generationStage: "failed",
      failureMessage: "The model timed out."
    });
    const retriedDetail = detail({
      id: draftIds.failed,
      title: "Lunch packing",
      inputText: "Make a card for packing lunches."
    });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (
        url === `/api/ai-card-drafts/${draftIds.failed}/retry` &&
        init?.method === "POST"
      ) {
        return {
          ok: true,
          json: async () => retriedDetail
        };
      }

      if (url === `/api/ai-card-drafts/${draftIds.failed}` && !init) {
        return {
          ok: true,
          json: async () => retriedDetail
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[failedDraft]} />);

    await userEvent.click(
      within(screen.getByRole("article", { name: /failed draft/i })).getByRole(
        "button",
        { name: /laundry keeps slipping/i }
      )
    );
    await userEvent.click(
      within(screen.getByRole("region", { name: "Review AI card draft" })).getByRole(
        "button",
        { name: "Retry" }
      )
    );

    expect(await screen.findByLabelText("Draft title")).toHaveValue("Lunch packing");
    expect(screen.getByText("Make a card for packing lunches.")).toBeVisible();
    expect(screen.queryByText("The model timed out.")).not.toBeInTheDocument();
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("fetches text detail, saves edits, and exposes text-only actions", async () => {
    const draftDetail = detail();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === `/api/ai-card-drafts/${draftIds.ready}` && !init) {
        return {
          ok: true,
          json: async () => draftDetail
        };
      }

      if (url === `/api/ai-card-drafts/${draftIds.ready}` && init?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({
            ...draftDetail,
            title: "Laundry command center"
          })
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AiTaskManager
        drafts={[
          draft({
            id: draftIds.ready,
            status: "ready",
            generationStage: "ready",
            title: "Laundry reset",
            coverAssetPath: `/api/ai-card-drafts/${draftIds.ready}/cover`,
            summary: "Keep the laundry moving from hamper to folded."
          })
        ]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(await screen.findByLabelText("Draft title")).toHaveValue("Laundry reset");
    expect(screen.getByTestId("ai-review-panel")).toHaveClass(
      "min-w-0",
      "max-w-full",
      "overflow-hidden"
    );
    const reviewPanel = screen.getByRole("region", { name: "Review AI card draft" });
    expect(
      within(reviewPanel).getByRole("img", { name: "Generated cover for Laundry reset" })
    ).toHaveAttribute("src", `/api/ai-card-drafts/${draftIds.ready}/cover`);
    expect(screen.getByText("Original prompt")).toBeVisible();
    expect(screen.getByText("Laundry is piling up.")).toBeVisible();
    expect(screen.getByLabelText("Definition")).toHaveValue("Own the laundry flow.");
    expect(screen.getByLabelText("Conception")).toHaveValue(
      "Notice hampers before they overflow."
    );
    expect(screen.getByLabelText("Planning")).toHaveValue(
      "Start loads when there is enough time."
    );
    expect(screen.getByLabelText("Execution")).toHaveValue(
      "Wash, dry, fold, and put away."
    );
    expect(screen.getByLabelText("Fogging Estandards")).toHaveValue(
      "Laundry is folded by Sunday."
    );

    await userEvent.clear(screen.getByLabelText("Draft title"));
    await userEvent.type(screen.getByLabelText("Draft title"), "Laundry command center");
    await userEvent.clear(screen.getByLabelText("Area tags"));
    await userEvent.type(screen.getByLabelText("Area tags"), "home, kids");
    await userEvent.clear(screen.getByLabelText("Work type tags"));
    await userEvent.type(
      screen.getByLabelText("Work type tags"),
      "planning, follow_through"
    );
    await userEvent.selectOptions(screen.getByLabelText("Rhythm"), "daily");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/${draftIds.ready}`,
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) => url === `/api/ai-card-drafts/${draftIds.ready}` && init?.method === "PATCH"
    );
    expect(JSON.parse((patchCall?.[1] as RequestInit).body as string)).toMatchObject({
      title: "Laundry command center",
      areaKeys: ["home", "kids"],
      hiddenEffortKeys: ["planning", "follow_through"],
      cadence: "daily"
    });
    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Regenerate image" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Track for later" })).toBeDisabled();
  });
});
