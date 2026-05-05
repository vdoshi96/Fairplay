import type {
  AiCardDraftDetail,
  AiCardDraftSummary,
  AiCardDraftUpdate
} from "@/contracts/ai-card-drafts";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import type { HouseholdId, PersonaId } from "@/domain/ids";
import {
  generateCardCover,
  structureTaskAsCard,
  transcribeAudio,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "@/server/ai/qwen-card-generator";
import type { CurrentSession } from "@/server/auth/current-session";
import {
  acceptAiCardDraftAsResponsibility,
  cancelAiCardDraft,
  createAiCardDraft,
  deleteAiCardDraftAudio,
  getAiCardDraft,
  getAiCardDraftAudio,
  getAiCardDraftCover,
  listAiCardDrafts,
  markAiCardDraftAccepted,
  markAiCardDraftStage,
  saveAiCardDraftCover,
  saveAiCardDraftFailure,
  saveAiCardDraftGeneration,
  updateAiCardDraft,
  type AiCardDraftId
} from "@/server/repositories/ai-card-drafts";
import { RepositoryError } from "@/server/db/errors";

export type AiCardDraftServiceErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "GENERATION_FAILED";

export class AiCardDraftServiceError extends Error {
  readonly code: AiCardDraftServiceErrorCode;

  constructor(code: AiCardDraftServiceErrorCode, message: string) {
    super(message);
    this.name = "AiCardDraftServiceError";
    this.code = code;
  }
}

export type AiCardDraftServiceDeps = {
  listDrafts: (householdId: HouseholdId) => Promise<AiCardDraftSummary[]>;
  getDraft: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<AiCardDraftDetail | null>;
  createDraft: (input: {
    householdId: HouseholdId;
    createdByPersonaId: PersonaId;
    sourceInputType: "text" | "audio";
    inputText?: string;
    audioBytes?: Uint8Array | Buffer;
    audioMimeType?: string;
  }) => Promise<AiCardDraftDetail>;
  updateDraft: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    update: AiCardDraftUpdate;
  }) => Promise<AiCardDraftDetail>;
  markStage: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    stage: AiCardGenerationStage;
  }) => Promise<AiCardDraftDetail>;
  saveGeneration: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    card?: StructuredAiCard;
    audioTranscript?: string | null;
  }) => Promise<AiCardDraftDetail>;
  saveFailure: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    failureCode: string;
    failureMessage: string;
  }) => Promise<AiCardDraftDetail>;
  saveCover: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    bytes: Uint8Array | Buffer;
    mimeType: string;
  }) => Promise<AiCardDraftDetail>;
  deleteAudio: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<AiCardDraftDetail>;
  cancelDraft: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<AiCardDraftDetail>;
  markAccepted: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    acceptedResponsibilityId: string;
  }) => Promise<AiCardDraftDetail>;
  getCover: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<{ bytes: Uint8Array | Buffer; mimeType: string } | null>;
  getDraftAudio: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<{ bytes: Uint8Array | Buffer; mimeType: string } | null>;
  transcribeAudio: (input: {
    bytes: Uint8Array | Buffer;
    mimeType: string;
    contextText?: string;
  }) => Promise<string>;
  structureTaskAsCard: (input: {
    taskText: string;
    existingDraft?: Partial<StructuredAiCard>;
  }) => Promise<StructuredAiCard>;
  generateCardCover: (input: {
    title: string;
    imagePrompt: string;
    negativePrompt: string;
  }) => Promise<GeneratedCoverImage>;
  acceptDraftAsResponsibility: typeof acceptAiCardDraftAsResponsibility;
};

type AiCardGenerationStage = AiCardDraftDetail["generationStage"];

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const defaultDeps: AiCardDraftServiceDeps = {
  listDrafts: listAiCardDrafts,
  getDraft: getAiCardDraft,
  createDraft: createAiCardDraft,
  updateDraft: updateAiCardDraft,
  markStage: markAiCardDraftStage,
  saveGeneration: saveAiCardDraftGeneration,
  saveFailure: saveAiCardDraftFailure,
  saveCover: saveAiCardDraftCover,
  deleteAudio: deleteAiCardDraftAudio,
  cancelDraft: cancelAiCardDraft,
  markAccepted: markAiCardDraftAccepted,
  getCover: getAiCardDraftCover,
  getDraftAudio: getAiCardDraftAudio,
  transcribeAudio,
  structureTaskAsCard,
  generateCardCover,
  acceptDraftAsResponsibility: acceptAiCardDraftAsResponsibility
};

function requireSelectedPersona(session: CurrentSession): PersonaId {
  if (!session.selectedPersonaId) {
    throw new AiCardDraftServiceError(
      "AUTH_REQUIRED",
      "A selected persona is required."
    );
  }

  return session.selectedPersonaId;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "AI card draft generation failed.";
}

function mapRepositoryServiceError(error: unknown): never {
  if (
    error instanceof RepositoryError &&
    (error.code === "NOT_FOUND" || error.code === "INVALID_INPUT")
  ) {
    throw new AiCardDraftServiceError(error.code, error.message);
  }

  throw error;
}

async function getRequiredDraft(
  deps: AiCardDraftServiceDeps,
  session: CurrentSession,
  draftId: AiCardDraftId
) {
  const draft = await deps.getDraft({
    householdId: session.householdId,
    draftId
  });

  if (!draft) {
    throw new AiCardDraftServiceError(
      "NOT_FOUND",
      "AI card draft not found for this household."
    );
  }

  return draft;
}

function requireGeneratedFields(draft: AiCardDraftDetail): StructuredAiCard {
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
    !draft.minimumStandard ||
    !draft.imagePrompt ||
    !draft.imageNegativePrompt
  ) {
    throw new AiCardDraftServiceError(
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
    minimumStandard: draft.minimumStandard,
    imagePrompt: draft.imagePrompt,
    imageNegativePrompt: draft.imageNegativePrompt
  };
}

function assertCanRegenerateImage(draft: AiCardDraftDetail) {
  if (draft.status !== "ready" && draft.status !== "failed") {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Image regeneration is only available for ready or failed drafts."
    );
  }
}

function assertCanRetry(draft: AiCardDraftDetail) {
  if (draft.status !== "failed") {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Retry is only available for failed drafts."
    );
  }
}

function assertCanPutInPlay(draft: AiCardDraftDetail) {
  if (draft.status !== "ready") {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Only ready AI card drafts can be put in play."
    );
  }
}

function assertCanUpdate(draft: AiCardDraftDetail) {
  if (draft.status === "accepted" || draft.status === "canceled") {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Accepted or canceled AI card drafts cannot be edited."
    );
  }
}

function sourceText(draft: AiCardDraftDetail) {
  return draft.audioTranscript ?? draft.inputText ?? null;
}

async function generateCover(
  deps: AiCardDraftServiceDeps,
  householdId: HouseholdId,
  draftId: AiCardDraftId,
  card: StructuredAiCard
) {
  await deps.markStage({ householdId, draftId, stage: "generating_image" });
  const cover = await deps.generateCardCover({
    title: card.title,
    imagePrompt: card.imagePrompt,
    negativePrompt: card.imageNegativePrompt
  });
  await deps.markStage({ householdId, draftId, stage: "saving_image" });
  await deps.saveCover({
    householdId,
    draftId,
    bytes: cover.bytes,
    mimeType: cover.mimeType
  });
  return deps.markStage({ householdId, draftId, stage: "ready" });
}

async function structureAndGenerate(
  deps: AiCardDraftServiceDeps,
  input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    taskText: string;
    existingDraft?: Partial<StructuredAiCard>;
  }
) {
  await deps.markStage({
    householdId: input.householdId,
    draftId: input.draftId,
    stage: "structuring"
  });
  const card = await deps.structureTaskAsCard({
    taskText: input.taskText,
    ...(input.existingDraft ? { existingDraft: input.existingDraft } : {})
  });
  await deps.saveGeneration({
    householdId: input.householdId,
    draftId: input.draftId,
    card
  });
  return generateCover(deps, input.householdId, input.draftId, card);
}

async function failDraft(
  deps: AiCardDraftServiceDeps,
  householdId: HouseholdId,
  draftId: AiCardDraftId,
  error: unknown
): Promise<never> {
  const message = errorMessage(error);
  await deps.saveFailure({
    householdId,
    draftId,
    failureCode: "GENERATION_FAILED",
    failureMessage: message
  });
  throw new AiCardDraftServiceError("GENERATION_FAILED", message);
}

function assertAudioSize(bytes: Uint8Array | Buffer) {
  if (bytes.byteLength > MAX_AUDIO_BYTES) {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Audio uploads are limited to 10 MB."
    );
  }
}

export function createAiCardDraftService(
  deps: AiCardDraftServiceDeps = defaultDeps
) {
  return {
    async list(session: CurrentSession): Promise<AiCardDraftSummary[]> {
      requireSelectedPersona(session);
      return deps.listDrafts(session.householdId);
    },

    async get(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<AiCardDraftDetail> {
      requireSelectedPersona(session);
      return getRequiredDraft(deps, session, draftId);
    },

    async createFromText(
      session: CurrentSession,
      input: { inputText: string }
    ): Promise<AiCardDraftDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      if (!input.inputText.trim()) {
        throw new AiCardDraftServiceError("INVALID_INPUT", "Text input is required.");
      }

      const draft = await deps.createDraft({
        householdId: session.householdId,
        createdByPersonaId,
        sourceInputType: "text",
        inputText: input.inputText
      });

      try {
        return await structureAndGenerate(deps, {
          householdId: session.householdId,
          draftId: draft.id,
          taskText: input.inputText
        });
      } catch (error) {
        return failDraft(deps, session.householdId, draft.id, error);
      }
    },

    async createFromAudio(
      session: CurrentSession,
      input: {
        audioBytes: Uint8Array | Buffer;
        audioMimeType: string;
        contextText?: string;
      }
    ): Promise<AiCardDraftDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      assertAudioSize(input.audioBytes);

      const draft = await deps.createDraft({
        householdId: session.householdId,
        createdByPersonaId,
        sourceInputType: "audio",
        audioBytes: input.audioBytes,
        audioMimeType: input.audioMimeType
      });

      try {
        await deps.markStage({
          householdId: session.householdId,
          draftId: draft.id,
          stage: "transcribing"
        });
        const transcript = await deps.transcribeAudio({
          bytes: input.audioBytes,
          mimeType: input.audioMimeType,
          contextText: input.contextText
        });
        await deps.saveGeneration({
          householdId: session.householdId,
          draftId: draft.id,
          audioTranscript: transcript
        });

        return await structureAndGenerate(deps, {
          householdId: session.householdId,
          draftId: draft.id,
          taskText: transcript
        });
      } catch (error) {
        return failDraft(deps, session.householdId, draft.id, error);
      }
    },

    async update(
      session: CurrentSession,
      draftId: AiCardDraftId,
      update: AiCardDraftUpdate
    ): Promise<AiCardDraftDetail> {
      requireSelectedPersona(session);
      const draft = await getRequiredDraft(deps, session, draftId);
      assertCanUpdate(draft);
      return deps.updateDraft({
        householdId: session.householdId,
        draftId,
        update
      });
    },

    async retry(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<AiCardDraftDetail> {
      requireSelectedPersona(session);
      const draft = await getRequiredDraft(deps, session, draftId);
      assertCanRetry(draft);

      try {
        const card = (() => {
          try {
            return requireGeneratedFields(draft);
          } catch {
            return null;
          }
        })();
        if (card) {
          return await generateCover(deps, session.householdId, draftId, card);
        }

        if (draft.sourceInputType === "audio" && !draft.audioTranscript) {
          const audio = await deps.getDraftAudio({
            householdId: session.householdId,
            draftId
          });
          if (!audio) {
            throw new AiCardDraftServiceError(
              "INVALID_INPUT",
              "Audio draft no longer has source audio to retry."
            );
          }

          await deps.markStage({
            householdId: session.householdId,
            draftId,
            stage: "transcribing"
          });
          const transcript = await deps.transcribeAudio({
            bytes: audio.bytes,
            mimeType: audio.mimeType
          });
          await deps.saveGeneration({
            householdId: session.householdId,
            draftId,
            audioTranscript: transcript
          });
          return await structureAndGenerate(deps, {
            householdId: session.householdId,
            draftId,
            taskText: transcript
          });
        }

        const taskText = sourceText(draft);
        if (!taskText) {
          throw new AiCardDraftServiceError(
            "INVALID_INPUT",
            "AI card draft does not have source text to retry."
          );
        }

        return await structureAndGenerate(deps, {
          householdId: session.householdId,
          draftId,
          taskText
        });
      } catch (error) {
        if (error instanceof AiCardDraftServiceError && error.code !== "GENERATION_FAILED") {
          throw error;
        }
        return failDraft(deps, session.householdId, draftId, error);
      }
    },

    async regenerateImage(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<AiCardDraftDetail> {
      requireSelectedPersona(session);
      const draft = await getRequiredDraft(deps, session, draftId);
      assertCanRegenerateImage(draft);
      const card = requireGeneratedFields(draft);

      try {
        return await generateCover(deps, session.householdId, draftId, card);
      } catch (error) {
        return failDraft(deps, session.householdId, draftId, error);
      }
    },

    async putInPlay(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<ResponsibilityDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      const draft = await getRequiredDraft(deps, session, draftId);
      assertCanPutInPlay(draft);
      try {
        return await deps.acceptDraftAsResponsibility({
          householdId: session.householdId,
          createdByPersonaId,
          draftId
        });
      } catch (error) {
        mapRepositoryServiceError(error);
      }
    },

    async cancel(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<AiCardDraftDetail> {
      requireSelectedPersona(session);
      await getRequiredDraft(deps, session, draftId);
      const canceled = await deps.cancelDraft({
        householdId: session.householdId,
        draftId
      });
      await deps.deleteAudio({
        householdId: session.householdId,
        draftId
      });
      return canceled;
    },

    async getCover(
      session: CurrentSession,
      draftId: AiCardDraftId
    ): Promise<{ bytes: Uint8Array | Buffer; mimeType: string }> {
      requireSelectedPersona(session);
      await getRequiredDraft(deps, session, draftId);
      const cover = await deps.getCover({
        householdId: session.householdId,
        draftId
      });

      if (!cover) {
        throw new AiCardDraftServiceError(
          "NOT_FOUND",
          "AI card draft cover not found for this household."
        );
      }

      return cover;
    }
  };
}

export const aiCardDraftService = createAiCardDraftService();
