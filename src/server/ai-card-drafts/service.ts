import type {
  AiCardDraftDetail,
  AiCardDraftSummary,
  AiCardDraftUpdate
} from "@/contracts/ai-card-drafts";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import type { HouseholdId, PersonaId } from "@/domain/ids";
import {
  structureTaskAsCard,
  type StructuredAiCard
} from "@/server/ai/card-generator";
import {
  logAiGenerationDiagnostic,
  serializeAiError,
  type AiDiagnosticsContext
} from "@/server/ai/diagnostics";
import type { CurrentSession } from "@/server/auth/current-session";
import {
  acceptAiCardDraftAsResponsibility,
  cancelAiCardDraft,
  createAiCardDraft,
  getAiCardDraft,
  getAiCardDraftCover,
  listAiCardDrafts,
  markAiCardDraftStage,
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
  readonly draftId?: AiCardDraftId;

  constructor(
    code: AiCardDraftServiceErrorCode,
    message: string,
    options: { draftId?: AiCardDraftId } = {}
  ) {
    super(message);
    this.name = "AiCardDraftServiceError";
    this.code = code;
    this.draftId = options.draftId;
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
    sourceInputType: "text";
    inputText?: string;
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
  }) => Promise<AiCardDraftDetail>;
  saveFailure: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    failureCode: string;
    failureMessage: string;
  }) => Promise<AiCardDraftDetail>;
  cancelDraft: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<AiCardDraftDetail>;
  getCover: (input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
  }) => Promise<{ bytes: Uint8Array | Buffer; mimeType: string } | null>;
  structureTaskAsCard: (
    input: {
      taskText: string;
      existingDraft?: Partial<StructuredAiCard>;
    },
    diagnostics?: AiDiagnosticsContext
  ) => Promise<StructuredAiCard>;
  acceptDraftAsResponsibility: typeof acceptAiCardDraftAsResponsibility;
};

type AiCardGenerationStage = AiCardDraftDetail["generationStage"];

const defaultDeps: AiCardDraftServiceDeps = {
  listDrafts: listAiCardDrafts,
  getDraft: getAiCardDraft,
  createDraft: createAiCardDraft,
  updateDraft: updateAiCardDraft,
  markStage: markAiCardDraftStage,
  saveGeneration: saveAiCardDraftGeneration,
  saveFailure: saveAiCardDraftFailure,
  cancelDraft: cancelAiCardDraft,
  getCover: getAiCardDraftCover,
  structureTaskAsCard,
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
    !draft.minimumStandard
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
    minimumStandard: draft.minimumStandard
  };
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

function assertCanCancel(draft: AiCardDraftDetail) {
  if (draft.status === "accepted" || draft.status === "canceled") {
    throw new AiCardDraftServiceError(
      "INVALID_INPUT",
      "Accepted or canceled AI card drafts cannot be canceled."
    );
  }
}

async function structureAndGenerate(
  deps: AiCardDraftServiceDeps,
  input: {
    householdId: HouseholdId;
    draftId: AiCardDraftId;
    taskText: string;
    existingDraft?: Partial<StructuredAiCard>;
    diagnostics?: AiDiagnosticsContext;
  }
) {
  await deps.markStage({
    householdId: input.householdId,
    draftId: input.draftId,
    stage: "structuring"
  });
  const structureInput = {
    taskText: input.taskText,
    ...(input.existingDraft ? { existingDraft: input.existingDraft } : {})
  };
  const card = input.diagnostics
    ? await deps.structureTaskAsCard(structureInput, input.diagnostics)
    : await deps.structureTaskAsCard(structureInput);
  await deps.saveGeneration({
    householdId: input.householdId,
    draftId: input.draftId,
    card
  });
  return deps.markStage({
    householdId: input.householdId,
    draftId: input.draftId,
    stage: "ready"
  });
}

async function failDraft(
  deps: AiCardDraftServiceDeps,
  householdId: HouseholdId,
  draftId: AiCardDraftId,
  error: unknown,
  diagnostics?: AiDiagnosticsContext
): Promise<never> {
  const message = "AI card draft generation failed.";
  await deps.saveFailure({
    householdId,
    draftId,
    failureCode: "GENERATION_FAILED",
    failureMessage: message
  });
  if (diagnostics) {
    const serialized = serializeAiError(error);
    logAiGenerationDiagnostic({
      ...diagnostics,
      draftId,
      errorCode: serialized.code,
      errorName: serialized.name,
      event: "generation_failed",
      model: serialized.model,
      provider: serialized.provider,
      providerRequestId: serialized.providerRequestId,
      status: serialized.status
    });
  }
  throw new AiCardDraftServiceError("GENERATION_FAILED", message, { draftId });
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
      input: { inputText: string },
      diagnostics?: AiDiagnosticsContext
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
          taskText: input.inputText,
          diagnostics
        });
      } catch (error) {
        return failDraft(deps, session.householdId, draft.id, error, diagnostics);
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
      draftId: AiCardDraftId,
      diagnostics?: AiDiagnosticsContext
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
          return deps.markStage({
            householdId: session.householdId,
            draftId,
            stage: "ready"
          });
        }

        const taskText = draft.inputText;
        if (!taskText) {
          throw new AiCardDraftServiceError(
            "INVALID_INPUT",
            "AI card draft does not have source text to retry."
          );
        }

        return await structureAndGenerate(deps, {
          householdId: session.householdId,
          draftId,
          taskText,
          diagnostics
        });
      } catch (error) {
        if (error instanceof AiCardDraftServiceError && error.code !== "GENERATION_FAILED") {
          throw error;
        }
        return failDraft(deps, session.householdId, draftId, error, diagnostics);
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
      const draft = await getRequiredDraft(deps, session, draftId);
      assertCanCancel(draft);
      const canceled = await deps.cancelDraft({
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
