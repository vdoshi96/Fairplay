import type {
  AiCardDraft,
  AiCardDraftStatus,
  AiCardGenerationStage,
  AiCardSourceInputType
} from "@prisma/client";

import type {
  AiCardDraftDetail,
  AiCardDraftSummary,
  AiCardDraftUpdate
} from "@/contracts/ai-card-drafts";
import type { StructuredAiCard } from "@/server/ai/qwen-card-generator";
import type { HouseholdId, PersonaId, ResponsibilityId } from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";

export type AiCardDraftId = string;

export type CreateAiCardDraftInput = {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  sourceInputType: AiCardSourceInputType;
  inputText?: string | null;
  audioBytes?: Uint8Array | Buffer | null;
  audioMimeType?: string | null;
};

export type ScopedAiCardDraftInput = {
  householdId: HouseholdId;
  draftId: AiCardDraftId;
};

export type SaveAiCardDraftGenerationInput = ScopedAiCardDraftInput & {
  card?: StructuredAiCard;
  audioTranscript?: string | null;
};

function coverUrl(draft: Pick<AiCardDraft, "id" | "coverImageBytes">) {
  return draft.coverImageBytes ? `/api/ai-card-drafts/${draft.id}/cover` : null;
}

function truncatePreview(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 180 ? trimmed.slice(0, 177).trimEnd() + "..." : trimmed;
}

function promptPreview(
  draft: Pick<AiCardDraft, "title" | "inputText" | "audioTranscript">
) {
  return truncatePreview(
    draft.title ??
      draft.inputText ??
      draft.audioTranscript ??
      "Audio card draft"
  );
}

function toSummary(draft: AiCardDraft): AiCardDraftSummary {
  return {
    id: draft.id,
    title: draft.title,
    promptPreview: promptPreview(draft),
    status: draft.status,
    generationStage: draft.generationStage,
    sourceInputType: draft.sourceInputType,
    summary: draft.summary,
    areaKeys: draft.areaKeys,
    hiddenEffortKeys: draft.hiddenEffortKeys,
    cadence: draft.cadence,
    coverUrl: coverUrl(draft),
    failureMessage: draft.failureMessage,
    acceptedResponsibilityId: draft.acceptedResponsibilityId,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString()
  };
}

function toDetail(draft: AiCardDraft): AiCardDraftDetail {
  return {
    ...toSummary(draft),
    inputText: draft.inputText,
    audioTranscript: draft.audioTranscript,
    definition: draft.definition,
    conception: draft.conception,
    planning: draft.planning,
    execution: draft.execution,
    minimumStandard: draft.minimumStandard,
    imagePrompt: draft.imagePrompt,
    imageNegativePrompt: draft.imageNegativePrompt
  };
}

async function getScopedDraft(input: ScopedAiCardDraftInput) {
  return prisma.aiCardDraft.findFirst({
    where: {
      id: input.draftId,
      householdId: input.householdId
    }
  });
}

async function updateScopedDraft(
  input: ScopedAiCardDraftInput,
  data: Parameters<typeof prisma.aiCardDraft.updateMany>[0]["data"]
) {
  const result = await prisma.aiCardDraft.updateMany({
    where: {
      id: input.draftId,
      householdId: input.householdId
    },
    data
  });

  if (result.count !== 1) {
    throw new RepositoryError("NOT_FOUND", "AI card draft not found for household.");
  }

  return prisma.aiCardDraft.findUniqueOrThrow({
    where: { id: input.draftId }
  });
}

function generationData(card: StructuredAiCard) {
  return {
    title: card.title,
    summary: card.summary,
    areaKeys: card.areaKeys,
    hiddenEffortKeys: card.hiddenEffortKeys,
    cadence: card.cadence,
    definition: card.definition,
    conception: card.conception,
    planning: card.planning,
    execution: card.execution,
    minimumStandard: card.minimumStandard,
    imagePrompt: card.imagePrompt,
    imageNegativePrompt: card.imageNegativePrompt
  };
}

function toPrismaBytes(bytes: Uint8Array | Buffer): Uint8Array<ArrayBuffer> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied;
}

export async function createAiCardDraft(
  input: CreateAiCardDraftInput
): Promise<AiCardDraftDetail> {
  const creatorCount = await prisma.persona.count({
    where: {
      id: input.createdByPersonaId,
      householdId: input.householdId
    }
  });

  if (creatorCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Creator persona does not belong to household.");
  }

  const draft = await prisma.aiCardDraft.create({
    data: {
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      sourceInputType: input.sourceInputType,
      inputText: input.inputText ?? null,
      audioBytes: input.audioBytes ? toPrismaBytes(input.audioBytes) : null,
      audioMimeType: input.audioMimeType ?? null,
      areaKeys: [],
      hiddenEffortKeys: []
    }
  });

  return toDetail(draft);
}

export async function listAiCardDrafts(
  householdId: HouseholdId
): Promise<AiCardDraftSummary[]> {
  const drafts = await prisma.aiCardDraft.findMany({
    where: {
      householdId
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return drafts.map(toSummary);
}

export async function getAiCardDraft(
  input: ScopedAiCardDraftInput
): Promise<AiCardDraftDetail | null> {
  const draft = await getScopedDraft(input);
  return draft ? toDetail(draft) : null;
}

export async function updateAiCardDraft(input: {
  householdId: HouseholdId;
  draftId: AiCardDraftId;
  update: AiCardDraftUpdate;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    ...input.update,
    failureCode: null,
    failureMessage: null
  });

  return toDetail(draft);
}

export async function markAiCardDraftStage(input: ScopedAiCardDraftInput & {
  stage: AiCardGenerationStage;
}): Promise<AiCardDraftDetail> {
  const status: AiCardDraftStatus =
    input.stage === "ready"
      ? "ready"
      : input.stage === "failed"
        ? "failed"
        : "processing";
  const draft = await updateScopedDraft(input, {
    generationStage: input.stage,
    status,
    readyAt: input.stage === "ready" ? new Date() : undefined,
    failureCode: input.stage === "failed" ? undefined : null,
    failureMessage: input.stage === "failed" ? undefined : null
  });

  return toDetail(draft);
}

export async function saveAiCardDraftGeneration(
  input: SaveAiCardDraftGenerationInput
): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    ...(input.card ? generationData(input.card) : {}),
    ...(input.audioTranscript !== undefined
      ? { audioTranscript: input.audioTranscript }
      : {}),
    status: "processing",
    failureCode: null,
    failureMessage: null
  });

  return toDetail(draft);
}

export async function saveAiCardDraftFailure(input: ScopedAiCardDraftInput & {
  failureCode: string;
  failureMessage: string;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    status: "failed",
    generationStage: "failed",
    failureCode: input.failureCode,
    failureMessage: input.failureMessage
  });

  return toDetail(draft);
}

export async function saveAiCardDraftCover(input: ScopedAiCardDraftInput & {
  bytes: Uint8Array | Buffer;
  mimeType: string;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    coverImageBytes: toPrismaBytes(input.bytes),
    coverImageMimeType: input.mimeType
  });

  return toDetail(draft);
}

export async function deleteAiCardDraftAudio(
  input: ScopedAiCardDraftInput
): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    audioBytes: null,
    audioMimeType: null,
    audioDeletedAt: new Date()
  });

  return toDetail(draft);
}

export async function cancelAiCardDraft(
  input: ScopedAiCardDraftInput
): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    status: "canceled",
    canceledAt: new Date(),
    audioBytes: null,
    audioMimeType: null,
    audioDeletedAt: new Date()
  });

  return toDetail(draft);
}

export async function markAiCardDraftAccepted(input: ScopedAiCardDraftInput & {
  acceptedResponsibilityId: ResponsibilityId;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(input, {
    status: "accepted",
    acceptedAt: new Date(),
    acceptedResponsibilityId: input.acceptedResponsibilityId,
    audioBytes: null,
    audioMimeType: null,
    audioDeletedAt: new Date()
  });

  return toDetail(draft);
}

export async function getAiCardDraftCover(
  input: ScopedAiCardDraftInput
): Promise<{ bytes: Uint8Array | Buffer; mimeType: string } | null> {
  const draft = await prisma.aiCardDraft.findFirst({
    where: {
      id: input.draftId,
      householdId: input.householdId
    },
    select: {
      coverImageBytes: true,
      coverImageMimeType: true
    }
  });

  if (!draft?.coverImageBytes || !draft.coverImageMimeType) {
    return null;
  }

  return {
    bytes: draft.coverImageBytes,
    mimeType: draft.coverImageMimeType
  };
}

export async function getAiCardDraftAudio(
  input: ScopedAiCardDraftInput
): Promise<{ bytes: Uint8Array | Buffer; mimeType: string } | null> {
  const draft = await prisma.aiCardDraft.findFirst({
    where: {
      id: input.draftId,
      householdId: input.householdId
    },
    select: {
      audioBytes: true,
      audioMimeType: true
    }
  });

  if (!draft?.audioBytes || !draft.audioMimeType) {
    return null;
  }

  return {
    bytes: draft.audioBytes,
    mimeType: draft.audioMimeType
  };
}
