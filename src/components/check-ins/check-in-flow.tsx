"use client";

import { useMemo, useState } from "react";

import type { CheckInItemState, DecisionType } from "@/domain/enums";
import type {
  GuidedCheckIn,
  GuidedCheckInItem,
  GuidedDecisionInput
} from "@/server/check-ins/service";
import { SAFETY_COPY } from "@/lib/safety-copy";

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

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateInputToIso(value: string) {
  return value ? `${value}T12:00:00.000Z` : null;
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
  const [message, setMessage] = useState<string | null>(null);

  const currentItem = useMemo(
    () => checkIn.items[currentIndex] ?? checkIn.items.at(-1) ?? null,
    [checkIn.items, currentIndex]
  );

  async function mutateItem(input: ItemMutation) {
    if (!currentItem) {
      return;
    }

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
    setMessage(input.state === "deferred" ? "Deferred for later." : "Skipped for now.");
  }

  async function recordDecision() {
    if (!currentItem || decisionSummary.trim().length === 0) {
      return;
    }

    const decision: GuidedDecisionInput = {
      decisionType,
      summary: decisionSummary.trim(),
      effectiveAt: new Date().toISOString(),
      reviewOn: dateInputToIso(reviewDate),
      responsibilityId: currentItem.responsibilityId
    };

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
  }

  async function completeCheckIn() {
    const completed = onComplete
      ? await onComplete(checkIn.id)
      : await jsonFetch<GuidedCheckIn>(`/api/check-ins/${checkIn.id}/complete`, {
          method: "POST",
          body: JSON.stringify({ completedAt: new Date().toISOString() }),
          headers: { "content-type": "application/json" }
        });

    setCheckIn(completed);
  }

  if (checkIn.state === "completed") {
    return (
      <section
        aria-label="Check-in summary"
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6"
      >
        <h1 className="text-2xl font-semibold text-stone-950">Check-in complete</h1>
        <p className="whitespace-pre-line rounded-md border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
          {checkIn.summary}
        </p>
      </section>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-950">Guided check-in</h1>
        <span className="text-sm text-stone-600">
          {Math.min(currentIndex + 1, checkIn.items.length)} of {checkIn.items.length}
        </span>
      </div>

      {message ? <p role="status" className="text-sm text-stone-600">{message}</p> : null}

      {currentItem ? (
        <section
          aria-label="Current item"
          className="flex flex-col gap-4 rounded-md border border-stone-200 bg-white p-4"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {currentItem.description}
            </p>
            <h2 className="text-xl font-semibold text-stone-950">{currentItem.title}</h2>
            {currentItem.visibility ? (
              <span className="w-fit rounded border border-stone-300 px-2 py-1 text-xs text-stone-700">
                {label(currentItem.visibility)}
              </span>
            ) : null}
          </div>

          <p className="text-sm leading-6 text-stone-600">{SAFETY_COPY.deferOrPause}</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium"
              type="button"
              onClick={() => mutateItem({ state: "skipped", response: "Skipped for now." })}
            >
              Skip
            </button>
            <button
              className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium"
              type="button"
              onClick={() => mutateItem({ state: "deferred", response: "Deferred for later." })}
            >
              Defer
            </button>
          </div>
        </section>
      ) : null}

      <section
        aria-label="Decision form"
        className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-4"
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
          onClick={recordDecision}
        >
          Record decision
        </button>
      </section>

      <button
        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium"
        type="button"
        onClick={completeCheckIn}
      >
        Complete check-in
      </button>
    </main>
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

  async function previewAgenda() {
    try {
      const preview = await jsonFetch<GuidedCheckIn>("/api/check-ins", {
        method: "POST",
        body: JSON.stringify({ maxItems: 5 }),
        headers: { "content-type": "application/json" }
      });
      setSuggestions(preview.items);
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
          radarItemIds: suggestions
            .map((item) => item.radarItemId)
            .filter((id): id is string => Boolean(id)),
          responsibilityIds: suggestions
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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-950">New check-in</h1>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button
        className="rounded-md bg-stone-950 px-3 py-2 text-sm font-medium text-white"
        type="button"
        onClick={previewAgenda}
      >
        Preview agenda
      </button>
      <section aria-label="Agenda preview" className="flex flex-col gap-3">
        {suggestions.map((item) => (
          <article
            className="flex items-start justify-between gap-3 rounded-md border border-stone-200 bg-white p-3"
            key={item.id}
          >
            <div>
              <h2 className="font-medium text-stone-950">{item.title}</h2>
              <p className="text-sm text-stone-600">{item.description}</p>
            </div>
            <button
              className="rounded-md border border-stone-300 px-2 py-1 text-sm"
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
        ))}
      </section>
      <button
        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium"
        type="button"
        onClick={startCheckIn}
      >
        Start check-in
      </button>
    </main>
  );
}
