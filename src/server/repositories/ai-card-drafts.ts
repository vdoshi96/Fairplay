import type {
  AiCardDraft,
  AiCardDraftStatus,
  AiCardGenerationStage,
  AiCardSourceInputType,
  GeneratedCardLibraryEntry,
  Prisma
} from "@prisma/client";

import type {
  AiCardDraftDetail,
  AiCardDraftSummary,
  AiCardReuseCandidate,
  AiCardDraftUpdate
} from "@/contracts/ai-card-drafts";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import type { StructuredAiCard } from "@/server/ai/card-generation-shared";
import type { HouseholdId, PersonaId, ResponsibilityId } from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";
import { createResponsibilityWithClient } from "./responsibilities";

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

export type GeneratedCardReuseCandidateInput = {
  inputText: string;
  limit?: number;
};

export type AcceptGeneratedCardReuseCandidateInput = {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  libraryEntryId: string;
};

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

function textGenerationStage(stage: AiCardGenerationStage): AiCardDraftSummary["generationStage"] {
  switch (stage) {
    case "failed":
    case "queued":
    case "ready":
    case "structuring":
      return stage;
    case "generating_image":
    case "saving_image":
    case "transcribing":
      return "structuring";
  }
}

function coverAssetPathForDraft(
  draft: Pick<AiCardDraft, "id" | "coverImageBytes" | "coverImageMimeType">
) {
  return draft.coverImageBytes && draft.coverImageMimeType
    ? `/api/ai-card-drafts/${draft.id}/cover`
    : null;
}

function toSummary(draft: AiCardDraft): AiCardDraftSummary {
  return {
    id: draft.id,
    title: draft.title,
    promptPreview: promptPreview(draft),
    status: draft.status,
    generationStage: textGenerationStage(draft.generationStage),
    sourceInputType: "text",
    summary: draft.summary,
    areaKeys: draft.areaKeys,
    hiddenEffortKeys: draft.hiddenEffortKeys,
    cadence: draft.cadence,
    coverAssetPath: coverAssetPathForDraft(draft),
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
    definition: draft.definition,
    conception: draft.conception,
    planning: draft.planning,
    execution: draft.execution,
    minimumStandard: draft.minimumStandard
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
  data: Parameters<typeof prisma.aiCardDraft.updateMany>[0]["data"],
  options: { allowedStatuses?: AiCardDraftStatus[] } = {}
) {
  const result = await prisma.aiCardDraft.updateMany({
    where: {
      id: input.draftId,
      householdId: input.householdId,
      ...(options.allowedStatuses
        ? { status: { in: options.allowedStatuses } }
        : {})
    },
    data
  });

  if (result.count !== 1) {
    const existing = await getScopedDraft(input);
    if (existing) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "AI card draft is not in an editable lifecycle state."
      );
    }
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
    minimumStandard: card.minimumStandard
  };
}

function toPrismaBytes(bytes: Uint8Array | Buffer): Uint8Array<ArrayBuffer> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied;
}

function requireGeneratedDraftFields(draft: AiCardDraft): StructuredAiCard {
  if (
    !draft.title ||
    !draft.summary ||
    draft.areaKeys.length === 0 ||
    draft.hiddenEffortKeys.length === 0 ||
    !draft.cadence ||
    !draft.definition ||
    !draft.conception ||
    !draft.planning ||
    !draft.execution ||
    !draft.minimumStandard
  ) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "AI card draft is missing generated fields."
    );
  }

  return {
    title: draft.title,
    summary: draft.summary,
    areaKeys: draft.areaKeys,
    hiddenEffortKeys: draft.hiddenEffortKeys,
    cadence: draft.cadence,
    definition: draft.definition,
    conception: draft.conception,
    planning: draft.planning,
    execution: draft.execution,
    minimumStandard: draft.minimumStandard
  };
}

const SEARCH_STOP_WORDS = new Set([
  "and",
  "are",
  "card",
  "create",
  "doing",
  "for",
  "from",
  "how",
  "into",
  "make",
  "need",
  "needs",
  "responsibility",
  "task",
  "that",
  "the",
  "this",
  "turn",
  "what",
  "when",
  "with"
]);

function tokenizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token));
}

function buildGeneratedCardSearchText(card: StructuredAiCard) {
  return [
    card.title,
    card.summary,
    card.areaKeys.join(" "),
    card.hiddenEffortKeys.join(" "),
    card.cadence,
    card.definition,
    card.conception,
    card.planning,
    card.execution,
    card.minimumStandard
  ].join(" ");
}

function scoreGeneratedCardReuse(inputText: string, searchText: string) {
  const inputTokens = new Set(tokenizeSearchText(inputText));
  const candidateTokens = new Set(tokenizeSearchText(searchText));

  if (inputTokens.size === 0 || candidateTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  inputTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      overlap += 1;
    }
  });

  const coverage = overlap / inputTokens.size;
  const titlePhraseBonus = searchText
    .toLowerCase()
    .includes(inputText.trim().toLowerCase())
    ? 0.15
    : 0;

  return Math.min(1, Number((coverage + titlePhraseBonus).toFixed(4)));
}

function toReuseCandidate(
  entry: GeneratedCardLibraryEntry,
  score: number
): AiCardReuseCandidate {
  return {
    id: entry.id,
    score,
    title: entry.title,
    summary: entry.summary,
    areaKeys: entry.areaKeys,
    hiddenEffortKeys: entry.hiddenEffortKeys,
    cadence: entry.cadence,
    definition: entry.definition,
    conception: entry.conception,
    planning: entry.planning,
    execution: entry.execution,
    minimumStandard: entry.minimumStandard,
    sourceCoverAssetPath: entry.sourceCoverAssetPath,
    reuseCount: entry.reuseCount
  };
}

async function upsertGeneratedCardLibraryEntry(input: {
  client: Pick<Prisma.TransactionClient, "generatedCardLibraryEntry">;
  sourceDraftId?: string | null;
  sourceResponsibilityId?: string | null;
  card: StructuredAiCard;
  sourceCoverAssetPath?: string | null;
}) {
  const searchText = buildGeneratedCardSearchText(input.card);
  const data = {
    title: input.card.title,
    summary: input.card.summary,
    areaKeys: input.card.areaKeys,
    hiddenEffortKeys: input.card.hiddenEffortKeys,
    cadence: input.card.cadence,
    definition: input.card.definition,
    conception: input.card.conception,
    planning: input.card.planning,
    execution: input.card.execution,
    minimumStandard: input.card.minimumStandard,
    sourceCoverAssetPath: input.sourceCoverAssetPath ?? null,
    searchText
  };

  if (input.sourceDraftId) {
    await input.client.generatedCardLibraryEntry.upsert({
      where: { sourceDraftId: input.sourceDraftId },
      create: {
        ...data,
        sourceDraftId: input.sourceDraftId,
        sourceResponsibilityId: input.sourceResponsibilityId ?? null
      },
      update: {
        ...data,
        sourceResponsibilityId: input.sourceResponsibilityId ?? null
      }
    });
    return;
  }

  await input.client.generatedCardLibraryEntry.create({
    data: {
      ...data,
      sourceResponsibilityId: input.sourceResponsibilityId ?? null
    }
  });
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
  const draft = await updateScopedDraft(
    input,
    {
      ...input.update,
      failureCode: null,
      failureMessage: null
    },
    { allowedStatuses: ["processing", "ready", "failed"] }
  );

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
  const draft = await updateScopedDraft(
    input,
    {
      generationStage: input.stage,
      status,
      readyAt: input.stage === "ready" ? new Date() : undefined,
      failureCode: input.stage === "failed" ? undefined : null,
      failureMessage: input.stage === "failed" ? undefined : null
    },
    { allowedStatuses: ["processing", "ready", "failed"] }
  );

  return toDetail(draft);
}

export async function saveAiCardDraftGeneration(
  input: SaveAiCardDraftGenerationInput
): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(
    input,
    {
      ...(input.card ? generationData(input.card) : {}),
      ...(input.audioTranscript !== undefined
        ? { audioTranscript: input.audioTranscript }
        : {}),
      status: "processing",
      failureCode: null,
      failureMessage: null
    },
    { allowedStatuses: ["processing"] }
  );

  return toDetail(draft);
}

export async function saveAiCardDraftFailure(input: ScopedAiCardDraftInput & {
  failureCode: string;
  failureMessage: string;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(
    input,
    {
      status: "failed",
      generationStage: "failed",
      failureCode: input.failureCode,
      failureMessage: input.failureMessage
    },
    { allowedStatuses: ["processing", "failed"] }
  );

  return toDetail(draft);
}

export async function saveAiCardDraftCover(input: ScopedAiCardDraftInput & {
  bytes: Uint8Array | Buffer;
  mimeType: string;
}): Promise<AiCardDraftDetail> {
  const draft = await updateScopedDraft(
    input,
    {
      coverImageBytes: toPrismaBytes(input.bytes),
      coverImageMimeType: input.mimeType
    },
    { allowedStatuses: ["processing"] }
  );

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
  const draft = await updateScopedDraft(
    input,
    {
      status: "canceled",
      canceledAt: new Date(),
      audioBytes: null,
      audioMimeType: null,
      audioDeletedAt: new Date()
    },
    { allowedStatuses: ["processing", "ready", "failed"] }
  );

  return toDetail(draft);
}

export async function deleteAiCardDraft(
  input: ScopedAiCardDraftInput
): Promise<void> {
  const result = await prisma.aiCardDraft.deleteMany({
    where: {
      id: input.draftId,
      householdId: input.householdId,
      status: { in: ["failed", "ready", "canceled"] }
    }
  });

  if (result.count === 1) {
    return;
  }

  const existing = await getScopedDraft(input);
  if (existing) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Only failed, completed, or canceled AI card drafts can be removed."
    );
  }
  throw new RepositoryError("NOT_FOUND", "AI card draft not found for household.");
}

export async function markAiCardDraftAccepted(input: ScopedAiCardDraftInput & {
  acceptedResponsibilityId: ResponsibilityId;
}): Promise<AiCardDraftDetail> {
  const responsibilityCount = await prisma.responsibility.count({
    where: {
      id: input.acceptedResponsibilityId,
      householdId: input.householdId
    }
  });

  if (responsibilityCount !== 1) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Accepted responsibility does not belong to household."
    );
  }

  const draft = await updateScopedDraft(
    input,
    {
      status: "accepted",
      acceptedAt: new Date(),
      acceptedResponsibilityId: input.acceptedResponsibilityId,
      audioBytes: null,
      audioMimeType: null,
      audioDeletedAt: new Date()
    },
    { allowedStatuses: ["ready"] }
  );

  return toDetail(draft);
}

export async function findGeneratedCardReuseCandidates(
  input: GeneratedCardReuseCandidateInput
): Promise<AiCardReuseCandidate[]> {
  const trimmed = input.inputText.trim();
  if (!trimmed) {
    throw new RepositoryError("INVALID_INPUT", "Text input is required.");
  }

  const entries = await prisma.generatedCardLibraryEntry.findMany({
    orderBy: [
      { reuseCount: "desc" },
      { createdAt: "desc" }
    ],
    take: 250
  });

  return entries
    .map((entry) => ({
      entry,
      score: scoreGeneratedCardReuse(trimmed, entry.searchText)
    }))
    .filter((candidate) => candidate.score >= 0.34)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.entry.reuseCount !== left.entry.reuseCount) {
        return right.entry.reuseCount - left.entry.reuseCount;
      }
      return right.entry.createdAt.getTime() - left.entry.createdAt.getTime();
    })
    .slice(0, input.limit ?? 3)
    .map((candidate) => toReuseCandidate(candidate.entry, candidate.score));
}

export async function acceptGeneratedCardReuseCandidate(
  input: AcceptGeneratedCardReuseCandidateInput
): Promise<ResponsibilityDetail> {
  return prisma.$transaction(async (tx) => {
    const [entry, creatorCount] = await Promise.all([
      tx.generatedCardLibraryEntry.findUnique({
        where: {
          id: input.libraryEntryId
        }
      }),
      tx.persona.count({
        where: {
          id: input.createdByPersonaId,
          householdId: input.householdId
        }
      })
    ]);

    if (!entry) {
      throw new RepositoryError("NOT_FOUND", "Reusable generated card not found.");
    }

    if (creatorCount !== 1) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Creator persona does not belong to household."
      );
    }

    const responsibility = await createResponsibilityWithClient(tx, {
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      title: entry.title,
      summary: entry.summary,
      areaKeys: entry.areaKeys,
      hiddenEffortKeys: entry.hiddenEffortKeys,
      cadence: entry.cadence,
      relevantDays: [],
      status: "active",
      visibility: "shared_household",
      boardLane: "not_in_play",
      boardSortOrder: 0,
      householdStandard: entry.minimumStandard,
      notes: null,
      sourceDefinition: entry.definition,
      sourceConception: entry.conception,
      sourcePlanning: entry.planning,
      sourceExecution: entry.execution,
      sourceMinimumStandard: entry.minimumStandard,
      sourceCoverAssetPath: entry.sourceCoverAssetPath
    });

    await tx.generatedCardLibraryEntry.update({
      where: {
        id: entry.id
      },
      data: {
        reuseCount: {
          increment: 1
        }
      }
    });

    return responsibility;
  });
}

export async function acceptAiCardDraftAsResponsibility(input: {
  householdId: HouseholdId;
  draftId: AiCardDraftId;
  createdByPersonaId: PersonaId;
}): Promise<ResponsibilityDetail> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.aiCardDraft.updateMany({
      where: {
        id: input.draftId,
        householdId: input.householdId,
        status: "ready",
        acceptedResponsibilityId: null
      },
      data: {
        status: "accepted",
        acceptedAt: now,
        audioBytes: null,
        audioMimeType: null,
        audioDeletedAt: now
      }
    });

    if (claimed.count !== 1) {
      const existing = await tx.aiCardDraft.findFirst({
        where: {
          id: input.draftId,
          householdId: input.householdId
        },
        select: {
          id: true
        }
      });
      if (!existing) {
        throw new RepositoryError(
          "NOT_FOUND",
          "AI card draft not found for household."
        );
      }

      throw new RepositoryError(
        "INVALID_INPUT",
        "AI card draft is not ready to accept."
      );
    }

    const [draft, creatorCount] = await Promise.all([
      tx.aiCardDraft.findUniqueOrThrow({
        where: {
          id: input.draftId
        }
      }),
      tx.persona.count({
        where: {
          id: input.createdByPersonaId,
          householdId: input.householdId
        }
      })
    ]);

    if (creatorCount !== 1) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Creator persona does not belong to household."
      );
    }

    const card = requireGeneratedDraftFields(draft);
    const coverAssetPath = coverAssetPathForDraft(draft);
    const responsibility = await createResponsibilityWithClient(tx, {
        householdId: input.householdId,
        createdByPersonaId: input.createdByPersonaId,
        title: card.title,
        summary: card.summary,
        areaKeys: card.areaKeys,
        hiddenEffortKeys: card.hiddenEffortKeys,
        cadence: card.cadence,
        relevantDays: [],
        status: "active",
        visibility: "shared_household",
        boardLane: "not_in_play",
        boardSortOrder: 0,
        householdStandard: card.minimumStandard,
        notes: null,
        sourceDefinition: card.definition,
        sourceConception: card.conception,
        sourcePlanning: card.planning,
        sourceExecution: card.execution,
        sourceMinimumStandard: card.minimumStandard,
        sourceCoverAssetPath: coverAssetPath
    });

    await tx.aiCardDraft.update({
      where: {
        id: input.draftId
      },
      data: {
        acceptedResponsibilityId: responsibility.id
      }
    });

    await upsertGeneratedCardLibraryEntry({
      client: tx,
      sourceDraftId: draft.id,
      sourceResponsibilityId: responsibility.id,
      card,
      sourceCoverAssetPath: coverAssetPath
    });

    return responsibility;
  });
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
