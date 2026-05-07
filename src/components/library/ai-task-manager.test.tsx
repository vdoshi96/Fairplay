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
      screen.getByRole("button", { name: "Greg - The Taskmaster" })
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
    expect(screen.getByRole("region", { name: "Capture AI card draft" })).toBeVisible();
    expect(screen.getByLabelText("Describe the card")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start recording" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
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

    expect(screen.getByRole("region", { name: "AI-created cards" })).toBeVisible();
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
    expect(within(readyDraft).getByRole("button", { name: "Put in play" })).toBeVisible();
  });

  it("submits text captures to the draft API and refreshes the library", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: draftIds.processing })
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Greg - The Taskmaster" })
    );
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      inputText: "Make a card for packing lunches."
    });
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("clears the prompt and shows an independent queued request while create is pending", async () => {
    let resolveCreate: (response: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveCreate = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Greg - The Taskmaster" })
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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "AI card draft generation failed.",
        code: "GENERATION_FAILED",
        draftId: draftIds.failed,
        requestId: "fp_ai_test"
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Greg - The Taskmaster" })
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

  it("lets failed and canceled drafts be removed without trapping the tracker", async () => {
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
    expect(routerRefresh).toHaveBeenCalledTimes(2);
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
    expect(screen.getByLabelText("Minimum standard")).toHaveValue(
      "Laundry is folded by Sunday."
    );

    await userEvent.clear(screen.getByLabelText("Draft title"));
    await userEvent.type(screen.getByLabelText("Draft title"), "Laundry command center");
    await userEvent.clear(screen.getByLabelText("Area keys"));
    await userEvent.type(screen.getByLabelText("Area keys"), "home, kids");
    await userEvent.clear(screen.getByLabelText("Hidden effort keys"));
    await userEvent.type(
      screen.getByLabelText("Hidden effort keys"),
      "planning, follow_through"
    );
    await userEvent.selectOptions(screen.getByLabelText("Cadence"), "daily");
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
