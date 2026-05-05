import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AiCardDraftDetail, AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import type { StructuredAiCard } from "@/server/ai/qwen-card-generator";
import type { CurrentSession } from "@/server/auth/current-session";
import {
  createAiCardDraftService,
  type AiCardDraftServiceDeps
} from "./service";

const householdId = "550e8400-e29b-41d4-a716-446655440000";
const alexId = "550e8400-e29b-41d4-a716-446655440001";
const draftId = "550e8400-e29b-41d4-a716-446655440090";
const responsibilityId = "550e8400-e29b-41d4-a716-446655440091";

const session: CurrentSession = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId,
  selectedPersonaId: alexId,
  createdAt: "2026-05-04T12:00:00.000Z",
  lastSeenAt: "2026-05-04T12:00:00.000Z",
  expiresAt: "2026-06-04T12:00:00.000Z",
  revokedAt: null,
  userAgentHash: null
};

const generatedCard: StructuredAiCard = {
  title: "Dog Medicine",
  summary: "Keep the dog medicine cadence visible.",
  areaKeys: ["pet_care"],
  hiddenEffortKeys: ["noticing", "planning"],
  cadence: "monthly",
  definition: "Track the medicine schedule.",
  conception: "Notice refill and dose timing.",
  planning: "Put the next dose on the household calendar.",
  execution: "Give the medicine and record it.",
  minimumStandard: "Medicine is given by the due date.",
  imagePrompt: "dog medicine calendar still life",
  imageNegativePrompt: "people, logos"
};

function draft(overrides: Partial<AiCardDraftDetail> = {}): AiCardDraftDetail {
  return {
    id: draftId,
    title: null,
    promptPreview: "Dog medicine",
    status: "processing",
    generationStage: "queued",
    sourceInputType: "text",
    summary: null,
    areaKeys: [],
    hiddenEffortKeys: [],
    cadence: null,
    coverUrl: null,
    failureMessage: null,
    acceptedResponsibilityId: null,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:00:00.000Z",
    inputText: "Dog medicine",
    audioTranscript: null,
    definition: null,
    conception: null,
    planning: null,
    execution: null,
    minimumStandard: null,
    imagePrompt: null,
    imageNegativePrompt: null,
    ...overrides
  };
}

function readyDraft(overrides: Partial<AiCardDraftDetail> = {}): AiCardDraftDetail {
  return draft({
    status: "ready",
    generationStage: "ready",
    coverUrl: `/api/ai-card-drafts/${draftId}/cover`,
    ...generatedCard,
    ...overrides
  });
}

function responsibility(
  overrides: Partial<ResponsibilityDetail> = {}
): ResponsibilityDetail {
  return {
    id: responsibilityId,
    title: generatedCard.title,
    summary: generatedCard.summary,
    areaKeys: [...generatedCard.areaKeys],
    hiddenEffortKeys: [...generatedCard.hiddenEffortKeys],
    cadence: generatedCard.cadence,
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "not_in_play",
    boardSortOrder: 0,
    linkedRadarItems: [],
    currentAssignments: [],
    nextReviewAt: null,
    householdStandard: generatedCard.minimumStandard,
    notes: null,
    lifecycleNotes: null,
    lastReviewedAt: null,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:00:00.000Z",
    archivedAt: null,
    ...overrides
  };
}

function makeDeps(overrides: Partial<AiCardDraftServiceDeps> = {}): AiCardDraftServiceDeps {
  return {
    listDrafts: vi.fn().mockResolvedValue([draft() as AiCardDraftSummary]),
    getDraft: vi.fn().mockResolvedValue(draft()),
    createDraft: vi.fn().mockResolvedValue(draft()),
    updateDraft: vi.fn().mockImplementation(async (_input) =>
      draft({
        ..._input.update
      })
    ),
    markStage: vi.fn().mockResolvedValue(draft()),
    saveGeneration: vi.fn().mockImplementation(async (_input) =>
      readyDraft({
        ...("card" in _input && _input.card ? _input.card : {}),
        audioTranscript: _input.audioTranscript ?? null
      })
    ),
    saveFailure: vi.fn().mockImplementation(async (_input) =>
      draft({
        status: "failed",
        generationStage: "failed",
        failureMessage: _input.failureMessage
      })
    ),
    saveCover: vi.fn().mockImplementation(async (_input) =>
      readyDraft({
        coverUrl: `/api/ai-card-drafts/${_input.draftId}/cover`
      })
    ),
    deleteAudio: vi.fn().mockResolvedValue(draft()),
    cancelDraft: vi.fn().mockResolvedValue(draft({ status: "canceled" })),
    markAccepted: vi.fn().mockResolvedValue(
      readyDraft({
        status: "accepted",
        acceptedResponsibilityId: responsibilityId
      })
    ),
    getCover: vi.fn().mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png"
    }),
    getDraftAudio: vi.fn().mockResolvedValue({
      bytes: new Uint8Array([4, 5, 6]),
      mimeType: "audio/webm"
    }),
    transcribeAudio: vi.fn().mockResolvedValue("Dog medicine every month."),
    structureTaskAsCard: vi.fn().mockResolvedValue(generatedCard),
    generateCardCover: vi.fn().mockResolvedValue({
      bytes: new Uint8Array([9, 8, 7]),
      mimeType: "image/png"
    }),
    createResponsibility: vi.fn().mockResolvedValue(responsibility()),
    ...overrides
  };
}

describe("AI card draft service", () => {
  it("requires a selected persona", async () => {
    const service = createAiCardDraftService(makeDeps());
    const anonymousSession = { ...session, selectedPersonaId: null };

    await expect(
      service.createFromText(anonymousSession, { inputText: "Dog medicine" })
    ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  });

  it("creates a text draft and persists generation stages in order", async () => {
    const deps = makeDeps();
    const service = createAiCardDraftService(deps);

    await service.createFromText(session, { inputText: "Dog medicine" });

    expect(deps.createDraft).toHaveBeenCalledWith({
      householdId,
      createdByPersonaId: alexId,
      sourceInputType: "text",
      inputText: "Dog medicine"
    });
    expect(vi.mocked(deps.markStage).mock.calls.map(([input]) => input.stage)).toEqual([
      "structuring",
      "generating_image",
      "saving_image",
      "ready"
    ]);
    expect(deps.structureTaskAsCard).toHaveBeenCalledWith({
      taskText: "Dog medicine"
    });
    expect(deps.saveGeneration).toHaveBeenCalledWith({
      householdId,
      draftId,
      card: generatedCard
    });
    expect(deps.saveCover).toHaveBeenCalledWith({
      householdId,
      draftId,
      bytes: new Uint8Array([9, 8, 7]),
      mimeType: "image/png"
    });
  });

  it("creates an audio draft, caps uploads, transcribes, and then structures from the transcript", async () => {
    const deps = makeDeps();
    const service = createAiCardDraftService(deps);
    const bytes = new Uint8Array([1, 2, 3]);

    await service.createFromAudio(session, {
      audioBytes: bytes,
      audioMimeType: "audio/webm",
      contextText: "Household capture"
    });

    expect(deps.createDraft).toHaveBeenCalledWith({
      householdId,
      createdByPersonaId: alexId,
      sourceInputType: "audio",
      audioBytes: bytes,
      audioMimeType: "audio/webm"
    });
    expect(vi.mocked(deps.markStage).mock.calls.map(([input]) => input.stage)).toEqual([
      "transcribing",
      "structuring",
      "generating_image",
      "saving_image",
      "ready"
    ]);
    expect(deps.transcribeAudio).toHaveBeenCalledWith({
      bytes,
      mimeType: "audio/webm",
      contextText: "Household capture"
    });
    expect(deps.saveGeneration).toHaveBeenCalledWith({
      householdId,
      draftId,
      audioTranscript: "Dog medicine every month."
    });
    expect(deps.structureTaskAsCard).toHaveBeenCalledWith({
      taskText: "Dog medicine every month."
    });

    await expect(
      service.createFromAudio(session, {
        audioBytes: new Uint8Array(10 * 1024 * 1024 + 1),
        audioMimeType: "audio/webm"
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("keeps structured fields and records a failed draft when image generation fails", async () => {
    const deps = makeDeps({
      generateCardCover: vi.fn().mockRejectedValue(new Error("image provider down"))
    });
    const service = createAiCardDraftService(deps);

    await expect(
      service.createFromText(session, { inputText: "Dog medicine" })
    ).rejects.toMatchObject({ code: "GENERATION_FAILED" });

    expect(deps.saveGeneration).toHaveBeenCalledWith({
      householdId,
      draftId,
      card: generatedCard
    });
    expect(deps.saveFailure).toHaveBeenCalledWith({
      householdId,
      draftId,
      failureCode: "GENERATION_FAILED",
      failureMessage: "image provider down"
    });
  });

  it("validates household ownership through get/list/update/retry/regenerate/cover operations", async () => {
    const deps = makeDeps({
      getDraft: vi.fn().mockResolvedValue(null)
    });
    const service = createAiCardDraftService(deps);

    await expect(service.get(session, draftId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(
      service.update(session, draftId, { title: "New title" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.retry(session, draftId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.regenerateImage(session, draftId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(service.getCover(session, draftId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("regenerates images from existing structured fields", async () => {
    const deps = makeDeps({
      getDraft: vi.fn().mockResolvedValue(readyDraft())
    });
    const service = createAiCardDraftService(deps);

    await service.regenerateImage(session, draftId);

    expect(vi.mocked(deps.markStage).mock.calls.map(([input]) => input.stage)).toEqual([
      "generating_image",
      "saving_image",
      "ready"
    ]);
    expect(deps.generateCardCover).toHaveBeenCalledWith({
      title: generatedCard.title,
      imagePrompt: generatedCard.imagePrompt,
      negativePrompt: generatedCard.imageNegativePrompt
    });
  });

  it("puts a ready draft in play with generated source fields and deletes audio", async () => {
    const deps = makeDeps({
      getDraft: vi.fn().mockResolvedValue(readyDraft())
    });
    const service = createAiCardDraftService(deps);

    const created = await service.putInPlay(session, draftId);

    expect(created.id).toBe(responsibilityId);
    expect(deps.createResponsibility).toHaveBeenCalledWith({
      householdId,
      createdByPersonaId: alexId,
      title: generatedCard.title,
      summary: generatedCard.summary,
      areaKeys: generatedCard.areaKeys,
      hiddenEffortKeys: generatedCard.hiddenEffortKeys,
      cadence: generatedCard.cadence,
      relevantDays: [],
      status: "active",
      visibility: "shared_household",
      boardLane: "not_in_play",
      householdStandard: generatedCard.minimumStandard,
      notes: null,
      sourceDefinition: generatedCard.definition,
      sourceConception: generatedCard.conception,
      sourcePlanning: generatedCard.planning,
      sourceExecution: generatedCard.execution,
      sourceMinimumStandard: generatedCard.minimumStandard,
      sourceCoverAssetPath: `/api/ai-card-drafts/${draftId}/cover`
    });
    expect(deps.markAccepted).toHaveBeenCalledWith({
      householdId,
      draftId,
      acceptedResponsibilityId: responsibilityId
    });
    expect(deps.deleteAudio).toHaveBeenCalledWith({ householdId, draftId });
  });

  it("cancels drafts and deletes audio", async () => {
    const deps = makeDeps();
    const service = createAiCardDraftService(deps);

    await service.cancel(session, draftId);

    expect(deps.cancelDraft).toHaveBeenCalledWith({ householdId, draftId });
    expect(deps.deleteAudio).toHaveBeenCalledWith({ householdId, draftId });
  });
});
