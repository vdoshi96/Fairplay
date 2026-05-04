"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";

import type { RadarCreate, RadarSummary } from "@/contracts/radar";
import type { RadarReasonKey, RadarState, Urgency, Visibility } from "@/domain/enums";
import { SAFETY_COPY } from "@/lib/safety-copy";

type RadarBoardProps = {
  items: RadarSummary[];
  onCreate?: (input: RadarCreate) => void | Promise<void>;
  onUpdate?: (id: string, input: Partial<RadarCreate>) => void | Promise<void>;
  onPublish?: (
    id: string,
    fromVisibility: Visibility,
    visibility: Visibility,
    confirmed: boolean
  ) => void | Promise<void>;
  onTransition?: (
    id: string,
    action: "defer" | "resolve" | "dismiss" | "schedule"
  ) => void | Promise<void>;
};

const reasonOptions: RadarReasonKey[] = [
  "unclear_expectation",
  "blocked",
  "too_much",
  "handoff_needed",
  "review_due",
  "other"
];
const urgencyOptions: Urgency[] = ["low", "normal", "soon"];
const visibilityOptions: Visibility[] = [
  "private",
  "shared_household",
  "partner_visible",
  "check_in_only"
];
const publishOptions: Exclude<Visibility, "private">[] = [
  "shared_household",
  "partner_visible",
  "check_in_only"
];

const reasonLabels: Record<RadarReasonKey, string> = {
  unclear_expectation: "Unclear expectation",
  blocked: "Blocked",
  too_much: "Too much",
  handoff_needed: "Handoff needed",
  review_due: "Review due",
  other: "Other"
};

const visibilityLabels: Record<Visibility, string> = {
  private: "Private draft",
  shared_household: "Shared household",
  partner_visible: "Partner visible",
  check_in_only: "Check-in only"
};

const stateLabels: Record<RadarState, string> = {
  draft: "Draft",
  open: "Open",
  scheduled: "Scheduled",
  discussed: "Discussed",
  resolved: "Resolved",
  dismissed: "Dismissed",
  deferred: "Deferred"
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function isSharedOpen(item: RadarSummary) {
  return (
    item.visibility !== "private" &&
    item.visibility !== "check_in_only" &&
    item.state !== "resolved" &&
    item.state !== "deferred" &&
    item.state !== "dismissed"
  );
}

function isCheckInTopic(item: RadarSummary) {
  return (
    item.visibility === "check_in_only" &&
    item.state !== "resolved" &&
    item.state !== "deferred" &&
    item.state !== "dismissed"
  );
}

export function RadarBoard({
  items,
  onCreate,
  onUpdate,
  onPublish,
  onTransition
}: RadarBoardProps) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonKey, setReasonKey] =
    useState<RadarReasonKey>("unclear_expectation");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [responsibilityId, setResponsibilityId] = useState("");
  const [showDeferred, setShowDeferred] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [publishTargets, setPublishTargets] = useState<Record<string, Visibility>>(
    {}
  );
  const [pendingPublish, setPendingPublish] = useState<{
    id: string;
    fromVisibility: Visibility;
    visibility: Exclude<Visibility, "private">;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");

  const groups = useMemo(
    () => ({
      privateDrafts: items.filter(
        (item) => item.visibility === "private" && item.state === "draft"
      ),
      sharedOpen: items.filter(isSharedOpen),
      checkInTopics: items.filter(isCheckInTopic),
      deferred: items.filter((item) => item.state === "deferred"),
      resolved: items.filter((item) => item.state === "resolved")
    }),
    [items]
  );

  async function createItem() {
    if (!topic.trim()) {
      return;
    }

    const body: RadarCreate = {
      topic,
      notes: notes.trim() ? notes : null,
      responsibilityId: responsibilityId.trim() || null,
      reasonKey,
      urgency,
      visibility
    };

    if (onCreate) {
      await onCreate(body);
    } else {
      await fetch("/api/radar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    setTopic("");
    setNotes("");
    setResponsibilityId("");
  }

  async function updateItem(id: string) {
    if (!editTopic.trim()) {
      return;
    }

    if (onUpdate) {
      await onUpdate(id, { topic: editTopic });
    } else {
      await fetch(`/api/radar/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: editTopic })
      });
    }

    setEditingId(null);
    setEditTopic("");
  }

  function publishPending() {
    if (!pendingPublish) {
      return;
    }

    const publish = pendingPublish;
    setPendingPublish(null);
    void (async () => {
      if (onPublish) {
        await onPublish(
          publish.id,
          publish.fromVisibility,
          publish.visibility,
          true
        );
      } else {
        await fetch(`/api/radar/${publish.id}/publish`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: publish.id,
            fromVisibility: publish.fromVisibility,
            visibility: publish.visibility,
            confirmPrivateDraftPublish: true
          })
        });
      }
    })();
  }

  async function transition(
    id: string,
    action: "defer" | "resolve" | "dismiss" | "schedule"
  ) {
    if (onTransition) {
      await onTransition(id, action);
      return;
    }

    if (action === "defer") {
      await fetch(`/api/radar/${id}/defer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id })
      });
    }
    if (action === "resolve") {
      await fetch(`/api/radar/${id}/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, resolvedAt: new Date().toISOString() })
      });
    }
    if (action === "schedule") {
      await fetch(`/api/radar/${id}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetCheckInId: null })
      });
    }
    if (action === "dismiss") {
      await fetch(`/api/radar/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: "dismissed" })
      });
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <p className="text-[13px] font-semibold text-fp-muted-ink">Radar</p>
          <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
            Concern board
          </h1>
        </div>
      </div>

      <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Topic
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setTopic(event.target.value)}
              value={topic}
            />
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Linked responsibility
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setResponsibilityId(event.target.value)}
              placeholder="Optional id"
              value={responsibilityId}
            />
          </label>
        </div>
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Notes
          <textarea
            className="min-h-20 rounded-[8px] border border-fp-line px-3 py-2 text-[15px] text-fp-ink"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Reason"
            onChange={(value) => setReasonKey(value as RadarReasonKey)}
            options={reasonOptions}
            value={reasonKey}
          />
          <Select
            label="Urgency"
            onChange={(value) => setUrgency(value as Urgency)}
            options={urgencyOptions}
            value={urgency}
          />
          <Select
            label="Visibility"
            onChange={(value) => setVisibility(value as Visibility)}
            options={visibilityOptions}
            value={visibility}
          />
        </div>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          {SAFETY_COPY.unsafeRelationshipCaution}
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white outline-none focus:ring-2 focus:ring-fp-ink/25 sm:w-fit"
          onClick={createItem}
          type="button"
        >
          Create radar item
        </button>
      </div>

      <RadarSection title="Private drafts" items={groups.privateDrafts}>
        {(item) => (
          <RadarCard
            editTopic={editTopic}
            editingId={editingId}
            item={item}
            onCancelEdit={() => setEditingId(null)}
            onEdit={() => {
              setEditingId(item.id);
              setEditTopic(item.topic);
            }}
            onEditTopic={setEditTopic}
            onPublish={() => {
              const target = (publishTargets[item.id] ??
                "shared_household") as Exclude<Visibility, "private">;
              setPendingPublish({
                id: item.id,
                fromVisibility: item.visibility,
                visibility: target
              });
            }}
            onPublishTarget={(target) =>
              setPublishTargets((current) => ({ ...current, [item.id]: target }))
            }
            onSaveEdit={() => updateItem(item.id)}
            onTransition={transition}
            publishTarget={
              (publishTargets[item.id] ??
                "shared_household") as Exclude<Visibility, "private">
            }
          />
        )}
      </RadarSection>

      <RadarSection title="Shared and open" items={groups.sharedOpen}>
        {(item) => (
          <RadarCard
            editTopic={editTopic}
            editingId={editingId}
            item={item}
            onCancelEdit={() => setEditingId(null)}
            onEdit={() => {
              setEditingId(item.id);
              setEditTopic(item.topic);
            }}
            onEditTopic={setEditTopic}
            onPublish={() => undefined}
            onPublishTarget={() => undefined}
            onSaveEdit={() => updateItem(item.id)}
            onTransition={transition}
            publishTarget="shared_household"
          />
        )}
      </RadarSection>

      <RadarSection title="Check-in topics" items={groups.checkInTopics}>
        {(item) => (
          <RadarCard
            editTopic={editTopic}
            editingId={editingId}
            item={item}
            onCancelEdit={() => setEditingId(null)}
            onEdit={() => {
              setEditingId(item.id);
              setEditTopic(item.topic);
            }}
            onEditTopic={setEditTopic}
            onPublish={() => undefined}
            onPublishTarget={() => undefined}
            onSaveEdit={() => updateItem(item.id)}
            onTransition={transition}
            publishTarget="check_in_only"
          />
        )}
      </RadarSection>

      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold"
          onClick={() => setShowDeferred((current) => !current)}
          type="button"
        >
          {showDeferred ? "Hide deferred" : "Show deferred"}
        </button>
        <button
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold"
          onClick={() => setShowResolved((current) => !current)}
          type="button"
        >
          {showResolved ? "Hide resolved" : "Show resolved"}
        </button>
      </div>

      {showDeferred ? (
        <RadarSection title="Deferred" items={groups.deferred}>
          {(item) => <ReadOnlyRadarCard item={item} />}
        </RadarSection>
      ) : null}
      {showResolved ? (
        <RadarSection title="Resolved" items={groups.resolved}>
          {(item) => <ReadOnlyRadarCard item={item} />}
        </RadarSection>
      ) : null}

      {pendingPublish ? (
        <div
          aria-label={`Publish to ${visibilityLabels[pendingPublish.visibility]}?`}
          className="fixed inset-x-4 top-24 z-20 mx-auto grid max-w-md gap-3 rounded-[8px] border border-fp-line bg-white p-4 shadow-lg"
          role="dialog"
        >
          <h2 className="text-[18px] font-bold">
            Publish to {visibilityLabels[pendingPublish.visibility]}?
          </h2>
          <p className="text-[14px] leading-6 text-fp-muted-ink">
            This will make this visible as{" "}
            {visibilityLabels[pendingPublish.visibility]}.{" "}
            {SAFETY_COPY.privateDraftPublishConfirmation}
          </p>
          <div className="flex gap-2">
            <button
              className="min-h-11 rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white"
              onClick={publishPending}
              type="button"
            >
              Confirm publish
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
              onClick={() => setPendingPublish(null)}
              type="button"
            >
              Keep private
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RadarSection({
  children,
  items,
  title
}: {
  children: (item: RadarSummary) => ReactNode;
  items: RadarSummary[];
  title: string;
}) {
  return (
    <section aria-label={title} className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold">{title}</h2>
        <span className="rounded-[8px] border border-fp-line bg-white px-2 py-1 text-[12px] font-semibold text-fp-muted-ink">
          {items.length}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Fragment key={item.id}>{children(item)}</Fragment>
          ))}
        </div>
      ) : (
        <p className="rounded-[8px] border border-fp-line bg-white p-4 text-[14px] text-fp-muted-ink">
          Nothing here right now.
        </p>
      )}
    </section>
  );
}

function RadarCard({
  editTopic,
  editingId,
  item,
  onCancelEdit,
  onEdit,
  onEditTopic,
  onPublish,
  onPublishTarget,
  onSaveEdit,
  onTransition,
  publishTarget
}: {
  editTopic: string;
  editingId: string | null;
  item: RadarSummary;
  onCancelEdit: () => void;
  onEdit: () => void;
  onEditTopic: (value: string) => void;
  onPublish: () => void;
  onPublishTarget: (visibility: Exclude<Visibility, "private">) => void;
  onSaveEdit: () => void;
  onTransition: (
    id: string,
    action: "defer" | "resolve" | "dismiss" | "schedule"
  ) => void;
  publishTarget: Exclude<Visibility, "private">;
}) {
  const isEditing = editingId === item.id;

  return (
    <article className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-4">
      <div className="grid gap-2">
        {isEditing ? (
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Edit topic
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => onEditTopic(event.target.value)}
              value={editTopic}
            />
          </label>
        ) : (
          <h3 className="text-[17px] font-bold leading-6">{item.topic}</h3>
        )}
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
          <span className="rounded-[8px] border border-fp-line px-2 py-1">
            {visibilityLabels[item.visibility]}
          </span>
          <span className="rounded-[8px] border border-fp-line px-2 py-1">
            {reasonLabels[item.reasonKey]}
          </span>
          <span className="rounded-[8px] border border-fp-line px-2 py-1">
            {label(item.urgency)}
          </span>
          <span className="rounded-[8px] border border-fp-line px-2 py-1">
            {stateLabels[item.state]}
          </span>
        </div>
      </div>

      {item.visibility === "private" ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Select
            label="Publish visibility"
            onChange={(value) =>
              onPublishTarget(value as Exclude<Visibility, "private">)
            }
            options={publishOptions}
            value={publishTarget}
          />
          <button
            className="min-h-11 rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white sm:self-end"
            onClick={onPublish}
            type="button"
          >
            Publish
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <button
              className="min-h-11 rounded-[8px] bg-fp-ink px-3 text-[13px] font-bold text-white"
              onClick={onSaveEdit}
              type="button"
            >
              Save edit
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
              onClick={onCancelEdit}
              type="button"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
        )}
        <button
          className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
          onClick={() => onTransition(item.id, "schedule")}
          type="button"
        >
          Schedule
        </button>
        <button
          className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
          onClick={() => onTransition(item.id, "defer")}
          type="button"
        >
          Defer
        </button>
        <button
          className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
          onClick={() => onTransition(item.id, "resolve")}
          type="button"
        >
          Resolve
        </button>
        <button
          className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[13px] font-bold"
          onClick={() => onTransition(item.id, "dismiss")}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}

function ReadOnlyRadarCard({ item }: { item: RadarSummary }) {
  return (
    <article className="grid gap-2 rounded-[8px] border border-fp-line bg-white p-4">
      <h3 className="text-[17px] font-bold leading-6">{item.topic}</h3>
      <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
        <span className="rounded-[8px] border border-fp-line px-2 py-1">
          {visibilityLabels[item.visibility]}
        </span>
        <span className="rounded-[8px] border border-fp-line px-2 py-1">
          {reasonLabels[item.reasonKey]}
        </span>
        <span className="rounded-[8px] border border-fp-line px-2 py-1">
          {stateLabels[item.state]}
        </span>
      </div>
    </article>
  );
}

function Select<T extends string>({
  label: labelText,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
      {labelText}
      <select
        className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option in reasonLabels
              ? reasonLabels[option as RadarReasonKey]
              : option in visibilityLabels
                ? visibilityLabels[option as Visibility]
                : label(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
