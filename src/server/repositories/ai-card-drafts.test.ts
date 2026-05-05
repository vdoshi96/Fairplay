import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../db/prisma";
import { createHouseholdWithPersonas } from "./households";
import {
  cancelAiCardDraft,
  createAiCardDraft,
  deleteAiCardDraftAudio,
  getAiCardDraft,
  getAiCardDraftCover,
  listAiCardDrafts,
  markAiCardDraftAccepted,
  markAiCardDraftStage,
  saveAiCardDraftCover,
  saveAiCardDraftFailure,
  saveAiCardDraftGeneration,
  updateAiCardDraft
} from "./ai-card-drafts";
import { createResponsibility } from "./responsibilities";

const createdHouseholdIds = new Set<string>();

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

async function createTestHousehold(prefix = "ai-draft") {
  const result = await createHouseholdWithPersonas({
    householdName: "AI Draft Home",
    usernameNormalized: uniqueUsername(prefix),
    timezone: "America/Chicago",
    passwordHash: `argon2id-test-hash-${randomUUID()}`,
    hashAlgorithm: "argon2id",
    hashParamsVersion: "test"
  });
  createdHouseholdIds.add(result.household.id);
  return result;
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for repository integration tests.");
  }
});

afterEach(async () => {
  if (createdHouseholdIds.size === 0) {
    return;
  }

  await prisma.household.deleteMany({
    where: { id: { in: [...createdHouseholdIds] } }
  });
  createdHouseholdIds.clear();
});

describe("AI card draft repository", () => {
  it("creates a text draft scoped to household and creator persona", async () => {
    const { household, personas } = await createTestHousehold();

    const draft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "text",
      inputText: "Restock the school snack bin every Sunday."
    });

    expect(draft).toMatchObject({
      inputText: "Restock the school snack bin every Sunday.",
      sourceInputType: "text",
      status: "processing",
      generationStage: "queued",
      promptPreview: "Restock the school snack bin every Sunday.",
      coverUrl: null
    });
    expect("audioBytes" in draft).toBe(false);

    await expect(
      getAiCardDraft({
        householdId: household.id,
        draftId: draft.id
      })
    ).resolves.toMatchObject({ id: draft.id });
  });

  it("creates an audio draft with stored bytes and metadata without exposing audio publicly", async () => {
    const { household, personas } = await createTestHousehold();
    const audioBytes = new Uint8Array([1, 2, 3, 4]);

    const draft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "audio",
      audioBytes,
      audioMimeType: "audio/webm"
    });

    expect(draft).toMatchObject({
      sourceInputType: "audio",
      promptPreview: "Audio card draft"
    });
    expect("audioBytes" in draft).toBe(false);

    const stored = await prisma.aiCardDraft.findUniqueOrThrow({
      where: { id: draft.id },
      select: { audioBytes: true, audioMimeType: true }
    });
    expect([...new Uint8Array(stored.audioBytes ?? [])]).toEqual([...audioBytes]);
    expect(stored.audioMimeType).toBe("audio/webm");
  });

  it("lists summaries with prompt fallbacks and cover URLs only when cover bytes exist", async () => {
    const { household, personas } = await createTestHousehold();
    const textDraft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "text",
      inputText: "Rotate guest towels."
    });
    const audioDraft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "audio",
      audioBytes: new Uint8Array([5, 6]),
      audioMimeType: "audio/webm"
    });

    await saveAiCardDraftGeneration({
      householdId: household.id,
      draftId: textDraft.id,
      card: {
        title: "Guest Towels",
        summary: "Keep clean towels easy for visitors.",
        areaKeys: ["cleaning_reset"],
        hiddenEffortKeys: ["noticing"],
        cadence: "weekly",
        definition: "Notice towel use.",
        conception: "Know when visitors are coming.",
        planning: "Add towels to the reset.",
        execution: "Wash and stage towels.",
        minimumStandard: "Clean towels are available.",
        imagePrompt: "folded towels",
        imageNegativePrompt: "people"
      }
    });
    await saveAiCardDraftGeneration({
      householdId: household.id,
      draftId: audioDraft.id,
      audioTranscript: "Change the air filter monthly."
    });
    await saveAiCardDraftCover({
      householdId: household.id,
      draftId: textDraft.id,
      bytes: new Uint8Array([9, 8, 7]),
      mimeType: "image/png"
    });

    const summaries = await listAiCardDrafts(household.id);

    expect(summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: textDraft.id,
          promptPreview: "Guest Towels",
          coverUrl: `/api/ai-card-drafts/${textDraft.id}/cover`
        }),
        expect.objectContaining({
          id: audioDraft.id,
          promptPreview: "Change the air filter monthly.",
          coverUrl: null
        })
      ])
    );
    expect(summaries.some((summary) => "audioBytes" in summary)).toBe(false);
  });

  it("updates generation status, stage, failure message, fields, and cover bytes", async () => {
    const { household, personas } = await createTestHousehold();
    const draft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "text",
      inputText: "Check backpack papers."
    });

    await markAiCardDraftStage({
      householdId: household.id,
      draftId: draft.id,
      stage: "structuring"
    });
    await saveAiCardDraftFailure({
      householdId: household.id,
      draftId: draft.id,
      failureCode: "QWEN_GENERATION_FAILED",
      failureMessage: "Provider timed out."
    });
    const failed = await getAiCardDraft({
      householdId: household.id,
      draftId: draft.id
    });
    expect(failed).toMatchObject({
      status: "failed",
      generationStage: "failed",
      failureMessage: "Provider timed out."
    });

    await updateAiCardDraft({
      householdId: household.id,
      draftId: draft.id,
      update: {
        title: "Backpack Papers",
        summary: "Keep school forms moving.",
        areaKeys: ["home_admin"],
        hiddenEffortKeys: ["noticing", "planning"],
        cadence: "weekly",
        definition: "Check folders.",
        conception: "Notice paper flow.",
        planning: "Pick a review day.",
        execution: "Sign and return forms.",
        minimumStandard: "Forms are handled before due dates.",
        imagePrompt: "folder and pencil",
        imageNegativePrompt: "logos"
      }
    });
    await saveAiCardDraftCover({
      householdId: household.id,
      draftId: draft.id,
      bytes: Buffer.from([1, 1, 2, 3]),
      mimeType: "image/png"
    });

    await expect(
      getAiCardDraft({ householdId: household.id, draftId: draft.id })
    ).resolves.toMatchObject({
      title: "Backpack Papers",
      cadence: "weekly",
      coverUrl: `/api/ai-card-drafts/${draft.id}/cover`
    });
    await expect(
      getAiCardDraftCover({ householdId: household.id, draftId: draft.id })
    ).resolves.toMatchObject({ mimeType: "image/png" });
  });

  it("deletes audio on accept and cancel", async () => {
    const { household, personas } = await createTestHousehold();
    const accepted = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "audio",
      audioBytes: new Uint8Array([1]),
      audioMimeType: "audio/webm"
    });
    const canceled = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "audio",
      audioBytes: new Uint8Array([2]),
      audioMimeType: "audio/webm"
    });
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      title: "Accepted AI card",
      summary: null,
      areaKeys: ["home_admin"],
      hiddenEffortKeys: ["doing"],
      cadence: "weekly",
      visibility: "shared_household"
    });

    await markAiCardDraftAccepted({
      householdId: household.id,
      draftId: accepted.id,
      acceptedResponsibilityId: responsibility.id
    });
    await cancelAiCardDraft({
      householdId: household.id,
      draftId: canceled.id
    });

    const stored = await prisma.aiCardDraft.findMany({
      where: { id: { in: [accepted.id, canceled.id] } },
      orderBy: { id: "asc" },
      select: {
        id: true,
        status: true,
        audioBytes: true,
        audioMimeType: true,
        audioDeletedAt: true
      }
    });
    expect(stored).toHaveLength(2);
    expect(stored.every((draft) => draft.audioBytes === null)).toBe(true);
    expect(stored.every((draft) => draft.audioMimeType === null)).toBe(true);
    expect(stored.every((draft) => draft.audioDeletedAt !== null)).toBe(true);
  });

  it("can delete audio without canceling the draft", async () => {
    const { household, personas } = await createTestHousehold();
    const draft = await createAiCardDraft({
      householdId: household.id,
      createdByPersonaId: personas[0].id,
      sourceInputType: "audio",
      audioBytes: new Uint8Array([3]),
      audioMimeType: "audio/webm"
    });

    await deleteAiCardDraftAudio({
      householdId: household.id,
      draftId: draft.id
    });

    const stored = await prisma.aiCardDraft.findUniqueOrThrow({
      where: { id: draft.id },
      select: { status: true, audioBytes: true, audioDeletedAt: true }
    });
    expect(stored.status).toBe("processing");
    expect(stored.audioBytes).toBeNull();
    expect(stored.audioDeletedAt).not.toBeNull();
  });
});
