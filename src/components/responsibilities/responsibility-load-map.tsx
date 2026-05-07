"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import type {
  LoadSnapshotSummary,
  ResponsibilitySummary
} from "@/contracts/responsibilities";
import type { HiddenEffortKey, ResponsibilityBoardLane } from "@/domain/enums";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import {
  completeGuidePractice,
  useGuidePracticeRequest
} from "@/components/guide/guide-practice";
import { AssignmentShift, MotionPanel } from "@/components/motion/fairplay-motion";
import {
  DecorativeBackgroundLayer,
  HelperMascot
} from "@/components/visuals/fairplay-visuals";
import { BOARD_LANES, type BoardLaneTone } from "./board-lanes";

type ResponsibilityLoadMapProps = {
  responsibilities: ResponsibilitySummary[];
  loadSnapshot: LoadSnapshotSummary;
  onMove?: (move: ResponsibilityBoardMove) => void | Promise<void>;
};

export type ResponsibilityBoardMove = {
  responsibilityId: string;
  toLane: ResponsibilityBoardLane;
  sortOrder?: number;
};

const ownerOptions = ["all", "alex", "max", "unassigned"] as const;
const statusOptions = [
  "all",
  "unassigned",
  "active",
  "needs_review",
  "paused",
  "not_relevant",
  "archived"
] as const;
const cadenceOptions = [
  "all",
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "event_based",
  "as_needed",
  "one_time"
] as const;
const hiddenEffortOptions = [
  "all",
  "noticing",
  "planning",
  "doing",
  "follow_through",
  "emotional_attention"
] as const;

type OwnerFilter = (typeof ownerOptions)[number];
type StatusFilter = (typeof statusOptions)[number];
type CadenceFilter = (typeof cadenceOptions)[number];
type HiddenEffortFilter = (typeof hiddenEffortOptions)[number];

const laneToneClasses: Record<BoardLaneTone, string> = {
  concern: "border-amber-200 bg-amber-50/80",
  playerOne: "border-sky-200 bg-sky-50/80",
  playerTwo: "border-rose-200 bg-rose-50/80",
  kidSplit: "border-violet-200 bg-violet-50/80",
  reserve: "border-stone-200 bg-stone-50/80",
  trimmed: "border-emerald-200 bg-emerald-50/80"
};

const laneDotClasses: Record<BoardLaneTone, string> = {
  concern: "bg-amber-500",
  playerOne: "bg-sky-500",
  playerTwo: "bg-rose-500",
  kidSplit: "bg-violet-500",
  reserve: "bg-stone-500",
  trimmed: "bg-emerald-500"
};

const loadMapWorkbenchBackground =
  "/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png";

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function ownerFor(responsibility: ResponsibilitySummary) {
  const owners = responsibility.currentAssignments.filter(
    (assignment) =>
      assignment.role === "accountable_owner" || assignment.role === "shared_owner"
  );

  if (owners.length === 0) {
    return "Unassigned";
  }

  return owners.map((assignment) => label(assignment.personaKey)).join(" + ");
}

function reviewState(responsibility: ResponsibilitySummary, now = new Date()) {
  if (!responsibility.nextReviewAt) {
    return "none";
  }

  return new Date(responsibility.nextReviewAt).getTime() <= now.getTime()
    ? "due"
    : "upcoming";
}

export function ResponsibilityLoadMap({
  responsibilities,
  loadSnapshot,
  onMove
}: ResponsibilityLoadMapProps) {
  const [owner, setOwner] = useState<OwnerFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cadence, setCadence] = useState<CadenceFilter>("all");
  const [area, setArea] = useState("all");
  const [hiddenEffort, setHiddenEffort] = useState<HiddenEffortFilter>("all");
  const [radar, setRadar] = useState<"all" | "flagged" | "clear">("all");
  const [reviewTiming, setReviewTiming] = useState<
    "all" | "due" | "upcoming" | "none"
  >("all");
  const [searchText, setSearchText] = useState("");
  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null);
  const [practiceBoardOpen, setPracticeBoardOpen] = useState(false);
  const openLoadMapPractice = useCallback(() => {
    setPracticeBoardOpen(true);
  }, []);

  useGuidePracticeRequest("load-map-practice-start", openLoadMapPractice);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const areaOptions = useMemo(() => {
    const keys = new Set<string>();
    responsibilities.forEach((responsibility) => {
      responsibility.areaKeys.forEach((key) => keys.add(key));
    });

    return ["all", ...Array.from(keys).sort()];
  }, [responsibilities]);

  const filteredResponsibilities = responsibilities.filter((responsibility) => {
    const currentOwners = responsibility.currentAssignments.filter(
      (assignment) =>
        assignment.role === "accountable_owner" || assignment.role === "shared_owner"
    );
    const hasOwner =
      owner === "all" ||
      (owner === "unassigned" && currentOwners.length === 0) ||
      currentOwners.some((assignment) => assignment.personaKey === owner);
    const radarFlagged = responsibility.linkedRadarItems.some(
      (item) => item.state !== "resolved"
    );

    const normalizedSearch = searchText.trim().toLowerCase();

    return (
      hasOwner &&
      (status === "all" || responsibility.status === status) &&
      (cadence === "all" || responsibility.cadence === cadence) &&
      (area === "all" || responsibility.areaKeys.includes(area)) &&
      (hiddenEffort === "all" ||
        responsibility.hiddenEffortKeys.includes(
          hiddenEffort as HiddenEffortKey
        )) &&
      (radar === "all" ||
        (radar === "flagged" && radarFlagged) ||
        (radar === "clear" && !radarFlagged)) &&
      (reviewTiming === "all" || reviewState(responsibility) === reviewTiming) &&
      (normalizedSearch.length === 0 ||
        responsibility.title.toLowerCase().includes(normalizedSearch) ||
        responsibility.areaKeys.some((key) =>
          label(key).toLowerCase().includes(normalizedSearch)
        ))
    );
  });

  const responsibilitiesByLane = useMemo(() => {
    const groups = new Map<ResponsibilityBoardLane, ResponsibilitySummary[]>();

    BOARD_LANES.forEach((lane) => groups.set(lane.key, []));
    filteredResponsibilities.forEach((responsibility) => {
      groups.get(responsibility.boardLane)?.push(responsibility);
    });

    groups.forEach((laneResponsibilities) => {
      laneResponsibilities.sort(
        (first, second) =>
          first.boardSortOrder - second.boardSortOrder ||
          first.title.localeCompare(second.title)
      );
    });

    return groups;
  }, [filteredResponsibilities]);
  const firstMoveTargetId = filteredResponsibilities[0]?.id ?? null;

  const handleMove = (move: ResponsibilityBoardMove) => {
    setOpenMoveMenuId(null);
    void onMove?.(move);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const dragged = responsibilities.find(
      (responsibility) => responsibility.id === activeId
    );
    const overLane = BOARD_LANES.find((lane) => lane.key === overId)?.key;
    const overCard = responsibilities.find(
      (responsibility) => responsibility.id === overId
    );
    const toLane = overLane ?? overCard?.boardLane;

    if (!dragged || !toLane) {
      return;
    }

    if (dragged.boardLane === toLane && overId === dragged.id) {
      return;
    }

    if (dragged.boardLane === toLane && overId === toLane) {
      return;
    }

    const destinationCards = responsibilitiesByLane.get(toLane) ?? [];
    const overIndex = destinationCards.findIndex(
      (responsibility) => responsibility.id === overId
    );
    const sortOrder =
      overIndex >= 0
        ? destinationCards[overIndex]?.boardSortOrder ?? overIndex
        : destinationCards.length;

    handleMove({
      responsibilityId: dragged.id,
      toLane,
      sortOrder
    });
  };

  return (
    <section
      className="grid min-w-0 gap-4 overflow-x-clip"
      data-testid="load-map-dashboard-shell"
    >
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
        data-testid="load-map-hero-visual"
      >
        <DecorativeBackgroundLayer
          className="opacity-35 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.52)_50%,rgba(0,0,0,0.1)_100%)]"
          src={loadMapWorkbenchBackground}
          testId="load-map-hero-background"
          washClassName="bg-white/80"
        />
        <div className="fp-generated-surface-wash relative z-10 flex flex-col gap-3 p-3 backdrop-blur-[1px] sm:flex-row sm:items-end sm:justify-between sm:p-4">
          <div className="grid min-w-0 gap-1">
            <p className="text-[13px] font-semibold text-fp-muted-ink">Load map</p>
            <h1 className="text-[26px] font-bold leading-[32px] text-fp-ink sm:text-[28px] sm:leading-[34px]">
              Responsibility overview
            </h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-start gap-2 sm:justify-end">
            <FeatureGuideLauncher
              guide={FEATURE_GUIDES.loadMap}
              showDescription={false}
            />
            {responsibilities.length > 0 ? (
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-fp-primary px-3 text-[14px] font-bold text-fp-on-primary outline-none focus:ring-2 focus:ring-fp-primary/25"
                href="/app/responsibilities/new"
              >
                Add responsibility
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="relative min-w-0 overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink p-2 shadow-[var(--fp-shadow-soft)] sm:p-3"
        data-testid="load-map-dashboard"
      >
        <DecorativeBackgroundLayer
          className="opacity-32 [mask-image:linear-gradient(125deg,black_0%,rgba(0,0,0,0.68)_42%,rgba(0,0,0,0.16)_100%)]"
          src={loadMapWorkbenchBackground}
          testId="load-map-dashboard-background"
          washClassName="bg-white/82"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--fp-alex),var(--fp-shared),var(--fp-max),var(--fp-radar))]"
        />
        <div className="relative z-10 grid min-w-0 gap-2 sm:gap-3">
          <div
            className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8"
            data-testid="load-map-diagnostics"
          >
            <Signal
              label="Owner mix"
              testId="load-map-signal-owner"
              tone="owner"
              value={ownerMix(loadSnapshot.ownerDistribution)}
            >
              <AssignmentShift
                className="mt-1 w-fit origin-left scale-90"
                from="alex"
                label="Owner mix visual"
                to="max"
              />
            </Signal>
            <Signal
              label="Shared"
              testId="load-map-signal-shared"
              tone="shared"
              value={String(loadSnapshot.sharedDistribution.shared ?? 0)}
            />
            <Signal
              label="Open radar"
              testId="load-map-signal-radar"
              tone="radar"
              value={String(loadSnapshot.radarOpenCount)}
            />
            <Signal
              label="Due review"
              testId="load-map-signal-review"
              tone="review"
              value={String(loadSnapshot.reviewDueCount)}
            />
            <Signal
              label="Paused or out"
              testId="load-map-signal-reserve"
              tone="reserve"
              value={String(loadSnapshot.pausedOrNotRelevantCount)}
            />
            <Signal
              label="High frequency"
              testId="load-map-signal-cadence"
              tone="cadence"
              value={String(
                (loadSnapshot.cadenceDistribution.daily ?? 0) +
                  (loadSnapshot.cadenceDistribution.weekly ?? 0)
              )}
            />
            <Signal
              label="Area mix"
              testId="load-map-signal-area"
              tone="area"
              value={summaryMix(loadSnapshot.areaDistribution)}
            />
            <Signal
              label="Hidden effort mix"
              testId="load-map-signal-effort"
              tone="effort"
              value={summaryMix(loadSnapshot.hiddenEffortMix)}
            />
          </div>

          <div
            className="grid min-w-0 gap-2 rounded-[8px] border border-white/70 bg-white/88 p-2 backdrop-blur-[1px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]"
            data-guide-id="load-map-filters"
          >
            <FilterGroup legend="Ownership">
              <Select
                label="Owner"
                onChange={setOwner}
                options={ownerOptions}
                value={owner}
              />
              <Select
                label="Hidden effort"
                onChange={setHiddenEffort}
                options={hiddenEffortOptions}
                value={hiddenEffort}
              />
            </FilterGroup>
            <FilterGroup columns="three" legend="Card details">
              <Select
                label="Status"
                onChange={setStatus}
                options={statusOptions}
                value={status}
              />
              <Select
                label="Cadence"
                onChange={setCadence}
                options={cadenceOptions}
                value={cadence}
              />
              <Select
                label="Area"
                onChange={setArea}
                options={areaOptions}
                value={area}
              />
            </FilterGroup>
            <FilterGroup legend="Attention">
              <Select
                label="Radar"
                onChange={setRadar}
                options={["all", "flagged", "clear"] as const}
                value={radar}
              />
              <Select
                label="Review timing"
                onChange={setReviewTiming}
                options={["all", "due", "upcoming", "none"] as const}
                value={reviewTiming}
              />
            </FilterGroup>
            <FilterGroup legend="Find">
              <label className="grid min-w-0 gap-1 text-[13px] font-semibold text-fp-muted-ink">
                Search
                <input
                  aria-label="Search responsibilities"
                  className="min-h-10 w-full min-w-0 rounded-[8px] border border-fp-line bg-white px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
                  onChange={(event) => setSearchText(event.target.value)}
                  type="search"
                  value={searchText}
                />
              </label>
            </FilterGroup>
          </div>
        </div>
      </div>

      {responsibilities.length === 0 ? (
        <div
          className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink"
          data-testid="load-map-empty-visual"
        >
          <DecorativeBackgroundLayer
            className="opacity-30 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.5)_52%,rgba(0,0,0,0.12)_100%)]"
            src={loadMapWorkbenchBackground}
            testId="load-map-empty-background"
            washClassName="bg-white/85"
          />
          <div className="fp-generated-surface-wash relative z-10 grid gap-4 p-5 backdrop-blur-[1px] sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-3">
              <h2 className="text-[18px] font-bold">No responsibilities mapped yet.</h2>
              <p className="text-[14px] leading-6 text-fp-muted-ink">
                Add one household responsibility and decide what needs attention first.
              </p>
              <LoadMapPracticeBoard
                useBoardGuideTarget
              />
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-bold sm:w-fit"
                href="/app/responsibilities/new"
              >
                Add responsibility
              </Link>
            </div>
            <HelperMascot className="h-24 w-24 justify-self-start sm:justify-self-end" decorative />
          </div>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <div
            data-guide-id={
              filteredResponsibilities.length > 0 ? "load-map-board" : undefined
            }
            data-testid="load-map-board"
          >
            <div
              className="-mx-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:px-0"
              data-testid="load-map-board-scroller"
            >
              <div
                className="flex min-w-max gap-3"
                data-guide-id={
                  filteredResponsibilities.length > 0 ? "load-map-lanes" : undefined
                }
                data-testid="load-map-lane-strip"
              >
                {BOARD_LANES.map((lane) => {
                  const laneResponsibilities =
                    responsibilitiesByLane.get(lane.key) ?? [];

                  return (
                    <BoardLaneColumn
                      key={lane.key}
                      lane={lane}
                      moveGuideTargetId={firstMoveTargetId}
                      onMove={handleMove}
                      openMoveMenuId={openMoveMenuId}
                      responsibilities={laneResponsibilities}
                      setOpenMoveMenuId={setOpenMoveMenuId}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          {filteredResponsibilities.length === 0 ? (
            <div className="grid gap-3">
              <p className="rounded-[8px] border border-fp-line bg-white p-4 text-[14px] text-fp-muted-ink">
                No responsibilities match these filters.
              </p>
              <LoadMapPracticeBoard
                useBoardGuideTarget
              />
            </div>
          ) : null}
          {practiceBoardOpen && filteredResponsibilities.length > 0 ? (
            <LoadMapPracticeBoard />
          ) : null}
        </DndContext>
      )}
    </section>
  );
}

function BoardLaneColumn({
  lane,
  moveGuideTargetId,
  onMove,
  openMoveMenuId,
  responsibilities,
  setOpenMoveMenuId
}: {
  lane: (typeof BOARD_LANES)[number];
  moveGuideTargetId: string | null;
  onMove: (move: ResponsibilityBoardMove) => void;
  openMoveMenuId: string | null;
  responsibilities: ResponsibilitySummary[];
  setOpenMoveMenuId: (id: string | null) => void;
}) {
  const headingId = `load-board-lane-${lane.key}`;
  const { isOver, setNodeRef } = useDroppable({ id: lane.key });

  return (
    <section
      aria-labelledby={headingId}
      className={[
        "flex max-h-[min(64vh,40rem)] w-[min(17.5rem,calc(100vw-2rem))] shrink-0 flex-col rounded-[8px] border p-2.5 transition sm:p-3",
        laneToneClasses[lane.tone],
        isOver ? "ring-2 ring-fp-ink/25" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      ref={setNodeRef}
    >
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={[
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  laneDotClasses[lane.tone]
                ].join(" ")}
              />
              <h2
                className="break-words text-[16px] font-bold leading-6 text-fp-ink"
                id={headingId}
              >
                {lane.label}
              </h2>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-fp-muted-ink">
              {lane.shortHelp}
            </p>
          </div>
          <span className="shrink-0 rounded-[8px] border border-white/70 bg-white/75 px-2 py-1 text-[12px] font-bold text-fp-ink">
            {responsibilities.length}{" "}
            {responsibilities.length === 1 ? "card" : "cards"}
          </span>
        </div>
      </div>

      <SortableContext
        items={responsibilities.map((responsibility) => responsibility.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-3 grid flex-1 content-start gap-3 overflow-y-auto pr-1">
          {responsibilities.map((responsibility) => (
            <SortableResponsibilityCard
              dataGuideId={
                responsibility.id === moveGuideTargetId
                  ? "load-map-move-target"
                  : undefined
              }
              key={responsibility.id}
              onMove={onMove}
              openMoveMenuId={openMoveMenuId}
              responsibility={responsibility}
              setOpenMoveMenuId={setOpenMoveMenuId}
            />
          ))}
          {responsibilities.length === 0 ? (
            <p className="min-h-24 rounded-[8px] border border-dashed border-white/80 bg-white/55 p-3 text-[13px] leading-5 text-fp-muted-ink">
              Drop a card here when it matches this lane.
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function LoadMapPracticeBoard({
  useBoardGuideTarget = false
}: {
  useBoardGuideTarget?: boolean;
}) {
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [primaryLane, setPrimaryLane] = useState<"not_in_play" | "player_1">(
    "not_in_play"
  );
  const [draftTitle, setDraftTitle] = useState("Dummy lunch plan");
  const [savedTitle, setSavedTitle] = useState("Dummy lunch plan");
  const [duplicateState, setDuplicateState] = useState<
    "active" | "trimmed" | "deleted"
  >("active");

  function completeOnce(eventId: string) {
    completeGuidePractice(eventId);
  }

  return (
    <div
      className="relative z-[60] grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-id={useBoardGuideTarget ? "load-map-board" : undefined}
      data-guide-practice-surface
      data-testid="load-map-practice-board"
    >
      <p className="text-[13px] font-bold text-fp-ink">Practice board</p>
      <div
        className="grid gap-2 sm:grid-cols-3"
        data-guide-id={useBoardGuideTarget ? "load-map-lanes" : undefined}
      >
        <div className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <p className="text-[12px] font-bold uppercase tracking-normal text-fp-muted-ink">
            Not in Play
          </p>
          {primaryLane === "not_in_play" ? (
            <div className="mt-2 grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3">
              <p className="text-[13px] font-bold text-fp-ink">{savedTitle}</p>
              <label className="grid gap-1 text-[12px] font-semibold text-fp-muted-ink">
                Dummy card title
                <input
                  className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 text-[13px] text-fp-ink"
                  onChange={(event) => setDraftTitle(event.target.value)}
                  value={draftTitle}
                />
              </label>
              <button
                className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
                onClick={() => {
                  setSavedTitle(draftTitle.trim() || "Dummy lunch plan");
                  completeOnce("load-map-edit");
                }}
                type="button"
              >
                Save dummy card edit
              </button>
              <div className="relative">
                <button
                  aria-expanded={moveMenuOpen}
                  aria-haspopup="menu"
                  className="min-h-9 w-full rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
                  data-guide-id="load-map-move-target"
                  onClick={() => setMoveMenuOpen((open) => !open)}
                  type="button"
                >
                  Open dummy move menu
                </button>
                {moveMenuOpen ? (
                  <div
                    className="absolute left-0 right-0 top-10 z-10 grid rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-2 shadow-lg"
                    role="menu"
                  >
                    <button
                      className="rounded-[6px] px-3 py-2 text-left text-[13px] font-semibold text-fp-ink hover:bg-[var(--fp-surface-muted)]"
                      onClick={() => {
                        setPrimaryLane("player_1");
                        setMoveMenuOpen(false);
                        completeOnce("load-map-move");
                      }}
                      role="menuitem"
                      type="button"
                    >
                      Alex
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] text-fp-muted-ink">
              Moved out of this lane.
            </p>
          )}
        </div>
        <div className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <p className="text-[12px] font-bold uppercase tracking-normal text-fp-muted-ink">
            Alex
          </p>
          {primaryLane === "player_1" ? (
            <div className="mt-2 grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3">
              <p className="text-[13px] font-bold text-fp-ink">
                {savedTitle} is in Alex.
              </p>
              <label className="grid gap-1 text-[12px] font-semibold text-fp-muted-ink">
                Dummy card title
                <input
                  className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 text-[13px] text-fp-ink"
                  onChange={(event) => setDraftTitle(event.target.value)}
                  value={draftTitle}
                />
              </label>
              <button
                className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
                onClick={() => {
                  setSavedTitle(draftTitle.trim() || "Dummy lunch plan");
                  completeOnce("load-map-edit");
                }}
                type="button"
              >
                Save dummy card edit
              </button>
            </div>
          ) : (
            <p className="mt-2 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] text-fp-muted-ink">
              Practice landing lane
            </p>
          )}
        </div>
        <div className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
          <p className="text-[12px] font-bold uppercase tracking-normal text-fp-muted-ink">
            Trimmed
          </p>
          {duplicateState === "deleted" ? (
            <p className="mt-2 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] text-fp-muted-ink">
              Dummy duplicate deleted.
            </p>
          ) : (
            <div className="mt-2 grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3">
              <p className="text-[13px] font-bold text-fp-ink">
                {duplicateState === "trimmed"
                  ? "Dummy duplicate is trimmed."
                  : "Dummy duplicate card"}
              </p>
              <button
                className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
                onClick={() => {
                  setDuplicateState("trimmed");
                  completeOnce("load-map-trim");
                }}
                type="button"
              >
                Trim dummy duplicate
              </button>
              <button
                className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
                onClick={() => {
                  setDuplicateState("deleted");
                  completeOnce("load-map-trim");
                  completeOnce("load-map-delete");
                }}
                type="button"
              >
                Delete dummy duplicate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableResponsibilityCard({
  dataGuideId,
  onMove,
  openMoveMenuId,
  responsibility,
  setOpenMoveMenuId
}: {
  dataGuideId?: string;
  onMove: (move: ResponsibilityBoardMove) => void;
  openMoveMenuId: string | null;
  responsibility: ResponsibilitySummary;
  setOpenMoveMenuId: (id: string | null) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: responsibility.id });
  const moveMenuOpen = openMoveMenuId === responsibility.id;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <MotionPanel>
      <article
        className={[
          "relative grid min-w-0 gap-2.5 rounded-[8px] border border-fp-line bg-white p-2.5 shadow-sm outline-none transition focus-within:ring-2 focus-within:ring-fp-ink/20",
          isDragging ? "scale-[1.02] shadow-lg ring-2 ring-fp-ink/20" : ""
        ]
          .filter(Boolean)
          .join(" ")}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              className="outline-none focus-visible:underline"
              href={`/app/responsibilities/${responsibility.id}`}
            >
              <h3 className="break-words text-[15px] font-bold leading-6 text-fp-ink">
                {responsibility.title}
              </h3>
            </Link>
            <p className="break-words text-[13px] text-fp-muted-ink">
              {ownerFor(responsibility)}
            </p>
          </div>
          <span className="max-w-[9rem] shrink-0 break-words rounded-[8px] border border-fp-line px-2 py-1 text-[12px] font-semibold leading-4">
            {label(responsibility.status)}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 text-[12px] font-semibold text-fp-muted-ink">
          <span className="break-words">{label(responsibility.cadence)}</span>
          {responsibility.areaKeys.map((key) => (
            <span className="break-words" key={key}>
              {label(key)}
            </span>
          ))}
          {responsibility.hiddenEffortKeys.map((key) => (
            <span className="break-words" key={key}>
              {label(key)}
            </span>
          ))}
          <span className="break-words">{label(reviewState(responsibility))}</span>
        </div>
        <div className="relative">
          <button
            aria-expanded={moveMenuOpen}
            aria-haspopup="menu"
            className="inline-flex min-h-9 w-full items-center justify-center rounded-[8px] border border-fp-line bg-fp-surface px-3 text-[13px] font-bold text-fp-ink outline-none hover:bg-white focus:ring-2 focus:ring-fp-ink/20"
            data-guide-id={dataGuideId}
            onClick={() =>
              setOpenMoveMenuId(moveMenuOpen ? null : responsibility.id)
            }
            type="button"
          >
            Move {responsibility.title}
          </button>
          {moveMenuOpen ? (
            <div
              className="absolute left-0 right-0 top-10 z-10 grid gap-1 rounded-[8px] border border-fp-line bg-white p-2 shadow-lg"
              role="menu"
            >
              {BOARD_LANES.filter(
                (lane) => lane.key !== responsibility.boardLane
              ).map((lane) => (
                <button
                  className="rounded-[6px] px-3 py-2 text-left text-[13px] font-semibold text-fp-ink outline-none hover:bg-fp-surface focus:bg-fp-surface"
                  key={lane.key}
                  onClick={() =>
                    onMove({
                      responsibilityId: responsibility.id,
                      toLane: lane.key
                    })
                  }
                  role="menuitem"
                  type="button"
                >
                  {lane.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </MotionPanel>
  );
}

function ownerMix(distribution: Record<string, number>) {
  return `A ${distribution.alex ?? 0} / M ${distribution.max ?? 0}`;
}

function summaryMix(distribution: Record<string, number>) {
  const visibleEntries = Object.entries(distribution).filter(
    ([, value]) => value > 0
  );

  if (visibleEntries.length === 0) {
    return "None";
  }

  return visibleEntries
    .map(([key, value]) => `${label(key)} ${value}`)
    .join(" / ");
}

function FilterGroup({
  children,
  columns = "two",
  legend
}: {
  children: ReactNode;
  columns?: "two" | "three";
  legend: string;
}) {
  const columnClass =
    columns === "three"
      ? "sm:grid-cols-3"
      : "sm:grid-cols-2 xl:grid-cols-1";

  return (
    <fieldset
      className={[
        "grid min-w-0 content-start gap-2 rounded-[8px] border border-fp-line bg-white/90 p-2.5",
        columnClass
      ].join(" ")}
    >
      <legend className="px-1 text-[12px] font-bold uppercase tracking-normal text-fp-muted-ink">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

const signalToneClasses = {
  area: "border-emerald-200 bg-emerald-50/90",
  cadence: "border-indigo-200 bg-indigo-50/90",
  effort: "border-violet-200 bg-violet-50/90",
  owner: "border-sky-200 bg-sky-50/90",
  radar: "border-amber-200 bg-amber-50/90",
  reserve: "border-stone-200 bg-stone-50/90",
  review: "border-rose-200 bg-rose-50/90",
  shared: "border-teal-200 bg-teal-50/90"
} as const;

const signalAccentClasses: Record<keyof typeof signalToneClasses, string> = {
  area: "bg-emerald-500",
  cadence: "bg-indigo-500",
  effort: "bg-violet-500",
  owner: "bg-sky-500",
  radar: "bg-amber-500",
  reserve: "bg-stone-500",
  review: "bg-rose-500",
  shared: "bg-teal-500"
};

function Signal({
  children,
  label,
  testId,
  tone,
  value
}: {
  children?: ReactNode;
  label: string;
  testId: string;
  tone: keyof typeof signalToneClasses;
  value: string;
}) {
  return (
    <div
      className={[
        "min-w-0 overflow-hidden rounded-[8px] border p-2.5 shadow-sm",
        signalToneClasses[tone]
      ].join(" ")}
      data-testid={testId}
    >
      <div
        aria-hidden="true"
        className={["mb-2 h-1 w-10 rounded-full", signalAccentClasses[tone]].join(
          " "
        )}
      />
      <p className="text-[12px] font-semibold leading-4 text-fp-muted-ink">
        {label}
      </p>
      <p
        className="mt-0.5 break-words text-[18px] font-bold leading-[22px] text-fp-ink [overflow-wrap:anywhere]"
        data-testid={`${testId}-value`}
      >
        {value}
      </p>
      {children}
    </div>
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
    <label className="grid min-w-0 gap-1 text-[13px] font-semibold text-fp-muted-ink">
      {labelText}
      <select
        className="min-h-10 w-full min-w-0 rounded-[8px] border border-fp-line bg-white px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "All" : label(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
