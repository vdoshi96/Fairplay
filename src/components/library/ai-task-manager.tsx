/* eslint-disable @next/next/no-img-element */
"use client";

import {
  CheckCircle2,
  CircleX,
  Loader2,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AiCardDraftDetail,
  AiCardDraftSummary,
  AiCardDraftUpdate
} from "@/contracts/ai-card-drafts";
import { CADENCES } from "@/domain/enums";
import {
  completeGuidePractice,
  useGuidePracticeRequest
} from "@/components/guide/guide-practice";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";

type AiTaskManagerProps = {
  drafts: AiCardDraftSummary[];
};

type PendingAction =
  | `cancel:${string}`
  | `remove:${string}`
  | `put-in-play:${string}`
  | `retry:${string}`
  | `save:${string}`
  | null;

type TrackedAiCardDraft = AiCardDraftSummary & {
  isOptimistic?: boolean;
  isLocalOnly?: boolean;
  localInputText?: string;
};

const statusLabels: Record<AiCardDraftSummary["status"], string> = {
  accepted: "Accepted",
  canceled: "Canceled",
  failed: "Generation failed",
  processing: "Generating",
  ready: "Completed"
};

const stageLabels: Record<AiCardDraftSummary["generationStage"], string> = {
  failed: "Failed",
  queued: "Queued",
  ready: "Completed",
  structuring: "Generating"
};

export function AiTaskManager({ drafts }: AiTaskManagerProps) {
  const router = useRouter();
  const pendingCreateControllersRef = useRef(new Map<string, AbortController>());
  const [captureOpen, setCaptureOpen] = useState(false);
  const [discardedDraftIds, setDiscardedDraftIds] = useState<Set<string>>(
    () => new Set()
  );
  const [localDrafts, setLocalDrafts] = useState<TrackedAiCardDraft[]>([]);
  const [reviewDraft, setReviewDraft] = useState<TrackedAiCardDraft | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const openLibraryPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);

  useGuidePracticeRequest("library-practice-start", openLibraryPractice);

  const trackedDrafts = useMemo(() => {
    const serverIds = new Set(drafts.map((draft) => draft.id));
    const localDraftById = new Map(localDrafts.map((draft) => [draft.id, draft]));
    const localOnlyDrafts = localDrafts.filter(
      (draft) => draft.isOptimistic || !serverIds.has(draft.id)
    );
    const mergedServerDrafts = drafts.map((draft) => {
      const localDraft = localDraftById.get(draft.id);

      return localDraft ? newestDraft(localDraft, draft) : draft;
    });

    return [
      ...localOnlyDrafts,
      ...mergedServerDrafts
    ].filter((draft) => !discardedDraftIds.has(draft.id));
  }, [discardedDraftIds, drafts, localDrafts]);

  useEffect(() => {
    setReviewDraft((current) => {
      if (!current) {
        return current;
      }

      return trackedDrafts.find((draft) => draft.id === current.id) ?? null;
    });
  }, [trackedDrafts]);

  async function mutateDraft(path: string, action: Exclude<PendingAction, null>) {
    setPendingAction(action);
    setError(null);

    try {
      const response = await fetch(path, { method: "POST" });
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The draft could not be updated."
        );
        if (apiError.code === "GENERATION_FAILED") {
          router.refresh();
        }
        throw new Error(apiError.message);
      }
      const updated = (await response.json()) as AiCardDraftDetail | AiCardDraftSummary;
      const reconciled = reconcileDraftUpdate(updated);
      setReviewDraft((current) =>
        current?.id === reconciled.id
          ? reconciled.status === "canceled"
            ? null
            : reconciled
          : current
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be updated.");
    } finally {
      setPendingAction(null);
    }
  }

  async function putInPlay(draftId: string) {
    setPendingAction(`put-in-play:${draftId}`);
    setError(null);

    try {
      const response = await fetch(`/api/ai-card-drafts/${draftId}/put-in-play`, {
        method: "POST"
      });
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The card could not be put in play."
        );
        throw new Error(apiError.message);
      }

      const created = (await response.json()) as {
        id?: string;
        acceptedResponsibilityId?: string | null;
      };
      router.refresh();
      const responsibilityId = created.id ?? created.acceptedResponsibilityId;
      if (responsibilityId) {
        router.push(`/app/responsibilities/${responsibilityId}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The card could not be put in play.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="grid gap-3" aria-label="AI Task Manager">
      <div
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        data-guide-id="library-ai-task-manager"
      >
        <div className="grid min-w-0 gap-1">
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            AI-created cards
          </p>
          <h2 className="text-[20px] font-bold leading-6 text-fp-ink">
            Draft tracker
          </h2>
        </div>
        <div
          className="grid justify-items-center gap-0"
          data-testid="greg-taskmaster-control"
        >
          <GregTaskmasterAvatar />
          <Button onClick={() => setCaptureOpen((open) => !open)} variant="primary">
            <Sparkles aria-hidden="true" size={16} />
            Greg - The Taskmaster
          </Button>
        </div>
      </div>

      {captureOpen ? (
        <AiCardCaptureSheet
          onCancel={() => setCaptureOpen(false)}
          onSubmit={(inputText) => {
            const clientId = createClientDraftId();
            const optimisticDraft = createOptimisticDraft(clientId, inputText);
            setLocalDrafts((current) => [optimisticDraft, ...current]);
            setError(null);
            void createTextDraft(clientId, inputText);
          }}
        />
      ) : null}

      {practiceOpen ? <LibraryPracticeWorkflow /> : null}

      <AiCardTracker
        drafts={trackedDrafts}
        onCancel={cancelDraft}
        onRemove={discardDraft}
        onPutInPlay={putInPlay}
        onRetry={(draftId) =>
          mutateDraft(`/api/ai-card-drafts/${draftId}/retry`, `retry:${draftId}`)
        }
        onReview={setReviewDraft}
        pendingAction={pendingAction}
      />

      {error ? (
        <p className="rounded border border-fp-line bg-white p-3 text-[14px] font-semibold text-fp-muted-ink">
          {error}
        </p>
      ) : null}

      {reviewDraft ? (
        <AiCardReviewPanel
          draft={reviewDraft}
          isCanceling={pendingAction === `cancel:${reviewDraft.id}`}
          isRemoving={pendingAction === `remove:${reviewDraft.id}`}
          isPuttingInPlay={pendingAction === `put-in-play:${reviewDraft.id}`}
          isRetrying={pendingAction === `retry:${reviewDraft.id}`}
          onActionError={setError}
          onCancel={() => cancelDraft(reviewDraft.id)}
          onClose={() => setReviewDraft(null)}
          onRemove={() => discardDraft(reviewDraft.id)}
          onPutInPlay={() => putInPlay(reviewDraft.id)}
          onRetry={() =>
            mutateDraft(`/api/ai-card-drafts/${reviewDraft.id}/retry`, `retry:${reviewDraft.id}`)
          }
        />
      ) : null}
    </section>
  );

  function cancelDraft(draftId: string) {
    const controller = pendingCreateControllersRef.current.get(draftId);
    if (controller) {
      controller.abort();
      pendingCreateControllersRef.current.delete(draftId);
      hideDraft(draftId);
      return;
    }

    void mutateDraft(`/api/ai-card-drafts/${draftId}/cancel`, `cancel:${draftId}`);
  }

  function reconcileDraftUpdate(updated: AiCardDraftDetail | AiCardDraftSummary) {
    const fallbackInput =
      "inputText" in updated ? updated.inputText ?? updated.promptPreview : updated.promptPreview;
    const existing = localDrafts.find((draft) => draft.id === updated.id);
    const reconciled = summaryFromCreatedDraft(
      updated,
      existing?.localInputText ?? fallbackInput
    );

    setLocalDrafts((current) => replaceLocalDraft(current, updated.id, reconciled));

    return reconciled;
  }

  async function discardDraft(draftId: string) {
    setPendingAction(`remove:${draftId}`);
    setError(null);

    const controller = pendingCreateControllersRef.current.get(draftId);
    if (controller) {
      controller.abort();
      pendingCreateControllersRef.current.delete(draftId);
      hideDraft(draftId);
      setPendingAction(null);
      return;
    }

    if (isLocalOnlyDraft(draftId)) {
      hideDraft(draftId);
      setPendingAction(null);
      return;
    }

    try {
      const response = await fetch(`/api/ai-card-drafts/${draftId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The draft could not be removed."
        );
        throw new Error(apiError.message);
      }
      hideDraft(draftId);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be removed.");
    } finally {
      setPendingAction(null);
    }
  }

  function hideDraft(draftId: string) {
    setDiscardedDraftIds((current) => new Set(current).add(draftId));
    setLocalDrafts((current) => current.filter((draft) => draft.id !== draftId));
    setReviewDraft((current) => (current?.id === draftId ? null : current));
  }

  function isLocalOnlyDraft(draftId: string) {
    return localDrafts.some((draft) => draft.id === draftId && draft.isLocalOnly);
  }

  async function createTextDraft(clientId: string, inputText: string) {
    const controller = new AbortController();
    pendingCreateControllersRef.current.set(clientId, controller);

    try {
      const response = await fetch("/api/ai-card-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText }),
        signal: controller.signal
      });
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The draft could not be created."
        );
        const failedId = apiError.draftId ?? clientId;
        setLocalDrafts((current) =>
          replaceLocalDraft(
            current,
            clientId,
            {
              ...(current.find((draft) => draft.id === clientId) ??
                createOptimisticDraft(clientId, inputText)),
              id: failedId,
              generationStage: "failed",
              status: "failed",
              failureMessage: apiError.message,
              isLocalOnly: !apiError.draftId,
              isOptimistic: false
            }
          )
        );
        if (apiError.code === "GENERATION_FAILED") {
          router.refresh();
        }
        throw new Error(apiError.message);
      }

      const created = (await response.json()) as AiCardDraftDetail | AiCardDraftSummary;
      setLocalDrafts((current) =>
        replaceLocalDraft(
          current,
          clientId,
          {
            ...(current.find((draft) => draft.id === clientId) ??
              createOptimisticDraft(clientId, inputText)),
            ...summaryFromCreatedDraft(created, inputText),
            isOptimistic: false,
            localInputText: inputText
          }
        )
      );
      router.refresh();
    } catch (caught) {
      if (isAbortError(caught)) {
        return;
      }
      const message = caught instanceof Error ? caught.message : "The draft could not be created.";
      setError(message);
      setLocalDrafts((current) =>
        current.map((draft) =>
          draft.id === clientId
            ? {
                ...draft,
                generationStage: "failed",
                status: "failed",
                failureMessage: draft.failureMessage ?? message,
                isLocalOnly: draft.isLocalOnly ?? true,
                isOptimistic: false
              }
            : draft
          )
      );
    } finally {
      pendingCreateControllersRef.current.delete(clientId);
    }
  }
}

function LibraryPracticeWorkflow() {
  const [request, setRequest] = useState("");
  const [draftCreated, setDraftCreated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [title, setTitle] = useState("Lunch packing handoff");
  const [summary, setSummary] = useState(
    "Keep lunch kits reset, packed, and ready before school mornings."
  );
  const [putInPlayPreviewed, setPutInPlayPreviewed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  function cleanUpWorkspace() {
    setRequest("");
    setDraftCreated(false);
    setReviewOpen(false);
    setTitle("Lunch packing handoff");
    setSummary("Keep lunch kits reset, packed, and ready before school mornings.");
    setPutInPlayPreviewed(false);
    setStatus("Dummy Library workspace cleaned up.");
  }

  return (
    <section
      aria-label="Dummy Library practice"
      className="relative z-[60] grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-4 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-practice-surface
    >
      <div className="grid gap-1">
        <h3 className="text-[16px] font-bold text-fp-ink">
          Dummy Library practice
        </h3>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          About this feature: practice Greg capture, draft review, text edits,
          and putting a card in play. Demo data is temporary; nothing permanent
          is created.
        </p>
      </div>

      <div className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Dummy card request
          <textarea
            aria-label="Dummy card request"
            className="min-h-20 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[14px] text-fp-ink"
            onChange={(event) => setRequest(event.target.value)}
            value={request}
          />
          <span className="text-[12px] font-normal leading-4 text-fp-muted-ink">
            Type the responsibility you want Greg to structure. This only feeds
            the temporary workspace below.
          </span>
        </label>
        <button
          className="min-h-10 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary disabled:opacity-60 sm:w-fit"
          disabled={request.trim().length === 0}
          onClick={() => {
            setDraftCreated(true);
            mark("library-capture-filled", "Dummy draft created from Greg capture.");
          }}
          type="button"
        >
          Create dummy draft
        </button>
      </div>

      {draftCreated ? (
        <section
          aria-label="Temporary Library workspace"
          className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3"
        >
          <div className="grid gap-1">
            <h4 className="text-[14px] font-bold text-fp-ink">
              Temporary Library workspace
            </h4>
            <p className="text-[13px] leading-5 text-fp-muted-ink">
              This temporary workspace keeps mock artifacts visible while
              onboarding is open. Clean it up when you are done practicing.
            </p>
          </div>
          <div className="grid gap-1">
            <p className="text-[13px] font-bold text-fp-ink">{title}</p>
            <p className="text-[13px] leading-5 text-fp-muted-ink">{summary}</p>
            <p className="text-[12px] leading-4 text-fp-muted-ink">
              Mock artifact: Greg draft, not a household card.
            </p>
          </div>
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
            onClick={() => {
              setReviewOpen(true);
              mark("library-draft-reviewed", "Dummy draft opened for review.");
            }}
            type="button"
          >
            Review dummy draft
          </button>
        </section>
      ) : null}

      {reviewOpen ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <div className="grid gap-3 md:grid-cols-[minmax(9rem,14rem)_1fr]">
            <div className="grid min-h-40 place-items-center rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 text-center text-[13px] font-bold text-fp-muted-ink">
              Dummy text card preview
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
                Dummy draft title
                <input
                  aria-label="Dummy draft title"
                  className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] text-fp-ink"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
                <span className="text-[12px] font-normal leading-4 text-fp-muted-ink">
                  This is the card name learners would confirm before saving.
                </span>
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
                Dummy summary
                <textarea
                  aria-label="Dummy summary"
                  className="min-h-20 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[14px] text-fp-ink"
                  onChange={(event) => setSummary(event.target.value)}
                  value={summary}
                />
                <span className="text-[12px] font-normal leading-4 text-fp-muted-ink">
                  This explains the expected outcome before the card is put in
                  play.
                </span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary"
              onClick={() =>
                mark("library-draft-edited", "Dummy draft edits saved.")
              }
              type="button"
            >
              Save dummy edits
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() => {
                setPutInPlayPreviewed(true);
                mark(
                  "library-put-in-play",
                  "Dummy card is ready for the Load Map. No real card was created."
                );
              }}
              type="button"
            >
              Put dummy card in play
            </button>
          </div>
          {putInPlayPreviewed ? (
            <article className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3">
              <h4 className="text-[14px] font-bold text-fp-ink">
                Mock Load Map artifact
              </h4>
              <p className="text-[13px] leading-5 text-fp-muted-ink">{title}</p>
              <p className="text-[12px] leading-4 text-fp-muted-ink">
                Preview only. It persists during onboarding and is removed by
                cleanup.
              </p>
            </article>
          ) : null}
        </div>
      ) : null}

      {draftCreated ? (
        <button
          className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
          onClick={cleanUpWorkspace}
          type="button"
        >
          Clean up dummy workspace
        </button>
      ) : null}

      {status ? (
        <p
          className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3 text-[13px] font-semibold text-fp-muted-ink"
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}

function GregTaskmasterAvatar() {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="pointer-events-none -mb-2 h-20 w-20 shrink-0 object-contain sm:-mb-3 sm:h-24 sm:w-24"
      data-testid="greg-taskmaster-avatar"
      draggable={false}
      height={1254}
      src="/assets/fairplay/generated-ui/greg-taskmaster-avatar.png"
      width={1254}
    />
  );
}

export function AiCardTracker({
  drafts,
  onCancel,
  onRemove,
  onPutInPlay,
  onRetry,
  onReview,
  pendingAction
}: {
  drafts: TrackedAiCardDraft[];
  onCancel: (draftId: string) => void;
  onRemove: (draftId: string) => void;
  onPutInPlay: (draftId: string) => void;
  onRetry: (draftId: string) => void;
  onReview: (draft: TrackedAiCardDraft) => void;
  pendingAction: PendingAction;
}) {
  return (
    <section
      aria-label="AI-created cards"
      className="grid gap-3 rounded border border-fp-line bg-white p-4 shadow-[var(--fp-shadow-soft)]"
    >
      {drafts.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {drafts.map((draft) => (
            <article
              aria-label={`${draft.title ?? draft.promptPreview} ${draft.status} draft`}
              className="grid gap-3 rounded border border-fp-line bg-fp-surface p-3"
              key={draft.id}
            >
              <button
                className="grid gap-3 text-left"
                onClick={() => onReview(draft)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-bold text-fp-ink">
                      {draft.title ?? draft.promptPreview}
                    </h3>
                    <p className="line-clamp-2 text-[13px] leading-5 text-fp-muted-ink">
                      {draft.summary ?? draft.promptPreview}
                    </p>
                  </div>
                  <DraftStatusChip draft={draft} />
                </div>

                <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-fp-muted-ink">
                  <Chip>{stageLabels[draft.generationStage]}</Chip>
                  <Chip>Text</Chip>
                </div>
              </button>

              {draft.failureMessage ? (
                <p className="rounded border border-fp-line bg-white p-3 text-[13px] leading-5 text-fp-muted-ink">
                  {draft.failureMessage}
                </p>
              ) : null}

              {draft.status === "failed" ? (
                <div className="flex flex-wrap gap-2">
                  {!draft.isLocalOnly ? (
                    <Button
                      disabled={pendingAction === `retry:${draft.id}`}
                      onClick={() => onRetry(draft.id)}
                    >
                      <RefreshCcw aria-hidden="true" size={16} />
                      Retry
                    </Button>
                  ) : null}
                  <Button
                    disabled={pendingAction === `remove:${draft.id}`}
                    onClick={() => onRemove(draft.id)}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
              ) : null}

              {draft.status === "canceled" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={pendingAction === `remove:${draft.id}`}
                    onClick={() => onRemove(draft.id)}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
              ) : null}

              {draft.status === "processing" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={pendingAction === `cancel:${draft.id}`}
                    onClick={() => onCancel(draft.id)}
                    variant="ghost"
                  >
                    <CircleX aria-hidden="true" size={16} />
                    Cancel
                  </Button>
                </div>
              ) : null}

              {draft.status === "ready" ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => onReview(draft)}>
                    <CheckCircle2 aria-hidden="true" size={16} />
                    Review
                  </Button>
                  <Button
                    disabled={pendingAction === `put-in-play:${draft.id}`}
                    onClick={() => onPutInPlay(draft.id)}
                    variant="primary"
                  >
                    <Send aria-hidden="true" size={16} />
                    Put in play
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed border-fp-line bg-fp-surface p-4 text-[14px] font-semibold text-fp-muted-ink">
          No AI-created cards yet.
        </p>
      )}
    </section>
  );
}

export function AiCardCaptureSheet({
  onCancel,
  onSubmit
}: {
  onCancel: () => void;
  onSubmit: (inputText: string) => void;
}) {
  const [inputText, setInputText] = useState("");
  const trimmedInput = inputText.trim();
  const canSubmit = trimmedInput.length > 0;

  function cancel() {
    onCancel();
  }

  function submit() {
    if (!canSubmit) {
      return;
    }

    setInputText("");
    onSubmit(trimmedInput);
  }

  return (
    <Sheet aria-label="Capture AI card draft" className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-[18px] font-bold text-fp-ink">Capture a card</h3>
          <p className="text-[14px] leading-6 text-fp-muted-ink">
            Describe the work Greg should turn into a structured text card.
          </p>
        </div>
        <Button aria-label="Close capture" onClick={cancel} variant="ghost">
          <X aria-hidden="true" size={16} />
        </Button>
      </div>

      <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
        Describe the card
        <textarea
          aria-label="Describe the card"
          className="min-h-28 rounded border border-fp-line bg-white px-3 py-2 text-[15px] leading-6 text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
          onChange={(event) => setInputText(event.target.value)}
          placeholder="What needs to happen, who notices it, and what done looks like..."
          value={inputText}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canSubmit} onClick={submit} variant="primary">
          <Send aria-hidden="true" size={16} />
          Create draft
        </Button>
        <Button onClick={cancel}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}

export function AiCardReviewPanel({
  draft,
  isCanceling,
  isRemoving,
  isPuttingInPlay,
  isRetrying,
  onActionError,
  onCancel,
  onClose,
  onRemove,
  onPutInPlay,
  onRetry
}: {
  draft: TrackedAiCardDraft;
  isCanceling: boolean;
  isRemoving: boolean;
  isPuttingInPlay: boolean;
  isRetrying: boolean;
  onActionError: (message: string | null) => void;
  onCancel: () => void;
  onClose: () => void;
  onRemove: () => void;
  onPutInPlay: () => void;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<AiCardDraftDetail | null>(null);
  const [isLoading, setIsLoading] = useState(
    draft.status === "ready" || draft.status === "accepted"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ReviewForm>(() => reviewFormFromDraft(draft));

  useEffect(() => {
    let active = true;
    const shouldLoadDetail = draft.status === "ready" || draft.status === "accepted";

    if (!shouldLoadDetail) {
      setIsLoading(false);
      setDetail(null);
      setForm(reviewFormFromDraft(draft));
      return () => {
        active = false;
      };
    }

    async function loadDetail() {
      setIsLoading(true);
      onActionError(null);

      try {
        const response = await fetch(`/api/ai-card-drafts/${draft.id}`);
        if (!response.ok) {
          const apiError = await readSafeApiError(
            response,
            "The draft could not be loaded."
          );
          throw new Error(apiError.message);
        }
        const loaded = (await response.json()) as AiCardDraftDetail;
        if (active) {
          setDetail(loaded);
          setForm(reviewFormFromDraft(loaded));
        }
      } catch (caught) {
        if (active) {
          onActionError(caught instanceof Error ? caught.message : "The draft could not be loaded.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [draft, draft.id, draft.status, onActionError]);

  async function saveChanges() {
    if (!detail || !form.title.trim()) {
      return;
    }

    setIsSaving(true);
    onActionError(null);

    try {
      const update = reviewFormToUpdate(form);
      const response = await fetch(`/api/ai-card-drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      });
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The draft could not be saved."
        );
        throw new Error(apiError.message);
      }
      const saved = (await response.json()) as AiCardDraftDetail;
      setDetail(saved);
      setForm(reviewFormFromDraft(saved));
      router.refresh();
    } catch (caught) {
      onActionError(caught instanceof Error ? caught.message : "The draft could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  const originalPrompt = detail?.inputText ?? draft.localInputText ?? draft.promptPreview;
  const canEdit = draft.status === "ready";

  return (
    <Sheet aria-label="Review AI card draft" className="grid gap-4">
      <div className="grid content-start gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex flex-wrap gap-2">
              <Chip>{statusLabels[draft.status]}</Chip>
              <Chip>{stageLabels[draft.generationStage]}</Chip>
            </div>
            <h3 className="text-[22px] font-bold leading-7 text-fp-ink">
              {form.title || draft.title || draft.promptPreview}
            </h3>
          </div>
          <Button aria-label="Close review" onClick={onClose} variant="ghost">
            <X aria-hidden="true" size={16} />
          </Button>
        </div>

        <section className="grid gap-1 rounded border border-fp-line bg-fp-surface p-3">
          <p className="text-[12px] font-bold uppercase text-fp-muted-ink">
            Original prompt
          </p>
          <p className="text-[14px] leading-6 text-fp-ink">{originalPrompt}</p>
        </section>

        {isLoading ? (
          <p className="flex items-center gap-2 text-[14px] font-semibold text-fp-muted-ink">
            <Loader2 aria-hidden="true" size={16} />
            Loading draft...
          </p>
        ) : null}

        {draft.failureMessage ? (
          <section className="grid gap-1 rounded border border-fp-line bg-white p-3">
            <p className="text-[12px] font-bold uppercase text-fp-muted-ink">
              Error details
            </p>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              {draft.failureMessage}
            </p>
          </section>
        ) : null}

        {draft.status === "failed" ? (
          <div className="flex flex-wrap gap-2">
            {!draft.isLocalOnly ? (
              <Button disabled={isRetrying} onClick={onRetry}>
                <RefreshCcw aria-hidden="true" size={16} />
                Retry
              </Button>
            ) : null}
            <Button disabled={isRemoving} onClick={onRemove} variant="ghost">
              <Trash2 aria-hidden="true" size={16} />
              Remove
            </Button>
          </div>
        ) : null}

        {draft.status === "canceled" ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={isRemoving} onClick={onRemove} variant="ghost">
              <Trash2 aria-hidden="true" size={16} />
              Remove
            </Button>
          </div>
        ) : null}

        {draft.status === "processing" ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={isCanceling} onClick={onCancel}>
              <CircleX aria-hidden="true" size={16} />
              Cancel
            </Button>
          </div>
        ) : null}

        {canEdit ? (
          <>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label="Draft title"
              onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              value={form.title}
            />
            <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
              Cadence
              <select
                aria-label="Cadence"
                className="min-h-10 rounded border border-fp-line bg-white px-3 text-[15px] text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
                onChange={(event) =>
                  setForm((current) => ({ ...current, cadence: event.target.value }))
                }
                value={form.cadence}
              >
                <option value="">Not set</option>
                {CADENCES.map((cadence) => (
                  <option key={cadence} value={cadence}>
                    {cadence}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <TextArea
            label="Summary"
            onChange={(value) => setForm((current) => ({ ...current, summary: value }))}
            value={form.summary}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label="Area keys"
              onChange={(value) => setForm((current) => ({ ...current, areaKeys: value }))}
              value={form.areaKeys}
            />
            <TextInput
              label="Hidden effort keys"
              onChange={(value) =>
                setForm((current) => ({ ...current, hiddenEffortKeys: value }))
              }
              value={form.hiddenEffortKeys}
            />
          </div>
          <TextArea
            label="Definition"
            onChange={(value) => setForm((current) => ({ ...current, definition: value }))}
            value={form.definition}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <TextArea
              label="Conception"
              onChange={(value) => setForm((current) => ({ ...current, conception: value }))}
              value={form.conception}
            />
            <TextArea
              label="Planning"
              onChange={(value) => setForm((current) => ({ ...current, planning: value }))}
              value={form.planning}
            />
            <TextArea
              label="Execution"
              onChange={(value) => setForm((current) => ({ ...current, execution: value }))}
              value={form.execution}
            />
          </div>
          <TextArea
            label="Minimum standard"
            onChange={(value) =>
              setForm((current) => ({ ...current, minimumStandard: value }))
            }
            value={form.minimumStandard}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isLoading || isSaving || !form.title.trim()}
              onClick={saveChanges}
              variant="primary"
            >
              <CheckCircle2 aria-hidden="true" size={16} />
              Save changes
            </Button>
            <Button
              disabled
              title="Track for later is not available for generated drafts yet."
            >
              Track for later
            </Button>
            <Button disabled={isPuttingInPlay || isSaving} onClick={onPutInPlay}>
              <Send aria-hidden="true" size={16} />
              Put in play
            </Button>
          </div>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}

type ReviewForm = {
  areaKeys: string;
  cadence: string;
  conception: string;
  definition: string;
  execution: string;
  hiddenEffortKeys: string;
  minimumStandard: string;
  planning: string;
  summary: string;
  title: string;
};

function reviewFormFromDraft(
  draft: AiCardDraftDetail | AiCardDraftSummary
): ReviewForm {
  return {
    areaKeys: draft.areaKeys.join(", "),
    cadence: draft.cadence ?? "",
    conception: "conception" in draft ? draft.conception ?? "" : "",
    definition: "definition" in draft ? draft.definition ?? "" : "",
    execution: "execution" in draft ? draft.execution ?? "" : "",
    hiddenEffortKeys: draft.hiddenEffortKeys.join(", "),
    minimumStandard: "minimumStandard" in draft ? draft.minimumStandard ?? "" : "",
    planning: "planning" in draft ? draft.planning ?? "" : "",
    summary: draft.summary ?? "",
    title: draft.title ?? draft.promptPreview
  };
}

function reviewFormToUpdate(form: ReviewForm): AiCardDraftUpdate {
  return {
    title: form.title.trim(),
    summary: nullableText(form.summary),
    areaKeys: commaSeparatedValues(form.areaKeys),
    hiddenEffortKeys: commaSeparatedValues(
      form.hiddenEffortKeys
    ) as AiCardDraftUpdate["hiddenEffortKeys"],
    ...(form.cadence ? { cadence: form.cadence as AiCardDraftUpdate["cadence"] } : {}),
    definition: nullableText(form.definition),
    conception: nullableText(form.conception),
    planning: nullableText(form.planning),
    execution: nullableText(form.execution),
    minimumStandard: nullableText(form.minimumStandard)
  };
}

function commaSeparatedValues(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function createClientDraftId() {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
}

function isAbortError(caught: unknown) {
  return caught instanceof DOMException && caught.name === "AbortError";
}

function createOptimisticDraft(id: string, inputText: string): TrackedAiCardDraft {
  const now = new Date().toISOString();

  return {
    id,
    title: null,
    promptPreview: inputText,
    status: "processing",
    generationStage: "queued",
    sourceInputType: "text",
    summary: null,
    areaKeys: [],
    hiddenEffortKeys: [],
    cadence: null,
    failureMessage: null,
    acceptedResponsibilityId: null,
    createdAt: now,
    updatedAt: now,
    isOptimistic: true,
    isLocalOnly: true,
    localInputText: inputText
  };
}

function newestDraft(
  localDraft: TrackedAiCardDraft,
  serverDraft: AiCardDraftSummary
): TrackedAiCardDraft | AiCardDraftSummary {
  if (localDraft.isOptimistic) {
    return localDraft;
  }

  const localUpdatedAt = Date.parse(localDraft.updatedAt);
  const serverUpdatedAt = Date.parse(serverDraft.updatedAt);

  if (Number.isNaN(localUpdatedAt) || Number.isNaN(serverUpdatedAt)) {
    return localDraft;
  }

  return serverUpdatedAt > localUpdatedAt ? serverDraft : localDraft;
}

function replaceLocalDraft(
  drafts: TrackedAiCardDraft[],
  previousId: string,
  nextDraft: TrackedAiCardDraft
) {
  let inserted = false;
  const nextDrafts: TrackedAiCardDraft[] = [];

  for (const draft of drafts) {
    if (draft.id === previousId) {
      if (!inserted) {
        nextDrafts.push(nextDraft);
        inserted = true;
      }
      continue;
    }

    if (draft.id !== nextDraft.id) {
      nextDrafts.push(draft);
    }
  }

  return inserted ? nextDrafts : [nextDraft, ...nextDrafts];
}

function summaryFromCreatedDraft(
  draft: AiCardDraftDetail | AiCardDraftSummary,
  inputText: string
): TrackedAiCardDraft {
  return {
    id: draft.id,
    title: draft.title,
    promptPreview: draft.promptPreview || inputText,
    status: draft.status,
    generationStage: draft.generationStage,
    sourceInputType: "text",
    summary: draft.summary,
    areaKeys: draft.areaKeys,
    hiddenEffortKeys: draft.hiddenEffortKeys,
    cadence: draft.cadence,
    failureMessage: draft.failureMessage,
    acceptedResponsibilityId: draft.acceptedResponsibilityId,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    isLocalOnly: false,
    localInputText: "inputText" in draft ? draft.inputText ?? inputText : inputText
  };
}

async function readSafeApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      code?: unknown;
      draftId?: unknown;
      error?: unknown;
      requestId?: unknown;
    };
    const message = typeof body.error === "string" ? body.error : fallback;
    const requestId = typeof body.requestId === "string" ? body.requestId : null;

    return {
      code: typeof body.code === "string" ? body.code : null,
      draftId: typeof body.draftId === "string" ? body.draftId : null,
      message: requestId ? `${message} Reference ${requestId}.` : message
    };
  } catch {
    return { code: null, draftId: null, message: fallback };
  }
}

function TextInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
      {label}
      <input
        aria-label={label}
        className="min-h-10 rounded border border-fp-line bg-white px-3 text-[15px] text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
      {label}
      <textarea
        aria-label={label}
        className="min-h-24 rounded border border-fp-line bg-white px-3 py-2 text-[14px] leading-6 text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function DraftStatusChip({ draft }: { draft: AiCardDraftSummary }) {
  const icon =
    draft.status === "processing" ? (
      <Loader2 aria-hidden="true" className="mr-1 animate-spin" size={14} />
    ) : draft.status === "failed" || draft.status === "canceled" ? (
      <CircleX aria-hidden="true" className="mr-1" size={14} />
    ) : (
      <CheckCircle2 aria-hidden="true" className="mr-1" size={14} />
    );

  return (
    <Chip>
      {icon}
      {statusLabels[draft.status]}
    </Chip>
  );
}
