"use client";

import { useCallback, useState } from "react";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import {
  completeGuidePractice,
  useGuidePracticeRequest,
  useGuidePracticeReset
} from "@/components/guide/guide-practice";
import { PracticeActionGuidance } from "@/components/guide/practice-action-guidance";
import { MotionPanel, MotionSpark } from "@/components/motion/fairplay-motion";
import {
  CheckInVisual,
  DecorativeBackgroundLayer
} from "@/components/visuals/fairplay-visuals";

type CompleteCheckInInput = {
  completedAt: string;
  summary?: string | null;
};

type CheckInFlowProps = {
  initialCheckIn: GuidedCheckIn;
  onComplete?: (
    checkInId: string,
    input: CompleteCheckInInput
  ) => Promise<GuidedCheckIn> | GuidedCheckIn;
};

const checkInTableBackground =
  "/assets/fairplay/generated-ui/backgrounds/check-in-table.png";

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatWhen(value: string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function jsonFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error("Unable to save this check-in.");
  }

  return response.json() as Promise<T>;
}

export function CheckInFlow({ initialCheckIn, onComplete }: CheckInFlowProps) {
  const [checkIn, setCheckIn] = useState<GuidedCheckIn>(initialCheckIn);
  const [notes, setNotes] = useState(checkIn.summary ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const openPractice = useCallback(() => setPracticeOpen(true), []);
  const resetPractice = useCallback(() => setPracticeOpen(false), []);

  useGuidePracticeRequest("check-in-practice-start", openPractice);
  useGuidePracticeReset("check-in-practice-start", resetPractice);

  async function saveCompletion(nextCompletedAt?: string) {
    if (pending) {
      return;
    }

    const input: CompleteCheckInInput = {
      completedAt: nextCompletedAt ?? checkIn.completedAt ?? new Date().toISOString(),
      summary: notes.trim() || null
    };

    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const completed = onComplete
        ? await onComplete(checkIn.id, input)
        : await jsonFetch<GuidedCheckIn>(`/api/check-ins/${checkIn.id}/complete`, {
            method: "POST",
            body: JSON.stringify(input),
            headers: { "content-type": "application/json" }
          });

      setCheckIn(completed);
      setNotes(completed.summary ?? "");
      setMessage(
        completed.state === "completed" && checkIn.state === "completed"
          ? "Notes updated."
          : "Check-in recorded."
      );
    } catch (saveError) {
      setError(errorMessage(saveError, "Unable to save this check-in."));
    } finally {
      setPending(false);
    }
  }

  const completed = checkIn.state === "completed";

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4">
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
        data-guide-id="check-in-overview"
        data-testid={completed ? "check-in-complete-visual" : "check-in-active-visual"}
      >
        <DecorativeBackgroundLayer
          className="opacity-50 [mask-image:linear-gradient(115deg,black_0%,rgba(0,0,0,0.68)_52%,rgba(0,0,0,0.2)_100%)]"
          src={checkInTableBackground}
          testId={
            completed ? "check-in-complete-background" : "check-in-active-background"
          }
          washClassName="fp-page-hero-wash"
        />
        <div className="fp-generated-surface-wash relative z-10 grid gap-4 p-4 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-2">
            <p className="text-[13px] font-semibold text-fp-muted-ink">
              Check-ins
            </p>
            <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
              {completed ? "Check-in record" : "Scheduled check-in"}
            </h1>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              {formatWhen(checkIn.scheduledFor)}
            </p>
          </div>
          <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
            <FeatureGuideLauncher
              guide={FEATURE_GUIDES.checkIns}
              showDescription={false}
              showHelper={false}
            />
            <CheckInVisual className="h-20 w-28 object-contain" />
          </div>
        </div>
      </div>

      {message ? (
        <p
          className="flex items-center gap-2 rounded-[8px] border border-fp-line bg-white p-3 text-[14px] font-semibold text-fp-muted-ink"
          role="status"
        >
          {completed ? <MotionSpark decorative /> : null}
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-[14px] font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <MotionPanel>
        <section
          aria-label={completed ? "Meeting notes" : "Confirm check-in"}
          className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-[var(--fp-shadow-soft)]"
          data-guide-id="check-in-notes"
        >
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
            Minutes / notes
            <textarea
              className="min-h-32 rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[14px] leading-6 text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes from the meeting"
              value={notes}
            />
          </label>
          <button
            className="min-h-11 rounded-[8px] bg-fp-primary px-3 text-[14px] font-bold text-fp-on-primary transition hover:bg-fp-primary-hover disabled:opacity-60 sm:w-fit"
            data-guide-id="check-in-complete-action"
            disabled={pending}
            onClick={() => saveCompletion(completed ? undefined : new Date().toISOString())}
            type="button"
          >
            {pending
              ? "Saving..."
              : completed
                ? "Update notes"
                : "Confirm it happened"}
          </button>
        </section>
      </MotionPanel>

      {practiceOpen ? <CheckInPracticeWorkflow /> : null}
    </section>
  );
}

export function NewCheckInLauncher() {
  const [scheduledFor, setScheduledFor] = useState("");
  const [startedCheckIn, setStartedCheckIn] = useState<GuidedCheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const openPractice = useCallback(() => setPracticeOpen(true), []);
  const resetPractice = useCallback(() => setPracticeOpen(false), []);

  useGuidePracticeRequest("check-in-practice-start", openPractice);
  useGuidePracticeReset("check-in-practice-start", resetPractice);

  async function scheduleCheckIn() {
    const scheduledIso = localDateTimeToIso(scheduledFor);
    if (!scheduledIso || pending) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const checkIn = await jsonFetch<GuidedCheckIn>("/api/check-ins", {
        method: "POST",
        body: JSON.stringify({ scheduledFor: scheduledIso }),
        headers: { "content-type": "application/json" }
      });
      setStartedCheckIn(checkIn);
    } catch (scheduleError) {
      setError(errorMessage(scheduleError, "Unable to schedule this check-in."));
    } finally {
      setPending(false);
    }
  }

  if (startedCheckIn) {
    return <CheckInFlow initialCheckIn={startedCheckIn} />;
  }

  return (
    <section
      className="mx-auto grid w-full max-w-2xl gap-4"
      data-testid="check-in-new-workflow"
    >
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
        data-guide-id="check-in-overview"
        data-testid="check-in-new-visual"
      >
        <DecorativeBackgroundLayer
          className="opacity-50 [mask-image:linear-gradient(115deg,black_0%,rgba(0,0,0,0.68)_52%,rgba(0,0,0,0.2)_100%)]"
          src={checkInTableBackground}
          testId="check-in-new-background"
          washClassName="fp-page-hero-wash"
        />
        <div className="fp-generated-surface-wash relative z-10 grid gap-4 p-4 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-2">
            <p className="text-[13px] font-semibold text-fp-muted-ink">
              Check-ins
            </p>
            <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
              Schedule check-in
            </h1>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              Pick a time. After it happens, confirm and add notes.
            </p>
          </div>
          <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
            <FeatureGuideLauncher
              guide={FEATURE_GUIDES.checkIns}
              showDescription={false}
              showHelper={false}
            />
            <CheckInVisual className="h-20 w-28 object-contain" />
          </div>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-[14px] font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section
        aria-label="Schedule a check-in"
        className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-[var(--fp-shadow-soft)]"
        data-guide-id="check-in-schedule"
      >
        <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
          Date and time
          <input
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[15px] text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
            onChange={(event) => setScheduledFor(event.target.value)}
            type="datetime-local"
            value={scheduledFor}
          />
        </label>
        <button
          className="min-h-11 rounded-[8px] bg-fp-primary px-3 text-[14px] font-bold text-fp-on-primary transition hover:bg-fp-primary-hover disabled:opacity-60 sm:w-fit"
          disabled={!scheduledFor || pending}
          onClick={scheduleCheckIn}
          type="button"
        >
          {pending ? "Scheduling..." : "Schedule"}
        </button>
      </section>

      {practiceOpen ? <CheckInPracticeWorkflow /> : null}
    </section>
  );
}

function CheckInPracticeWorkflow() {
  const [scheduled, setScheduled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [practiceWhen, setPracticeWhen] = useState("");
  const [practiceNotes, setPracticeNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  function clearPractice() {
    setScheduled(false);
    setConfirmed(false);
    setNotesSaved(false);
    setPracticeWhen("");
    setPracticeNotes("");
    setStatus("Practice cleared.");
  }

  return (
    <section
      aria-label="Practice check-in record"
      className="relative z-[60] grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-practice-surface
    >
      <div className="grid gap-1">
        <h2 className="text-[16px] font-bold text-fp-ink">
          Practice check-in record
        </h2>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          Practice scheduling, confirming, and saving notes. Nothing is saved.
        </p>
      </div>

      <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
        Practice date
        <input
          className="min-h-10 rounded-[8px] border border-fp-line bg-white px-3 text-[14px] text-fp-ink"
          onChange={(event) => setPracticeWhen(event.target.value)}
          type="datetime-local"
          value={practiceWhen}
        />
      </label>
      <PracticeActionGuidance
        actionLabel="Schedule practice check-in"
        active={!scheduled && practiceWhen.length > 0}
        wrapperClassName="sm:w-fit"
      >
        <button
          className="min-h-10 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary disabled:opacity-60 sm:w-fit"
          disabled={practiceWhen.length === 0}
          onClick={() => {
            setScheduled(true);
            mark("check-in-scheduled", "Practice check-in scheduled.");
          }}
          type="button"
        >
          Schedule practice check-in
        </button>
      </PracticeActionGuidance>

      {scheduled ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <PracticeActionGuidance
            actionLabel="Confirm practice check-in"
            active={!confirmed}
            wrapperClassName="sm:w-fit"
          >
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
              onClick={() => {
                setConfirmed(true);
                mark("check-in-complete", "Practice check-in confirmed.");
              }}
              type="button"
            >
              Confirm practice check-in
            </button>
          </PracticeActionGuidance>
          <PracticeActionGuidance
            actionLabel="Save practice notes"
            active={confirmed && practiceNotes.trim().length > 0 && !notesSaved}
            kind="action"
          >
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Practice minutes
              <textarea
                className="min-h-20 rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[14px] text-fp-ink"
                onChange={(event) => setPracticeNotes(event.target.value)}
                value={practiceNotes}
              />
            </label>
          </PracticeActionGuidance>
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold text-fp-ink disabled:opacity-60 sm:w-fit"
            disabled={!confirmed || practiceNotes.trim().length === 0 || notesSaved}
            onClick={() => {
              setNotesSaved(true);
              mark("check-in-notes-updated", "Practice notes saved.");
            }}
            type="button"
          >
            Save practice notes
          </button>
        </div>
      ) : null}

      {scheduled ? (
        <button
          className="min-h-10 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold text-fp-ink sm:w-fit"
          onClick={clearPractice}
          type="button"
        >
          Clear practice
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
