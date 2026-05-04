"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  LoadSnapshotSummary,
  ResponsibilitySummary
} from "@/contracts/responsibilities";
import type { HiddenEffortKey } from "@/domain/enums";

type ResponsibilityLoadMapProps = {
  responsibilities: ResponsibilitySummary[];
  loadSnapshot: LoadSnapshotSummary;
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
  loadSnapshot
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
      (reviewTiming === "all" || reviewState(responsibility) === reviewTiming)
    );
  });

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <p className="text-[13px] font-semibold text-fp-muted-ink">Load map</p>
          <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
            Responsibility overview
          </h1>
        </div>
        {responsibilities.length > 0 ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white outline-none focus:ring-2 focus:ring-fp-ink/25"
            href="/app/responsibilities/new"
          >
            Add responsibility
          </Link>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Signal label="Owner mix" value={ownerMix(loadSnapshot.ownerDistribution)} />
        <Signal
          label="Shared"
          value={String(loadSnapshot.sharedDistribution.shared ?? 0)}
        />
        <Signal label="Open radar" value={String(loadSnapshot.radarOpenCount)} />
        <Signal label="Due review" value={String(loadSnapshot.reviewDueCount)} />
        <Signal
          label="Paused or out"
          value={String(loadSnapshot.pausedOrNotRelevantCount)}
        />
        <Signal
          label="High frequency"
          value={String(
            (loadSnapshot.cadenceDistribution.daily ?? 0) +
              (loadSnapshot.cadenceDistribution.weekly ?? 0)
          )}
        />
        <Signal
          label="Area mix"
          value={summaryMix(loadSnapshot.areaDistribution)}
        />
        <Signal
          label="Hidden effort mix"
          value={summaryMix(loadSnapshot.hiddenEffortMix)}
        />
      </div>

      <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Owner" onChange={setOwner} options={ownerOptions} value={owner} />
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
        <Select label="Area" onChange={setArea} options={areaOptions} value={area} />
        <Select
          label="Hidden effort"
          onChange={setHiddenEffort}
          options={hiddenEffortOptions}
          value={hiddenEffort}
        />
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
      </div>

      {responsibilities.length === 0 ? (
        <div className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-5">
          <h2 className="text-[18px] font-bold">No responsibilities mapped yet.</h2>
          <p className="text-[14px] leading-6 text-fp-muted-ink">
            Add one household responsibility and decide what needs attention first.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-bold"
            href="/app/responsibilities/new"
          >
            Add responsibility
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredResponsibilities.map((responsibility) => (
            <Link
              className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-4 outline-none focus:ring-2 focus:ring-fp-ink/20"
              href={`/app/responsibilities/${responsibility.id}`}
              key={responsibility.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold leading-6">
                    {responsibility.title}
                  </h2>
                  <p className="text-[13px] text-fp-muted-ink">
                    {ownerFor(responsibility)}
                  </p>
                </div>
                <span className="shrink-0 rounded-[8px] border border-fp-line px-2 py-1 text-[12px] font-semibold">
                  {label(responsibility.status)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-fp-muted-ink">
                <span>{label(responsibility.cadence)}</span>
                {responsibility.areaKeys.map((key) => (
                  <span key={key}>{label(key)}</span>
                ))}
                {responsibility.hiddenEffortKeys.map((key) => (
                  <span key={key}>{label(key)}</span>
                ))}
                <span>{label(reviewState(responsibility))}</span>
              </div>
            </Link>
          ))}
          {filteredResponsibilities.length === 0 ? (
            <p className="rounded-[8px] border border-fp-line bg-white p-4 text-[14px] text-fp-muted-ink">
              No responsibilities match these filters.
            </p>
          ) : null}
        </div>
      )}
    </section>
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

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-fp-line bg-white p-3">
      <p className="text-[12px] font-semibold text-fp-muted-ink">{label}</p>
      <p className="mt-1 text-[20px] font-bold text-fp-ink">{value}</p>
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
    <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
      {labelText}
      <select
        className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
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
