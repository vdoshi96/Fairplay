"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CheckInItemState, DecisionType, PersonaKey } from "@/domain/enums";
import type {
  GuidedCheckIn,
  GuidedCheckInItem,
  GuidedDecisionInput
} from "@/server/check-ins/service";
import { SAFETY_COPY } from "@/lib/safety-copy";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import {
  completeGuidePractice,
  useGuidePracticeRequest
} from "@/components/guide/guide-practice";
import { MotionPanel, MotionSpark } from "@/components/motion/fairplay-motion";
import {
  CheckInVisual,
  DecorativeBackgroundLayer
} from "@/components/visuals/fairplay-visuals";

type ItemMutation = {
  state: CheckInItemState;
  response?: string | null;
};

type CheckInFlowProps = {
  initialCheckIn: GuidedCheckIn;
  onUpdateItem?: (
    checkInId: string,
    itemId: string,
    input: ItemMutation
  ) => Promise<void | GuidedCheckInItem> | void;
  onDecision?: (
    checkInId: string,
    itemId: string,
    input: GuidedDecisionInput
  ) => Promise<void> | void;
  onComplete?: (checkInId: string) => Promise<GuidedCheckIn> | GuidedCheckIn;
};

const decisionTypes: DecisionType[] = [
  "assign_owner",
  "change_role",
  "change_standard",
  "change_cadence",
  "pause",
  "mark_not_relevant",
  "archive",
  "schedule_review",
  "custom_note"
];

const checkInTableBackground =
  "/assets/fairplay/generated-ui/backgrounds/check-in-table.png";

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateInputToIso(value: string) {
  return value ? `${value}T12:00:00.000Z` : null;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function jsonFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error("Unable to save this check-in change.");
  }

  return response.json() as Promise<T>;
}

export function CheckInFlow({
  initialCheckIn,
  onUpdateItem,
  onDecision,
  onComplete
}: CheckInFlowProps) {
  const [checkIn, setCheckIn] = useState<GuidedCheckIn>(initialCheckIn);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisionType, setDecisionType] =
    useState<DecisionType>("schedule_review");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [responsibilityOwner, setResponsibilityOwner] =
    useState<PersonaKey>("alex");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "skip" | "defer" | "decision" | "complete" | null
  >(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const openCheckInPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);

  useGuidePracticeRequest("check-in-practice-start", openCheckInPractice);

  const currentItem = useMemo(
    () => checkIn.items[currentIndex] ?? checkIn.items.at(-1) ?? null,
    [checkIn.items, currentIndex]
  );

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function mutateItem(
    input: ItemMutation,
    action: "skip" | "defer"
  ) {
    if (!currentItem || pendingAction) {
      return;
    }

    setPendingAction(action);
    setError(null);
    setMessage(null);
    try {
      if (onUpdateItem) {
        await onUpdateItem(checkIn.id, currentItem.id, input);
      } else {
        await jsonFetch<GuidedCheckInItem>(
          `/api/check-ins/${checkIn.id}/items/${currentItem.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(input),
            headers: { "content-type": "application/json" }
          }
        );
      }

      setCheckIn((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === currentItem.id ? { ...item, state: input.state } : item
        )
      }));
      setCurrentIndex((index) => Math.min(index + 1, checkIn.items.length - 1));
      setMessage(
        input.state === "deferred" ? "Deferred for later." : "Skipped for now."
      );
    } catch (updateError) {
      setError(
        errorMessage(
          updateError,
          input.state === "deferred"
            ? "Unable to defer this item."
            : "Unable to skip this item."
        )
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function recordDecision() {
    if (!currentItem || pendingAction || decisionSummary.trim().length === 0) {
      return;
    }

    setPendingAction("decision");
    setError(null);
    setMessage(null);
    const reviewOn = dateInputToIso(reviewDate);
    const decision: GuidedDecisionInput = {
      decisionType,
      summary: decisionSummary.trim(),
      effectiveAt: new Date().toISOString(),
      reviewOn,
      responsibilityId: currentItem.responsibilityId
    };

    if (currentItem.responsibilityId) {
      if (decisionType === "assign_owner" || decisionType === "change_role") {
        decision.responsibilityEffect = {
          kind: decisionType,
          assignments: [
            {
              personaKey: responsibilityOwner,
              role: "accountable_owner",
              scope: "outcome"
            }
          ],
          revisitAt: reviewOn ?? undefined
        };
      } else if (decisionType === "schedule_review") {
        decision.responsibilityEffect = {
          kind: "schedule_review",
          reviewOn
        };
      }
    }

    try {
      if (onDecision) {
        await onDecision(checkIn.id, currentItem.id, decision);
      } else {
        await jsonFetch(`/api/check-ins/${checkIn.id}/decisions`, {
          method: "POST",
          body: JSON.stringify({ itemId: currentItem.id, ...decision }),
          headers: { "content-type": "application/json" }
        });
      }

      setCheckIn((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === currentItem.id ? { ...item, state: "discussed" } : item
        )
      }));
      setCurrentIndex((index) => Math.min(index + 1, checkIn.items.length - 1));
      setDecisionSummary("");
      setReviewDate("");
      setMessage("Decision recorded.");
    } catch (decisionError) {
      setError(errorMessage(decisionError, "Unable to save this decision."));
    } finally {
      setPendingAction(null);
    }
  }

  async function completeCheckIn() {
    if (pendingAction) {
      return;
    }

    setPendingAction("complete");
    setError(null);
    setMessage(null);
    try {
      const completed = onComplete
        ? await onComplete(checkIn.id)
        : await jsonFetch<GuidedCheckIn>(`/api/check-ins/${checkIn.id}/complete`, {
            method: "POST",
            body: JSON.stringify({ completedAt: new Date().toISOString() }),
            headers: { "content-type": "application/json" }
          });

      setCheckIn(completed);
    } catch (completeError) {
      setError(errorMessage(completeError, "Unable to complete this check-in."));
    } finally {
      setPendingAction(null);
    }
  }

  if (checkIn.state === "completed") {
    return (
      <section
        aria-label="Check-in summary"
        className="mx-auto grid w-full max-w-2xl gap-4"
        data-guide-id="check-in-complete-summary"
      >
        <div
          className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
          data-testid="check-in-complete-visual"
        >
          <DecorativeBackgroundLayer
            className="opacity-35 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.5)_48%,rgba(0,0,0,0.12)_100%)]"
            src={checkInTableBackground}
            testId="check-in-complete-background"
            washClassName="bg-white/80"
          />
          <div className="fp-generated-surface-wash relative z-10 grid gap-3 p-4 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <MotionSpark decorative />
              <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
                Check-in complete
              </h1>
            </div>
            <CheckInVisual
              className="justify-self-start sm:justify-self-end"
              label="Check-in completion spark"
            />
          </div>
        </div>
        <p className="whitespace-pre-line rounded-[8px] border border-fp-line bg-white p-4 text-[14px] leading-6 text-fp-muted-ink">
          {checkIn.summary}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
        data-testid="check-in-active-visual"
      >
        <DecorativeBackgroundLayer
          className="opacity-35 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.5)_48%,rgba(0,0,0,0.12)_100%)]"
          src={checkInTableBackground}
          testId="check-in-active-background"
          washClassName="bg-white/80"
        />
        <div className="fp-generated-surface-wash relative z-10 grid gap-3 p-4 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center">
          <h1 className="text-2xl font-semibold text-stone-950">Guided check-in</h1>
          <div className="grid gap-2 justify-items-start sm:justify-items-end">
            <FeatureGuideLauncher guide={FEATURE_GUIDES.checkIns} showDescription={false} />
            <span className="text-sm text-stone-600">
              {Math.min(currentIndex + 1, checkIn.items.length)} of {checkIn.items.length}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {pendingAction ? (
        <p role="status" aria-live="polite" className="text-sm text-stone-600">
          Saving change...
        </p>
      ) : message ? (
        <p role="status" className="flex items-center gap-2 text-sm text-stone-600">
          {message === "Decision recorded." ? <MotionSpark decorative /> : null}
          {message}
        </p>
      ) : null}

      {currentItem ? (
        <MotionPanel>
          <section
            aria-label="Current item"
            className="flex flex-col gap-4 rounded-[8px] border border-fp-line bg-white p-4"
            data-guide-id="check-in-agenda"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-fp-muted-ink">
                {currentItem.description}
              </p>
              <h2 className="text-xl font-semibold text-fp-ink">
                {currentItem.title}
              </h2>
              {currentItem.visibility ? (
                <span className="w-fit rounded-[8px] border border-fp-line px-2 py-1 text-xs text-fp-muted-ink">
                  {label(currentItem.visibility)}
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-6 text-fp-muted-ink">
              {SAFETY_COPY.deferOrPause}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-[8px] border border-fp-line px-3 py-2 text-sm font-medium"
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={() =>
                  mutateItem({ state: "skipped", response: "Skipped for now." }, "skip")
                }
              >
                Skip
              </button>
              <button
                className="min-h-11 rounded-[8px] border border-fp-line px-3 py-2 text-sm font-medium"
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={() =>
                  mutateItem(
                    { state: "deferred", response: "Deferred for later." },
                    "defer"
                  )
                }
              >
                Defer
              </button>
            </div>
          </section>
        </MotionPanel>
      ) : null}

      <MotionPanel>
        <section
          aria-label="Decision form"
          className="flex flex-col gap-3 rounded-[8px] border border-fp-line bg-white p-4"
          data-guide-id="check-in-decision"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Decision type
            <select
              className="rounded-md border border-stone-300 px-3 py-2"
              value={decisionType}
              onChange={(event) => setDecisionType(event.target.value as DecisionType)}
            >
              {decisionTypes.map((type) => (
                <option key={type} value={type}>
                  {label(type)}
                </option>
              ))}
            </select>
          </label>
          {currentItem?.responsibilityId &&
          (decisionType === "assign_owner" || decisionType === "change_role") ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Owner
              <select
                className="rounded-md border border-stone-300 px-3 py-2"
                value={responsibilityOwner}
                onChange={(event) =>
                  setResponsibilityOwner(event.target.value as PersonaKey)
                }
              >
                <option value="alex">Alex</option>
                <option value="max">Max</option>
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Decision summary
            <textarea
              className="min-h-24 rounded-md border border-stone-300 px-3 py-2"
              value={decisionSummary}
              onChange={(event) => setDecisionSummary(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Review date
            <input
              className="rounded-md border border-stone-300 px-3 py-2"
              type="date"
              value={reviewDate}
              onChange={(event) => setReviewDate(event.target.value)}
            />
          </label>
          <button
            className="rounded-md bg-stone-950 px-3 py-2 text-sm font-medium text-white"
            type="button"
            disabled={Boolean(pendingAction)}
            onClick={recordDecision}
          >
            Record decision
          </button>
        </section>
      </MotionPanel>

      <button
        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium"
        data-guide-id="check-in-complete-action"
        type="button"
        disabled={Boolean(pendingAction)}
        onClick={completeCheckIn}
      >
        Complete check-in
      </button>
      {practiceOpen ? <CheckInPracticeWorkflow /> : null}
    </section>
  );
}

type SuggestedItem = GuidedCheckInItem;

export function NewCheckInLauncher({
  initialSuggestions = []
}: {
  initialSuggestions?: SuggestedItem[];
}) {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>(initialSuggestions);
  const [startedCheckIn, setStartedCheckIn] = useState<GuidedCheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [emptyAgendaOpen, setEmptyAgendaOpen] = useState(false);
  const openCheckInPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);

  useGuidePracticeRequest("check-in-practice-start", openCheckInPractice);

  async function previewAgenda() {
    try {
      const preview = await jsonFetch<{ items: SuggestedItem[] }>(
        "/api/check-ins/preview",
        {
          method: "POST",
          body: JSON.stringify({ maxItems: 5 }),
          headers: { "content-type": "application/json" }
        }
      );
      setSuggestions(preview.items);
      setEmptyAgendaOpen(preview.items.length === 0);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview.");
    }
  }

  async function startCheckIn() {
    try {
      const checkIn = await jsonFetch<GuidedCheckIn>("/api/check-ins", {
        method: "POST",
        body: JSON.stringify({
          maxItems: 5,
          responsibilityIds: suggestions
            .filter((item) => item.itemType === "responsibility")
            .map((item) => item.responsibilityId)
            .filter((id): id is string => Boolean(id))
        }),
        headers: { "content-type": "application/json" }
      });
      setStartedCheckIn(checkIn);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start.");
    }
  }

  if (startedCheckIn) {
    return <CheckInFlow initialCheckIn={startedCheckIn} />;
  }

  return (
    <section
      className="mx-auto flex w-full max-w-4xl flex-col items-center"
      data-testid="check-in-new-workflow"
    >
      <section className="grid w-full max-w-3xl gap-5 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-[var(--fp-shadow-soft)] sm:p-6">
        <div
          className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
          data-testid="check-in-new-visual"
        >
          <DecorativeBackgroundLayer
            className="opacity-30 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.45)_52%,rgba(0,0,0,0.1)_100%)]"
            src={checkInTableBackground}
            testId="check-in-new-background"
            washClassName="bg-white/85"
          />
          <div className="fp-generated-surface-wash relative z-10 grid gap-4 p-4 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="grid max-w-xl gap-2">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-fp-muted-ink">
                Guided workflow
              </p>
              <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
                New check-in
              </h1>
              <p className="text-[14px] leading-6 text-fp-muted-ink">
                Start with a calm agenda, remove anything that can wait, then
                open the check-in when the conversation is ready.
              </p>
            </div>
            <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
              <FeatureGuideLauncher guide={FEATURE_GUIDES.checkIns} showDescription={false} />
              <CheckInVisual className="h-20 w-28 justify-self-start object-contain sm:justify-self-end" />
            </div>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div
          className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3 sm:grid-cols-2"
          data-testid="check-in-launcher-actions"
        >
          <button
            className="min-h-11 rounded-[8px] bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]"
            type="button"
            onClick={previewAgenda}
          >
            Preview agenda
          </button>
          <div data-guide-id="check-in-complete-action">
            <button
              className="min-h-11 w-full rounded-[8px] border border-fp-line bg-white px-3 py-2 text-sm font-semibold text-fp-ink transition hover:bg-[var(--fp-surface-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]"
              type="button"
              onClick={startCheckIn}
            >
              Start check-in
            </button>
          </div>
        </div>

        <section
          aria-label="Agenda preview"
          className="grid gap-3"
          data-guide-id="check-in-agenda"
          data-testid="check-in-agenda-preview-list"
        >
          {suggestions.map((item) => (
            <MotionPanel key={item.id}>
              <article className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="grid gap-1">
                  <h2 className="text-[16px] font-semibold leading-6 text-fp-ink">
                    {item.title}
                  </h2>
                  <p className="text-[14px] leading-5 text-fp-muted-ink">
                    {item.description}
                  </p>
                </div>
                <button
                  className="min-h-10 rounded-[8px] border border-fp-line px-3 py-2 text-left text-sm font-medium text-fp-muted-ink transition hover:bg-[var(--fp-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] sm:text-center"
                  type="button"
                  onClick={() =>
                    setSuggestions((current) =>
                      current.filter((candidate) => candidate.id !== item.id)
                    )
                  }
                >
                  Remove {item.title}
                </button>
              </article>
            </MotionPanel>
          ))}
        </section>

        {practiceOpen ? <CheckInPracticeWorkflow /> : null}
      </section>

      {emptyAgendaOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-fp-ink/45 px-4 py-6">
          <section
            aria-labelledby="empty-agenda-title"
            aria-modal="true"
            className="grid max-h-[calc(100dvh-2rem)] w-full max-w-md gap-3 overflow-y-auto rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
            role="dialog"
          >
            <div className="grid gap-1">
              <h2
                className="text-[20px] font-bold leading-6"
                id="empty-agenda-title"
              >
                No agenda items yet
              </h2>
              <p className="text-[14px] leading-6 text-fp-muted-ink">
                Review-due cards and saved agenda items will appear here when
                there is something ready for a check-in. Nothing was created or
                changed.
              </p>
            </div>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
              onClick={() => setEmptyAgendaOpen(false)}
              type="button"
            >
              Close
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function CheckInPracticeWorkflow() {
  const [agendaPreviewed, setAgendaPreviewed] = useState(false);
  const [owner, setOwner] = useState<PersonaKey>("alex");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  function cleanUpWorkspace() {
    setAgendaPreviewed(false);
    setOwner("alex");
    setDecisionSummary("");
    setStatus("Dummy Check-in workspace cleaned up.");
  }

  return (
    <section
      aria-label="Dummy Check-in practice"
      className="relative z-[60] grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-practice-surface
    >
      <div className="grid gap-1">
        <h2 className="text-[16px] font-bold text-fp-ink">
          Dummy Check-in practice
        </h2>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          About this feature: practice previewing an agenda, assigning a topic,
          recording a decision, deferring an item, and completing a check-in
          without saving decisions or summaries.
        </p>
      </div>
      <button
        className="min-h-10 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary sm:w-fit"
        onClick={() => {
          setAgendaPreviewed(true);
          mark("check-in-agenda-previewed", "Dummy agenda previewed.");
        }}
        type="button"
      >
        Preview dummy agenda
      </button>

      {agendaPreviewed ? (
        <section
          aria-label="Temporary Check-in workspace"
          className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3"
        >
          <div className="grid gap-1">
            <h3 className="text-[15px] font-bold text-fp-ink">
              Temporary Check-in workspace
            </h3>
            <p className="text-[13px] leading-5 text-fp-muted-ink">
              This agenda and its outcomes persist only during onboarding.
              Cleanup removes the mock state.
            </p>
          </div>
          <article className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3">
            <h3 className="text-[15px] font-bold text-fp-ink">
              Lunch kit reset
            </h3>
            <p className="text-[13px] leading-5 text-fp-muted-ink">
              Decide who owns lunch kit reset and when to revisit.
            </p>
          </article>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Dummy topic owner
            <select
              aria-label="Dummy topic owner"
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] text-fp-ink"
              onChange={(event) => setOwner(event.target.value as PersonaKey)}
              value={owner}
            >
              <option value="alex">Alex</option>
              <option value="max">Max</option>
            </select>
            <span className="text-[12px] font-normal leading-4 text-fp-muted-ink">
              Pick who would own the next step in a real check-in.
            </span>
          </label>
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
            onClick={() =>
              mark(
                "check-in-topic-assigned",
                `Dummy topic assigned to ${label(owner)}.`
              )
            }
            type="button"
          >
            Assign dummy topic
          </button>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Dummy decision summary
            <textarea
              aria-label="Dummy decision summary"
              className="min-h-20 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[14px] text-fp-ink"
              onChange={(event) => setDecisionSummary(event.target.value)}
              value={decisionSummary}
            />
            <span className="text-[12px] font-normal leading-4 text-fp-muted-ink">
              Capture the outcome, not the debate.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              disabled={decisionSummary.trim().length === 0}
              onClick={() =>
                mark("check-in-decision-recorded", "Dummy decision recorded.")
              }
              type="button"
            >
              Record dummy decision
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() =>
                mark("check-in-item-deferred", "Dummy item deferred.")
              }
              type="button"
            >
              Defer dummy item
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() =>
                mark("check-in-complete", "Dummy check-in completed.")
              }
              type="button"
            >
              Complete dummy check-in
            </button>
          </div>
        </section>
      ) : null}

      {agendaPreviewed ? (
        <button
          className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
          onClick={cleanUpWorkspace}
          type="button"
        >
          Clean up dummy check-in workspace
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
