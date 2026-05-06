"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";

import type { RadarCreate, RadarSummary } from "@/contracts/radar";
import type { RadarReasonKey, RadarState, Urgency, Visibility } from "@/domain/enums";
import { SAFETY_COPY } from "@/lib/safety-copy";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import {
  completeGuidePractice,
  useGuidePracticeRequest
} from "@/components/guide/guide-practice";
import { MotionPanel } from "@/components/motion/fairplay-motion";
import { RadarVisual } from "@/components/visuals/fairplay-visuals";

type RadarBoardItem = RadarSummary;

type RadarBoardProps = {
  items: RadarBoardItem[];
  onCreate?: (input: RadarCreate) => void | Promise<void | RadarBoardItem>;
  onUpdate?: (
    id: string,
    input: Partial<RadarCreate>
  ) => void | Promise<void | RadarBoardItem>;
  onPublish?: (
    id: string,
    fromVisibility: Visibility,
    visibility: Visibility,
    confirmed: boolean
  ) => void | Promise<void | RadarBoardItem>;
  onTransition?: (
    id: string,
    action: "defer" | "resolve" | "dismiss" | "schedule",
    input?: { deferredUntil?: string | null }
  ) => void | Promise<void | RadarBoardItem>;
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

const radarSignalRoomBackground =
  "url('/assets/fairplay/generated-ui/backgrounds/radar-signal-room.png')";

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateInputToIso(value: string): string | null {
  return value ? `${value}T12:00:00.000Z` : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function mutationErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body) && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // The status is enough when the server did not return a JSON error body.
  }

  return fallback;
}

function isSharedOpen(item: RadarBoardItem) {
  return (
    item.visibility !== "private" &&
    item.visibility !== "check_in_only" &&
    item.state !== "resolved" &&
    item.state !== "deferred" &&
    item.state !== "dismissed" &&
    item.state !== "scheduled"
  );
}

function isCheckInTopic(item: RadarBoardItem) {
  return (
    (item.visibility === "check_in_only" || item.state === "scheduled") &&
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
  const [boardItems, setBoardItems] = useState<RadarBoardItem[]>(items);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [desiredTiming, setDesiredTiming] = useState("");
  const [reasonKey, setReasonKey] =
    useState<RadarReasonKey>("unclear_expectation");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [responsibilityId, setResponsibilityId] = useState("");
  const [showDeferred, setShowDeferred] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [publishTargets, setPublishTargets] = useState<Record<string, Visibility>>(
    {}
  );
  const [deferDates, setDeferDates] = useState<Record<string, string>>({});
  const [pendingPublish, setPendingPublish] = useState<{
    id: string;
    fromVisibility: Visibility;
    visibility: Exclude<Visibility, "private">;
  } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDesiredTiming, setEditDesiredTiming] = useState("");
  const contentRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmPublishButtonRef = useRef<HTMLButtonElement>(null);
  const publishReturnFocusRef = useRef<HTMLElement | null>(null);
  const openRadarPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);

  useEffect(() => {
    setBoardItems(items);
  }, [items]);

  useGuidePracticeRequest("radar-practice-start", openRadarPractice);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    if (pendingPublish) {
      content.setAttribute("aria-hidden", "true");
      content.setAttribute("inert", "");
      confirmPublishButtonRef.current?.focus();
      return () => {
        content.removeAttribute("aria-hidden");
        content.removeAttribute("inert");
      };
    }

    content.removeAttribute("aria-hidden");
    content.removeAttribute("inert");
  }, [pendingPublish]);

  function applyItem(nextItem?: void | RadarBoardItem) {
    if (!nextItem) {
      return;
    }

    setBoardItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === nextItem.id);
      if (existingIndex === -1) {
        return [...current, nextItem];
      }

      return current.map((item) => (item.id === nextItem.id ? nextItem : item));
    });
  }

  async function fetchItem(url: string, init: RequestInit, fallback: string) {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(await mutationErrorMessage(response, fallback));
    }

    const nextItem = (await response.json()) as RadarBoardItem;
    applyItem(nextItem);
    return nextItem;
  }

  function closePublishDialog() {
    setPendingPublish(null);
    setPublishError(null);
    window.requestAnimationFrame(() => {
      publishReturnFocusRef.current?.focus();
    });
  }

  function handlePublishDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePublishDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      ) ?? []
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusableElements.length === 0) {
      return;
    }

    event.preventDefault();

    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );
    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
      : (currentIndex + 1) % focusableElements.length;

    focusableElements[nextIndex]?.focus();
  }

  const groups = useMemo(
    () => ({
      privateDrafts: boardItems.filter(
        (item) => item.visibility === "private" && item.state === "draft"
      ),
      sharedOpen: boardItems.filter(isSharedOpen),
      checkInTopics: boardItems.filter(isCheckInTopic),
      deferred: boardItems.filter((item) => item.state === "deferred"),
      resolved: boardItems.filter((item) => item.state === "resolved"),
      dismissed: boardItems.filter((item) => item.state === "dismissed")
    }),
    [boardItems]
  );
  const radarActionsGuideItemId =
    groups.sharedOpen[0]?.id ?? groups.checkInTopics[0]?.id ?? null;

  async function createItem() {
    if (!topic.trim()) {
      return;
    }

    const body: RadarCreate = {
      topic,
      notes: notes.trim() ? notes : null,
      desiredTiming: desiredTiming.trim() ? desiredTiming : null,
      responsibilityId: responsibilityId.trim() || null,
      reasonKey,
      urgency,
      visibility
    };

    setMutationError(null);

    try {
      if (onCreate) {
        applyItem(await onCreate(body));
      } else {
        await fetchItem(
          "/api/radar",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body)
          },
          "Unable to create the radar item right now."
        );
      }

      setTopic("");
      setNotes("");
      setDesiredTiming("");
      setResponsibilityId("");
    } catch (error) {
      setMutationError(
        messageFromError(error, "Unable to create the radar item right now.")
      );
    }
  }

  async function updateItem(id: string) {
    if (!editTopic.trim()) {
      return;
    }

    setMutationError(null);

    try {
      if (onUpdate) {
        applyItem(
          await onUpdate(id, {
            topic: editTopic,
            desiredTiming: editDesiredTiming.trim() ? editDesiredTiming : null
          })
        );
      } else {
        await fetchItem(
          `/api/radar/${id}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              topic: editTopic,
              desiredTiming: editDesiredTiming.trim() ? editDesiredTiming : null
            })
          },
          "Unable to save the radar edit right now."
        );
      }

      setEditingId(null);
      setEditTopic("");
      setEditDesiredTiming("");
    } catch (error) {
      setMutationError(
        messageFromError(error, "Unable to save the radar edit right now.")
      );
    }
  }

  async function publishPending() {
    if (!pendingPublish) {
      return;
    }

    const publish = pendingPublish;
    setPublishError(null);
    try {
      if (onPublish) {
        applyItem(
          await onPublish(
            publish.id,
            publish.fromVisibility,
            publish.visibility,
            true
          )
        );
      } else {
        await fetchItem(
          `/api/radar/${publish.id}/publish`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              id: publish.id,
              fromVisibility: publish.fromVisibility,
              visibility: publish.visibility,
              confirmPrivateDraftPublish: true
            })
          },
          "Unable to publish this radar item right now."
        );
      }

      closePublishDialog();
    } catch (error) {
      setPublishError(
        messageFromError(error, "Unable to publish this radar item right now.")
      );
    }
  }

  async function transition(
    id: string,
    action: "defer" | "resolve" | "dismiss" | "schedule"
  ) {
    const deferredUntil = dateInputToIso(deferDates[id] ?? "");

    setMutationError(null);

    try {
      if (onTransition) {
        applyItem(await onTransition(id, action, { deferredUntil }));
        return;
      }

      if (action === "defer") {
        await fetchItem(
          `/api/radar/${id}/defer`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id, deferredUntil })
          },
          "Unable to defer this radar item right now."
        );
      }
      if (action === "resolve") {
        await fetchItem(
          `/api/radar/${id}/resolve`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id, resolvedAt: new Date().toISOString() })
          },
          "Unable to resolve this radar item right now."
        );
      }
      if (action === "schedule") {
        await fetchItem(
          `/api/radar/${id}/schedule`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ targetCheckInId: null })
          },
          "Unable to schedule this radar item right now."
        );
      }
      if (action === "dismiss") {
        await fetchItem(
          `/api/radar/${id}/dismiss`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id })
          },
          "Unable to dismiss this radar item right now."
        );
      }
    } catch (error) {
      setMutationError(
        messageFromError(error, "Unable to update this radar item right now.")
      );
    }
  }

  return (
    <>
      <section className="grid gap-5" ref={contentRef}>
        <div
          className="overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink bg-cover bg-center shadow-[var(--fp-shadow-soft)]"
          data-testid="radar-signal-room-visual"
          style={{ backgroundImage: radarSignalRoomBackground }}
        >
          <div className="fp-generated-surface-wash grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-1">
              <p className="text-[13px] font-semibold text-fp-muted-ink">Radar</p>
              <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
                Concern board
              </h1>
            </div>
            <div className="grid gap-3 justify-self-start sm:justify-self-end sm:justify-items-end">
              <FeatureGuideLauncher
                guide={FEATURE_GUIDES.radar}
                showDescription={false}
              />
              <div className="relative w-36 sm:w-44">
                <span
                  aria-hidden="true"
                  className="fp-motion-radar-pulse absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
                />
                <RadarVisual className="relative rounded-[8px]" />
              </div>
            </div>
          </div>
        </div>

        {mutationError ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {mutationError}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Topic
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              data-guide-id="radar-create"
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
          Desired timing
          <input
            className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
            onChange={(event) => setDesiredTiming(event.target.value)}
            placeholder="Optional timing note"
            value={desiredTiming}
          />
        </label>
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
            dataGuideId="radar-visibility"
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
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary outline-none focus:ring-2 focus:ring-fp-primary/25 sm:w-fit"
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
              setEditDesiredTiming(item.desiredTiming ?? "");
            }}
            editDesiredTiming={editDesiredTiming}
            onEditTopic={setEditTopic}
            onEditDesiredTiming={setEditDesiredTiming}
            onPublish={() => {
              const target = (publishTargets[item.id] ??
                "shared_household") as Exclude<Visibility, "private">;
              publishReturnFocusRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              setPublishError(null);
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
            actionsGuideId={
              item.id === radarActionsGuideItemId ? "radar-actions" : undefined
            }
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
              setEditDesiredTiming(item.desiredTiming ?? "");
            }}
            deferDate={deferDates[item.id] ?? ""}
            editDesiredTiming={editDesiredTiming}
            onDeferDate={(value) =>
              setDeferDates((current) => ({ ...current, [item.id]: value }))
            }
            onEditDesiredTiming={setEditDesiredTiming}
            onEditTopic={setEditTopic}
            onPublish={() => undefined}
            onPublishTarget={() => undefined}
            onSaveEdit={() => updateItem(item.id)}
            onTransition={transition}
            actionsGuideId={
              item.id === radarActionsGuideItemId ? "radar-actions" : undefined
            }
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
              setEditDesiredTiming(item.desiredTiming ?? "");
            }}
            deferDate={deferDates[item.id] ?? ""}
            editDesiredTiming={editDesiredTiming}
            onDeferDate={(value) =>
              setDeferDates((current) => ({ ...current, [item.id]: value }))
            }
            onEditDesiredTiming={setEditDesiredTiming}
            onEditTopic={setEditTopic}
            onPublish={() => undefined}
            onPublishTarget={() => undefined}
            onSaveEdit={() => updateItem(item.id)}
            onTransition={transition}
            actionsGuideId={
              item.id === radarActionsGuideItemId ? "radar-actions" : undefined
            }
            publishTarget="check_in_only"
          />
        )}
      </RadarSection>

      {practiceOpen || !radarActionsGuideItemId ? (
        <RadarPracticeWorkflow dataGuideId={!radarActionsGuideItemId ? "radar-actions" : undefined} />
      ) : null}

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
        <button
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-bold"
          onClick={() => setShowDismissed((current) => !current)}
          type="button"
        >
          {showDismissed ? "Hide dismissed" : "Show dismissed"}
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
      {showDismissed ? (
        <RadarSection title="Dismissed" items={groups.dismissed}>
          {(item) => <ReadOnlyRadarCard item={item} />}
        </RadarSection>
      ) : null}

    </section>
    {pendingPublish ? (
      <div
        aria-describedby="publish-confirm-description"
        aria-labelledby="publish-confirm-title"
        aria-modal="true"
        className="fixed inset-0 z-20 grid place-items-start bg-fp-ink/35 px-4 pt-24"
        onKeyDown={handlePublishDialogKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="mx-auto grid w-full max-w-md gap-3 rounded-[8px] border border-fp-line bg-white p-4 shadow-lg">
          <h2 className="text-[18px] font-bold" id="publish-confirm-title">
            Publish to {visibilityLabels[pendingPublish.visibility]}?
          </h2>
          <p
            className="text-[14px] leading-6 text-fp-muted-ink"
            id="publish-confirm-description"
          >
            This will make this visible as{" "}
            {visibilityLabels[pendingPublish.visibility]}.{" "}
            {SAFETY_COPY.privateDraftPublishConfirmation}
          </p>
          {publishError ? (
            <p
              className="rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
              role="alert"
            >
              {publishError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary"
              onClick={publishPending}
              ref={confirmPublishButtonRef}
              type="button"
            >
              Confirm publish
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
              onClick={closePublishDialog}
              type="button"
            >
              Keep private
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

function RadarSection({
  children,
  items,
  title
}: {
  children: (item: RadarBoardItem) => ReactNode;
  items: RadarBoardItem[];
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
            <MotionPanel key={item.id}>{children(item)}</MotionPanel>
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

function RadarPracticeWorkflow({ dataGuideId }: { dataGuideId?: string }) {
  const [created, setCreated] = useState(false);
  const [topic, setTopic] = useState("");
  const [editTopic, setEditTopic] = useState("Clarify lunch packing ownership");
  const [visibility, setVisibility] =
    useState<Exclude<Visibility, "private">>("shared_household");
  const [revisitDate, setRevisitDate] = useState("");
  const [state, setState] = useState<
    "draft" | "deferred" | "scheduled" | "resolved" | "dismissed"
  >("draft");
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  return (
    <section
      aria-label="Dummy Radar practice"
      className="relative z-[60] grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-id={dataGuideId}
    >
      <div className="grid gap-1">
        <h2 className="text-[16px] font-bold text-fp-ink">
          Dummy Radar practice
        </h2>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          Use this local card to practice Radar decisions without touching the
          household board.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Dummy radar topic
          <input
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] text-fp-ink"
            onChange={(event) => setTopic(event.target.value)}
            value={topic}
          />
        </label>
        <button
          className="min-h-10 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary disabled:opacity-60 sm:self-end"
          disabled={topic.trim().length === 0}
          onClick={() => {
            setCreated(true);
            setEditTopic(topic.trim());
            setState("draft");
            mark("radar-practice-create", "Dummy radar draft created.");
          }}
          type="button"
        >
          Create dummy radar draft
        </button>
      </div>

      {created ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
            <span className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 py-1 text-fp-ink">
              {visibilityLabels[visibility]}
            </span>
            <span className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 py-1 text-fp-ink">
              {stateLabels[state]}
            </span>
            {revisitDate ? (
              <span className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 py-1 text-fp-ink">
                Revisit {revisitDate}
              </span>
            ) : null}
          </div>

          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Edit dummy radar topic
            <input
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] text-fp-ink"
              onChange={(event) => setEditTopic(event.target.value)}
              value={editTopic}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Dummy visibility"
              onChange={(value) =>
                setVisibility(value as Exclude<Visibility, "private">)
              }
              options={publishOptions}
              value={visibility}
            />
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Dummy revisit date
              <input
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[15px] text-fp-ink"
                onChange={(event) => setRevisitDate(event.target.value)}
                type="date"
                value={revisitDate}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() =>
                mark("radar-practice-edit", "Dummy radar draft edited.")
              }
              type="button"
            >
              Save dummy radar edit
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() =>
                mark(
                  "radar-practice-visibility",
                  `Dummy visibility set to ${visibilityLabels[visibility]}.`
                )
              }
              type="button"
            >
              Apply dummy visibility
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() => {
                setState("deferred");
                mark("radar-practice-defer", "Dummy radar item deferred.");
              }}
              type="button"
            >
              Defer dummy item
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() => {
                setState("scheduled");
                mark("radar-practice-schedule", "Dummy radar item scheduled.");
              }}
              type="button"
            >
              Schedule dummy item
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() => {
                setState("resolved");
                mark("radar-practice-resolve", "Dummy radar item resolved.");
              }}
              type="button"
            >
              Resolve dummy item
            </button>
            <button
              className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
              onClick={() => {
                setState("dismissed");
                mark("radar-practice-dismiss", "Dummy radar item dismissed.");
              }}
              type="button"
            >
              Dismiss dummy item
            </button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p
          className="rounded-[8px] border border-fp-line bg-fp-surface p-3 text-[13px] font-semibold text-fp-muted-ink"
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}

function RadarCard({
  actionsGuideId,
  deferDate = "",
  editDesiredTiming,
  editTopic,
  editingId,
  item,
  onCancelEdit,
  onDeferDate,
  onEdit,
  onEditDesiredTiming,
  onEditTopic,
  onPublish,
  onPublishTarget,
  onSaveEdit,
  onTransition,
  publishTarget
}: {
  actionsGuideId?: string;
  deferDate?: string;
  editDesiredTiming: string;
  editTopic: string;
  editingId: string | null;
  item: RadarBoardItem;
  onCancelEdit: () => void;
  onDeferDate?: (value: string) => void;
  onEdit: () => void;
  onEditDesiredTiming: (value: string) => void;
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
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Edit topic
              <input
                className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
                onChange={(event) => onEditTopic(event.target.value)}
                value={editTopic}
              />
            </label>
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Edit desired timing
              <input
                className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
                onChange={(event) => onEditDesiredTiming(event.target.value)}
                value={editDesiredTiming}
              />
            </label>
          </div>
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
        <TimingMeta item={item} />
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
            className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary sm:self-end"
            onClick={onPublish}
            type="button"
          >
            Publish
          </button>
        </div>
      ) : null}

      <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink sm:max-w-xs">
        Revisit date
        <input
          className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
          onChange={(event) => onDeferDate?.(event.target.value)}
          type="date"
          value={deferDate}
        />
      </label>

      <div className="flex flex-wrap gap-2" data-guide-id={actionsGuideId}>
        {isEditing ? (
          <>
            <button
              className="min-h-11 rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary"
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

function ReadOnlyRadarCard({ item }: { item: RadarBoardItem }) {
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
      <TimingMeta item={item} />
    </article>
  );
}

function TimingMeta({ item }: { item: RadarBoardItem }) {
  const deferredUntil = item.state === "deferred" ? item.deferredUntil : null;

  if (!item.desiredTiming && !deferredUntil) {
    return null;
  }

  return (
    <div className="grid gap-1 text-[13px] leading-5 text-fp-muted-ink">
      {item.desiredTiming ? <p>Timing: {item.desiredTiming}</p> : null}
      {deferredUntil ? <p>Revisit: {formatDate(deferredUntil)}</p> : null}
    </div>
  );
}

function Select<T extends string>({
  dataGuideId,
  label: labelText,
  onChange,
  options,
  value
}: {
  dataGuideId?: string;
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
      {labelText}
      <select
        className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
        data-guide-id={dataGuideId}
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
