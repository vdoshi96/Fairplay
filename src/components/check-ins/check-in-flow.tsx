"use client";

import Link from "next/link";
import { useState } from "react";

import type { GuidedCheckIn } from "@/server/check-ins/service";
import { MotionPanel, MotionSpark } from "@/components/motion/fairplay-motion";
import {
  CheckInVisual,
  DecorativeBackgroundLayer
} from "@/components/visuals/fairplay-visuals";
import {
  WorthReviewing,
  type CheckInReviewResponsibility
} from "./worth-reviewing";

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

export type CheckInHistoryRow = {
  id: string;
  minutes: string;
  occurred: boolean;
  previousCheckInDate: string | null;
};

const checkInTableBackground =
  "/assets/fairplay/generated-ui/backgrounds/check-in-table.png";

function localDateAndTimeToIso(date: string, time: string) {
  return date && time ? new Date(`${date}T${time}`).toISOString() : null;
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
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card-muted)] shadow-[var(--fp-shadow-crisp)]"
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
            <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink">
              {completed ? "Check-in record" : "Scheduled check-in"}
            </h1>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              {formatWhen(checkIn.scheduledFor)}
            </p>
          </div>
          <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
            <CheckInVisual className="h-20 w-28 object-contain" />
          </div>
        </div>
      </div>

      {message ? (
        <p
          className="flex items-center gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-3 text-[14px] font-semibold text-fp-muted-ink"
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
          className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-soft)]"
        >
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
            Minutes / notes
            <textarea
              className="fp-input min-h-32 px-3 py-2 text-[14px] leading-6"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes from the meeting"
              value={notes}
            />
          </label>
          <button
            className="min-h-11 rounded-[8px] bg-fp-primary px-3 text-[14px] font-bold text-fp-on-primary transition hover:bg-fp-primary-hover disabled:opacity-60 sm:w-fit"
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
    </section>
  );
}

export function NewCheckInLauncher({
  history = [],
  worthReviewing = []
}: {
  history?: CheckInHistoryRow[];
  worthReviewing?: CheckInReviewResponsibility[];
}) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [startedCheckIn, setStartedCheckIn] = useState<GuidedCheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function scheduleCheckIn() {
    const scheduledIso = localDateAndTimeToIso(scheduledDate, scheduledTime);
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
    return (
      <section className="grid gap-6">
        <CheckInFlow initialCheckIn={startedCheckIn} />
        <WorthReviewing
          responsibilities={worthReviewing}
          showNextCheckInAction={false}
        />
        <CheckInHistoryTable records={history} />
      </section>
    );
  }

  return (
    <section
      className="mx-auto grid w-full max-w-2xl gap-4"
      data-testid="check-in-new-workflow"
    >
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card-muted)] shadow-[var(--fp-shadow-crisp)]"
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
            <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink">
              Schedule check-in
            </h1>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              Pick a time. After it happens, confirm and add notes.
            </p>
          </div>
          <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
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

      <WorthReviewing responsibilities={worthReviewing} />

      <section
        aria-label="Schedule a check-in"
        className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-soft)]"
        id="schedule-check-in"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
            Check-in date
            <input
              className="fp-input min-h-11 px-3 text-[15px]"
              onChange={(event) => setScheduledDate(event.target.value)}
              type="date"
              value={scheduledDate}
            />
          </label>
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
            Check-in time
            <input
              className="fp-input min-h-11 px-3 text-[15px]"
              onChange={(event) => setScheduledTime(event.target.value)}
              type="time"
              value={scheduledTime}
            />
          </label>
        </div>
        <button
          className="min-h-11 rounded-[8px] bg-fp-primary px-3 text-[14px] font-bold text-fp-on-primary transition hover:bg-fp-primary-hover disabled:opacity-60 sm:w-fit"
          disabled={!scheduledDate || !scheduledTime || pending}
          onClick={scheduleCheckIn}
          type="button"
        >
          {pending ? "Scheduling..." : "Schedule"}
        </button>
      </section>

      <CheckInHistoryTable records={history} />
    </section>
  );
}

export function CheckInHistoryTable({
  records
}: {
  records: CheckInHistoryRow[];
}) {
  return (
    <section className="mx-auto grid w-full max-w-2xl gap-3">
      <div className="grid gap-1">
        <h2 className="text-[20px] font-bold leading-7 text-fp-ink">
          Check-in history
        </h2>
        <p className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
          Past check-ins and scheduled records.
        </p>
      </div>
      {records.length > 0 ? (
        <ul
          aria-label="Check-in history cards"
          className="grid gap-3 md:hidden"
          data-testid="check-in-history-cards"
        >
          {records.map((record) => {
            const headingId = `check-in-history-${record.id}`;

            return (
              <li key={record.id}>
                <article
                  aria-labelledby={headingId}
                  className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-soft)]"
                >
                  <Link
                    className="inline-flex min-h-11 items-center font-bold text-fp-ink underline-offset-4 hover:underline"
                    href={`/app/check-ins/${record.id}`}
                    id={headingId}
                  >
                    {formatWhen(record.previousCheckInDate)}
                  </Link>
                  <dl className="grid gap-3 text-[13px]">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <dt className="font-semibold text-fp-muted-ink">Occurred</dt>
                      <dd className="font-bold text-fp-ink">
                        {record.occurred ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div className="grid gap-1 border-t border-fp-line pt-3">
                      <dt className="font-semibold text-fp-muted-ink">Minutes</dt>
                      <dd className="leading-5 text-fp-ink">
                        {record.minutes || "No notes recorded."}
                      </dd>
                    </div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[8px] border border-fp-line bg-[var(--fp-card)] px-3 py-5 text-center text-[13px] font-semibold text-fp-muted-ink shadow-[var(--fp-shadow-soft)] md:hidden">
          No check-ins recorded yet.
        </p>
      )}
      <div className="hidden overflow-x-auto rounded-[8px] border border-fp-line bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)] md:block">
        <table
          aria-label="Check-in history"
          className="w-full min-w-[34rem] border-collapse text-left text-[13px]"
        >
          <thead className="border-b border-fp-line bg-[var(--fp-surface)]">
            <tr>
              <th className="px-3 py-3 font-bold text-fp-ink" scope="col">
                Previous check-in date
              </th>
              <th className="px-3 py-3 font-bold text-fp-ink" scope="col">
                Previous check-in occurred
              </th>
              <th className="px-3 py-3 font-bold text-fp-ink" scope="col">
                Minutes
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr className="border-b border-fp-line last:border-b-0" key={record.id}>
                  <td className="px-3 py-3 font-semibold text-fp-ink">
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/app/check-ins/${record.id}`}
                    >
                      {formatWhen(record.previousCheckInDate)}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-semibold text-fp-muted-ink">
                    {record.occurred ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-3 font-semibold text-fp-muted-ink">
                    {record.minutes}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-3 py-5 text-center font-semibold text-fp-muted-ink"
                  colSpan={3}
                >
                  No check-ins recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
