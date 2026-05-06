import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  accepted: "550e8400-e29b-41d4-a716-446655440013"
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
    coverUrl: overrides.coverUrl ?? null,
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
      cadence: overrides.cadence ?? "weekly",
      coverUrl:
        overrides.coverUrl ??
        `/api/ai-card-drafts/${draftIds.ready}/cover`
    }),
    inputText: overrides.inputText ?? "Laundry is piling up.",
    audioTranscript: overrides.audioTranscript ?? null,
    definition: overrides.definition ?? "Own the laundry flow.",
    conception: overrides.conception ?? "Notice hampers before they overflow.",
    planning: overrides.planning ?? "Start loads when there is enough time.",
    execution: overrides.execution ?? "Wash, dry, fold, and put away.",
    minimumStandard: overrides.minimumStandard ?? "Laundry is folded by Sunday.",
    imagePrompt: overrides.imagePrompt ?? "A tidy laundry room",
    imageNegativePrompt: overrides.imageNegativePrompt ?? null
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

  it("opens capture controls for text and voice from the greg button", async () => {
    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "greg - the taskmaster" })
    );

    expect(screen.getByTestId("little-alex-horne-sidekick-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/ai-task-helper.png"
    );
    expect(screen.getByRole("region", { name: "Capture AI card draft" })).toBeVisible();
    expect(screen.getByLabelText("Describe the card")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start recording" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create draft" })).toBeDisabled();
  });

  it("shows processing, failed, ready, and accepted drafts with status-specific actions", () => {
    render(
      <AiTaskManager
        drafts={[
          draft({
            id: draftIds.processing,
            status: "processing",
            generationStage: "generating_image",
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
    expect(screen.getByText("Processing")).toBeVisible();
    expect(screen.getByText("Failed")).toBeVisible();
    expect(screen.getByText("Ready")).toBeVisible();
    expect(screen.getByText("Accepted")).toBeVisible();

    const failedDraft = screen.getByRole("article", { name: /failed draft/i });
    expect(within(failedDraft).getByRole("button", { name: "Retry" })).toBeVisible();
    expect(within(failedDraft).getByRole("button", { name: "Cancel" })).toBeVisible();

    const readyDraft = screen.getByRole("article", { name: /laundry reset/i });
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
      screen.getByRole("button", { name: "greg - the taskmaster" })
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
      screen.getByRole("button", { name: "greg - the taskmaster" })
    );
    await userEvent.type(
      screen.getByLabelText("Describe the card"),
      "Make a card for packing lunches."
    );
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(
      await screen.findByText("AI card draft generation failed. Reference fp_ai_test.")
    ).toBeVisible();
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("records audio into a Blob and submits multipart form data", async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: draftIds.processing })
    });

    class MockMediaRecorder extends EventTarget {
      state = "inactive";

      constructor() {
        super();
      }

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        const event = new Event("dataavailable");
        Object.defineProperty(event, "data", {
          value: new Blob(["audio-bytes"], { type: "audio/webm" })
        });
        this.dispatchEvent(event);
        this.dispatchEvent(new Event("stop"));
      }
    }

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream)
      }
    });

    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "greg - the taskmaster" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Start recording" }));
    expect(screen.getByRole("button", { name: "Stop recording" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
    await waitFor(() => expect(screen.getByText("Audio captured")).toBeVisible());

    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-card-drafts",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("audio")).toBeInstanceOf(Blob);
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("stops the recording stream when capture closes while recording", async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] };

    class MockMediaRecorder extends EventTarget {
      state = "inactive";

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.dispatchEvent(new Event("stop"));
      }
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream)
      }
    });

    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "greg - the taskmaster" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Start recording" }));
    fireEvent.click(screen.getByRole("button", { name: "Close capture" }));

    await waitFor(() => expect(stopTrack).toHaveBeenCalledTimes(1));
  });

  it("stops a late recording stream when capture closes before permission resolves", async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] };
    let resolveUserMedia: (mediaStream: typeof stream) => void = () => {};
    const getUserMedia = vi.fn(
      () =>
        new Promise<typeof stream>((resolve) => {
          resolveUserMedia = resolve;
        })
    );

    class MockMediaRecorder extends EventTarget {
      state = "inactive";

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.dispatchEvent(new Event("stop"));
      }
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia }
    });

    render(<AiTaskManager drafts={[]} />);

    await userEvent.click(
      screen.getByRole("button", { name: "greg - the taskmaster" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Start recording" }));
    fireEvent.click(screen.getByRole("button", { name: "Close capture" }));
    resolveUserMedia(stream);

    await waitFor(() => expect(stopTrack).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Stop recording" })).not.toBeInTheDocument();
  });

  it("fetches review detail, saves edits, and regenerates the image", async () => {
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

      if (
        url === `/api/ai-card-drafts/${draftIds.ready}/regenerate-image` &&
        init?.method === "POST"
      ) {
        return {
          ok: true,
          json: async () => draftDetail
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
            summary: "Keep the laundry moving from hamper to folded."
          })
        ]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(await screen.findByLabelText("Draft title")).toHaveValue("Laundry reset");
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

    await userEvent.click(screen.getByRole("button", { name: "Regenerate image" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/ai-card-drafts/${draftIds.ready}/regenerate-image`,
        { method: "POST" }
      )
    );
    expect(routerRefresh).toHaveBeenCalledTimes(2);
  });
});
