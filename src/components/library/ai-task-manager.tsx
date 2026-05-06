"use client";

import {
  CheckCircle2,
  CircleX,
  FileAudio,
  Loader2,
  Mic,
  RefreshCcw,
  Send,
  Sparkles,
  Square,
  X
} from "lucide-react";
import Image from "next/image";
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
  | "capture"
  | `cancel:${string}`
  | `put-in-play:${string}`
  | `regenerate-image:${string}`
  | `retry:${string}`
  | `save:${string}`
  | null;

const statusLabels: Record<AiCardDraftSummary["status"], string> = {
  accepted: "Accepted",
  canceled: "Canceled",
  failed: "Generation failed",
  processing: "Processing",
  ready: "Ready"
};

const stageLabels: Record<AiCardDraftSummary["generationStage"], string> = {
  failed: "Failed",
  generating_image: "Making cover",
  queued: "Queued",
  ready: "Generation complete",
  saving_image: "Saving cover",
  structuring: "Writing card",
  transcribing: "Transcribing"
};

export function AiTaskManager({ drafts }: AiTaskManagerProps) {
  const router = useRouter();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<AiCardDraftSummary | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const openLibraryPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);

  useGuidePracticeRequest("library-practice-start", openLibraryPractice);

  async function mutateDraft(path: string, action: Exclude<PendingAction, "capture" | null>) {
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
        className="flex flex-wrap items-center justify-between gap-3"
        data-guide-id="library-ai-task-manager"
      >
        <div className="grid gap-1">
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            AI-created cards
          </p>
          <h2 className="text-[20px] font-bold leading-6 text-fp-ink">
            Draft tracker
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <LittleAlexHorneSidekick />
          <Button onClick={() => setCaptureOpen((open) => !open)} variant="primary">
            <Sparkles aria-hidden="true" size={16} />
            greg - the taskmaster
          </Button>
        </div>
      </div>

      {captureOpen ? (
        <AiCardCaptureSheet
          isSubmitting={pendingAction === "capture"}
          onCancel={() => setCaptureOpen(false)}
          onSubmit={async (body) => {
            setPendingAction("capture");
            setError(null);

            try {
              const response = await fetch(
                "/api/ai-card-drafts",
                body instanceof FormData
                  ? { method: "POST", body }
                  : {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body)
                    }
              );
              if (!response.ok) {
                const apiError = await readSafeApiError(
                  response,
                  "The draft could not be created."
                );
                if (apiError.code === "GENERATION_FAILED") {
                  router.refresh();
                }
                throw new Error(apiError.message);
              }
              setCaptureOpen(false);
              router.refresh();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "The draft could not be created.");
            } finally {
              setPendingAction(null);
            }
          }}
        />
      ) : null}

      {practiceOpen ? <LibraryPracticeWorkflow /> : null}

      {error ? (
        <p className="rounded border border-fp-line bg-white p-3 text-[14px] font-semibold text-fp-muted-ink">
          {error}
        </p>
      ) : null}

      <AiCardTracker
        drafts={drafts}
        onCancel={(draftId) =>
          mutateDraft(`/api/ai-card-drafts/${draftId}/cancel`, `cancel:${draftId}`)
        }
        onPutInPlay={putInPlay}
        onRetry={(draftId) =>
          mutateDraft(`/api/ai-card-drafts/${draftId}/retry`, `retry:${draftId}`)
        }
        onReview={setReviewDraft}
        pendingAction={pendingAction}
      />

      {reviewDraft ? (
        <AiCardReviewPanel
          draft={reviewDraft}
          isPuttingInPlay={pendingAction === `put-in-play:${reviewDraft.id}`}
          onActionError={setError}
          onClose={() => setReviewDraft(null)}
          onPutInPlay={() => putInPlay(reviewDraft.id)}
        />
      ) : null}
    </section>
  );
}

function LibraryPracticeWorkflow() {
  const [request, setRequest] = useState("");
  const [draftCreated, setDraftCreated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [title, setTitle] = useState("Lunch packing handoff");
  const [summary, setSummary] = useState(
    "Keep lunch kits reset, packed, and ready before school mornings."
  );
  const [imagePreviewVersion, setImagePreviewVersion] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  return (
    <section
      aria-label="Dummy Library practice"
      className="grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-fp-surface p-4"
    >
      <div className="grid gap-1">
        <h3 className="text-[16px] font-bold text-fp-ink">
          Dummy Library practice
        </h3>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          Practice greg and draft review locally. These controls never call the
          draft API or create a household card.
        </p>
      </div>

      <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-3">
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Dummy card request
          <textarea
            className="min-h-20 rounded-[8px] border border-fp-line px-3 py-2 text-[14px] text-fp-ink"
            onChange={(event) => setRequest(event.target.value)}
            value={request}
          />
        </label>
        <button
          className="min-h-10 rounded-[8px] bg-fp-ink px-3 text-[13px] font-bold text-white disabled:opacity-60 sm:w-fit"
          disabled={request.trim().length === 0}
          onClick={() => {
            setDraftCreated(true);
            mark("library-capture-filled", "Dummy draft created from greg capture.");
          }}
          type="button"
        >
          Create dummy draft
        </button>
      </div>

      {draftCreated ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-3">
          <div className="grid gap-1">
            <p className="text-[13px] font-bold text-fp-ink">{title}</p>
            <p className="text-[13px] leading-5 text-fp-muted-ink">{summary}</p>
          </div>
          <button
            className="min-h-10 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold sm:w-fit"
            onClick={() => {
              setReviewOpen(true);
              mark("library-draft-reviewed", "Dummy draft opened for review.");
            }}
            type="button"
          >
            Review dummy draft
          </button>
        </div>
      ) : null}

      {reviewOpen ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-3">
          <div className="grid gap-3 md:grid-cols-[minmax(9rem,14rem)_1fr]">
            <div className="grid min-h-40 place-items-center rounded-[8px] border border-fp-line bg-fp-soft p-3 text-center text-[13px] font-bold text-fp-muted-ink">
              Dummy textless image preview {imagePreviewVersion + 1}
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
                Dummy draft title
                <input
                  className="min-h-10 rounded-[8px] border border-fp-line px-3 text-[14px] text-fp-ink"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
                Dummy summary
                <textarea
                  className="min-h-20 rounded-[8px] border border-fp-line px-3 py-2 text-[14px] text-fp-ink"
                  onChange={(event) => setSummary(event.target.value)}
                  value={summary}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-[8px] bg-fp-ink px-3 text-[13px] font-bold text-white"
              onClick={() =>
                mark("library-draft-edited", "Dummy draft edits saved.")
              }
              type="button"
            >
              Save dummy edits
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
              onClick={() => {
                setImagePreviewVersion((version) => version + 1);
                mark(
                  "library-image-previewed",
                  "Dummy image preview refreshed."
                );
              }}
              type="button"
            >
              Preview regenerated dummy image
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
              onClick={() =>
                mark(
                  "library-put-in-play",
                  "Dummy card is ready for the Load Map. No real card was created."
                )
              }
              type="button"
            >
              Put dummy card in play
            </button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p
          className="rounded-[8px] border border-fp-line bg-white p-3 text-[13px] font-semibold text-fp-muted-ink"
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}

function LittleAlexHorneSidekick() {
  return (
    <div className="flex items-center gap-2" data-testid="little-alex-horne-sidekick">
      <div
        aria-hidden="true"
        className="fp-motion-character-breathe relative h-14 w-12 shrink-0"
      >
        <span className="absolute bottom-0 left-3 h-7 w-6 rounded-t-[10px] border border-fp-line bg-fp-ink" />
        <span className="absolute bottom-5 left-[15px] h-5 w-5 rounded-full border border-fp-line bg-[#f2c9a4]" />
        <span className="absolute left-[14px] top-1 h-2 w-6 rounded-t-full bg-[#2b2420]" />
        <span className="absolute left-[19px] top-6 h-1 w-1 rounded-full bg-fp-ink" />
        <span className="absolute left-[27px] top-6 h-1 w-1 rounded-full bg-fp-ink" />
        <span className="absolute bottom-1 left-[21px] h-5 w-2 rounded-sm bg-white" />
        <span className="absolute bottom-2 left-[21px] h-4 w-1 rounded-full bg-fp-helper" />
        <span className="absolute bottom-3 right-0 h-4 w-3 rotate-6 rounded border border-fp-line bg-white" />
      </div>
      <p className="relative max-w-[9rem] rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[12px] font-bold lowercase leading-4 text-fp-ink shadow-[var(--fp-shadow-soft)] before:absolute before:-left-1.5 before:top-5 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-fp-line before:bg-white">
        hi im little alex horne
      </p>
    </div>
  );
}

export function AiCardTracker({
  drafts,
  onCancel,
  onPutInPlay,
  onRetry,
  onReview,
  pendingAction
}: {
  drafts: AiCardDraftSummary[];
  onCancel: (draftId: string) => void;
  onPutInPlay: (draftId: string) => void;
  onRetry: (draftId: string) => void;
  onReview: (draft: AiCardDraftSummary) => void;
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
              aria-label={`${draft.title ?? statusLabels[draft.status]} ${draft.status} draft`}
              className="grid gap-3 rounded border border-fp-line bg-fp-surface p-3"
              key={draft.id}
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
                <Chip>{draft.sourceInputType === "audio" ? "Voice" : "Text"}</Chip>
              </div>

              {draft.failureMessage ? (
                <p className="rounded border border-fp-line bg-white p-3 text-[13px] leading-5 text-fp-muted-ink">
                  {draft.failureMessage}
                </p>
              ) : null}

              {draft.status === "failed" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={pendingAction !== null}
                    onClick={() => onRetry(draft.id)}
                  >
                    <RefreshCcw aria-hidden="true" size={16} />
                    Retry
                  </Button>
                  <Button
                    disabled={pendingAction !== null}
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
                    disabled={pendingAction !== null}
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
  isSubmitting,
  onCancel,
  onSubmit
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (body: FormData | { inputText: string }) => Promise<void>;
}) {
  const [inputText, setInputText] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isMountedRef = useRef(true);
  const recordingRequestCanceledRef = useRef(false);
  const shouldCaptureAudioRef = useRef(false);
  const voiceAvailable = useMemo(
    () =>
      typeof MediaRecorder !== "undefined" &&
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
    []
  );
  const trimmedInput = inputText.trim();
  const canSubmit = !isSubmitting && (trimmedInput.length > 0 || audioBlob !== null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopActiveRecording = useCallback(
    (captureAudio: boolean) => {
      recordingRequestCanceledRef.current = true;
      shouldCaptureAudioRef.current = captureAudio;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;
      if (isMountedRef.current) {
        setIsRecording(false);
      }
      stopStream();
    },
    [stopStream]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopActiveRecording(false);
    };
  }, [stopActiveRecording]);

  async function startRecording() {
    if (!voiceAvailable) {
      return;
    }

    setRecordingError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    recordingRequestCanceledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (recordingRequestCanceledRef.current || !isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        const data = (event as BlobEvent).data;
        if (data.size > 0) {
          chunksRef.current.push(data);
        }
      });
      recorder.addEventListener("stop", () => {
        if (!shouldCaptureAudioRef.current) {
          chunksRef.current = [];
          stopStream();
          return;
        }
        const type = chunksRef.current[0]?.type || "audio/webm";
        setAudioBlob(new Blob(chunksRef.current, { type }));
        stopStream();
      });
      recorder.start();
      if (isMountedRef.current) {
        setIsRecording(true);
      }
    } catch {
      if (isMountedRef.current && !recordingRequestCanceledRef.current) {
        setRecordingError("Voice capture could not start.");
      }
    }
  }

  function stopRecording() {
    stopActiveRecording(true);
  }

  function cancel() {
    stopActiveRecording(false);
    onCancel();
  }

  async function submit() {
    if (!canSubmit) {
      return;
    }

    if (audioBlob) {
      stopActiveRecording(false);
      const formData = new FormData();
      formData.append("audio", audioBlob, "fairplay-card-draft.webm");
      if (trimmedInput) {
        formData.append("contextText", trimmedInput);
      }
      await onSubmit(formData);
      return;
    }

    stopActiveRecording(false);
    await onSubmit({ inputText: trimmedInput });
  }

  return (
    <Sheet aria-label="Capture AI card draft" className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-[18px] font-bold text-fp-ink">Capture a card</h3>
          <p className="text-[14px] leading-6 text-fp-muted-ink">
            Describe the work, or record a quick voice note.
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

      <div className="flex flex-wrap items-center gap-2">
        {isRecording ? (
          <Button onClick={stopRecording} variant="primary">
            <Square aria-hidden="true" size={16} />
            Stop recording
          </Button>
        ) : (
          <Button disabled={!voiceAvailable || isSubmitting} onClick={startRecording}>
            <Mic aria-hidden="true" size={16} />
            Start recording
          </Button>
        )}
        {audioBlob ? (
          <Chip>
            <FileAudio aria-hidden="true" className="mr-1" size={14} />
            Audio captured
          </Chip>
        ) : null}
        {!voiceAvailable ? (
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            Voice capture is unavailable in this browser.
          </p>
        ) : null}
        {recordingError ? (
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            {recordingError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canSubmit} onClick={submit} variant="primary">
          {isSubmitting ? <Loader2 aria-hidden="true" size={16} /> : <Send aria-hidden="true" size={16} />}
          Create draft
        </Button>
        <Button disabled={isSubmitting} onClick={cancel}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}

export function AiCardReviewPanel({
  draft,
  isPuttingInPlay,
  onActionError,
  onClose,
  onPutInPlay
}: {
  draft: AiCardDraftSummary;
  isPuttingInPlay: boolean;
  onActionError: (message: string | null) => void;
  onClose: () => void;
  onPutInPlay: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<AiCardDraftDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [form, setForm] = useState<ReviewForm>(() => reviewFormFromDraft(draft));

  useEffect(() => {
    let active = true;

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
  }, [draft.id, onActionError]);

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

  async function regenerateImage() {
    setIsRegenerating(true);
    onActionError(null);

    try {
      const response = await fetch(
        `/api/ai-card-drafts/${draft.id}/regenerate-image`,
        { method: "POST" }
      );
      if (!response.ok) {
        const apiError = await readSafeApiError(
          response,
          "The image could not be regenerated."
        );
        if (apiError.code === "GENERATION_FAILED") {
          router.refresh();
        }
        throw new Error(apiError.message);
      }
      const regenerated = (await response.json()) as AiCardDraftDetail;
      setDetail(regenerated);
      setForm(reviewFormFromDraft(regenerated));
      router.refresh();
    } catch (caught) {
      onActionError(caught instanceof Error ? caught.message : "The image could not be regenerated.");
    } finally {
      setIsRegenerating(false);
    }
  }

  const coverUrl = detail?.coverUrl ?? draft.coverUrl;

  return (
    <Sheet aria-label="Review AI card draft" className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(320px,42vw)_1fr]">
        <div
          className="grid min-h-[420px] place-items-center overflow-hidden rounded bg-fp-surface lg:min-h-[560px]"
          data-testid="ai-draft-review-art-panel"
        >
          {coverUrl ? (
            <Image
              alt={`${form.title || draft.title || "AI card"} cover`}
              className="h-full min-h-[420px] w-full object-cover lg:min-h-[560px]"
              height={2044}
              src={coverUrl}
              unoptimized
              width={1460}
            />
          ) : (
            <Sparkles aria-hidden="true" className="text-fp-muted-ink" size={32} />
          )}
        </div>
        <div className="grid content-start gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <Chip>{statusLabels[draft.status]}</Chip>
              <h3 className="text-[22px] font-bold leading-7 text-fp-ink">
                {form.title || draft.title || draft.promptPreview}
              </h3>
            </div>
            <Button aria-label="Close review" onClick={onClose} variant="ghost">
              <X aria-hidden="true" size={16} />
            </Button>
          </div>

          {isLoading ? (
            <p className="text-[14px] font-semibold text-fp-muted-ink">
              Loading draft...
            </p>
          ) : null}

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
              disabled={isLoading || isRegenerating}
              onClick={regenerateImage}
            >
              <RefreshCcw aria-hidden="true" size={16} />
              Regenerate image
            </Button>
            <Button disabled={isPuttingInPlay || isSaving} onClick={onPutInPlay}>
              <Send aria-hidden="true" size={16} />
              Put in play
            </Button>
          </div>
        </div>
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

async function readSafeApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      code?: unknown;
      error?: unknown;
      requestId?: unknown;
    };
    const message = typeof body.error === "string" ? body.error : fallback;
    const requestId = typeof body.requestId === "string" ? body.requestId : null;

    return {
      code: typeof body.code === "string" ? body.code : null,
      message: requestId ? `${message} Reference ${requestId}.` : message
    };
  } catch {
    return { code: null, message: fallback };
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
      <Loader2 aria-hidden="true" className="mr-1" size={14} />
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
