"use client";

import { MoveRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { CardTemplateLabel } from "@/contracts/card-templates";
import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilityAssignmentSummary } from "@/contracts/responsibilities";
import type { ResponsibilityBoardLane } from "@/domain/enums";
import type { CardDistributionBucket } from "@/components/cards/card-state";
import {
  CARD_BUCKET_LABELS,
  bucketForLane,
  laneForBucket
} from "@/components/cards/card-state";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import {
  OwnershipDetails,
  type OwnershipAgreementSubmission
} from "@/components/responsibilities/ownership-details";

export type CardDetailCard = {
  id: string;
  updatedAt: string;
  title: string;
  labels?: readonly CardTemplateLabel[];
  boardLane?: ResponsibilityBoardLane;
  ownerLabel?: string | null;
  definition?: string | null;
  conception?: string | null;
  currentAssignments?: readonly ResponsibilityAssignmentSummary[];
  planning?: string | null;
  execution?: string | null;
  minimumStandard?: string | null;
  householdStandard?: string | null;
  hiddenEffortKeys?: readonly string[];
  nextReviewAt?: string | null;
  notes?: string | null;
  coverAssetPath?: string | null;
  sourceCoverAssetPath?: string | null;
};

type CardDetailSheetProps = {
  card: CardDetailCard;
  onMove?: (bucket: CardDistributionBucket) => void;
  onSaveOwnership?: (
    agreement: OwnershipAgreementSubmission
  ) => Promise<void> | void;
  onSaveStandards?: (standard: string) => Promise<void> | void;
  personas?: readonly PersonaSummary[];
};

const aiDraftCoverPathPattern =
  /^\/api\/ai-card-drafts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/cover$/i;

const labelTone: Record<CardTemplateLabel, Parameters<typeof Chip>[0]["tone"]> = {
  Caregiving: "caregiving",
  "Daily Grind": "daily",
  Out: "out",
  Home: "home",
  Magic: "magic",
  Wild: "wild",
  "Happiness Trio": "happiness",
  Kids: "kids",
  "Kid Split": "kid-split"
};

const moveBuckets = ["alex", "max", "savedForLater", "notApplicable"] as const;

export function CardDetailSheet({
  card,
  onMove,
  onSaveOwnership,
  onSaveStandards,
  personas
}: CardDetailSheetProps) {
  const standardsDefaultText = standardsTextFor(card);
  const [selectedBucket, setSelectedBucket] = useState<CardDistributionBucket | "">("");
  const [standardsDraft, setStandardsDraft] = useState(() => standardsDefaultText);
  const [savingStandards, setSavingStandards] = useState(false);
  const [standardsStatus, setStandardsStatus] = useState<string | null>(null);
  const [standardsError, setStandardsError] = useState<string | null>(null);
  const laneLabel = card.boardLane
    ? CARD_BUCKET_LABELS[bucketForLane(card.boardLane)]
    : "Unassigned";
  const ownerLabel = card.ownerLabel ?? laneLabel;
  const isGeneratedCover = aiDraftCoverPathPattern.test(card.sourceCoverAssetPath ?? "");
  const coverAssetPath = card.sourceCoverAssetPath ?? card.coverAssetPath ?? null;
  const availableMoveBuckets = moveBuckets.filter(
    (bucket) => laneForBucket(bucket) !== card.boardLane
  );
  const ownershipPhases = [
    { label: "Conception", value: card.conception },
    { label: "Planning", value: card.planning },
    { label: "Execution", value: card.execution }
  ];

  function moveSelectedCard() {
    if (!selectedBucket) {
      return;
    }

    onMove?.(selectedBucket);
  }

  useEffect(() => {
    setStandardsDraft(standardsDefaultText);
    setStandardsStatus(null);
    setStandardsError(null);
  }, [card.id, standardsDefaultText]);

  async function saveStandards() {
    if (!onSaveStandards) {
      return;
    }

    setSavingStandards(true);
    setStandardsStatus(null);
    setStandardsError(null);

    try {
      await onSaveStandards(standardsDraft.trim());
      setStandardsStatus("Estandards saved.");
    } catch {
      setStandardsError("Unable to save Estandards right now. Try again.");
    } finally {
      setSavingStandards(false);
    }
  }

  return (
    <Sheet className="grid gap-4 p-0 sm:p-0">
      <div
        className={
          isGeneratedCover
            ? "grid overflow-hidden rounded-[8px] bg-[var(--fp-card)] lg:grid-cols-[minmax(360px,44vw)_1fr]"
            : "grid overflow-hidden rounded-[8px] bg-[var(--fp-card)] lg:grid-cols-[minmax(240px,340px)_1fr]"
        }
      >
        <div
          className={
            isGeneratedCover
              ? "grid min-h-[520px] border-b border-fp-line bg-[var(--fp-card-muted)] lg:min-h-[700px] lg:border-b-0 lg:border-r"
              : "grid min-h-[360px] border-b border-fp-line bg-[var(--fp-card-muted)] lg:border-b-0 lg:border-r"
          }
        >
          <div
            className={
              isGeneratedCover
                ? "relative grid min-h-[520px] place-items-center overflow-hidden bg-[var(--fp-card-muted)] lg:min-h-[700px]"
                : "grid place-items-center p-5"
            }
            data-testid={
              isGeneratedCover ? "generated-cover-art-panel" : "source-cover-art-panel"
            }
          >
            {coverAssetPath ? (
              <Image
                alt={`${card.title} cover`}
                className={
                  isGeneratedCover
                    ? "h-full min-h-[520px] w-full object-cover lg:min-h-[700px]"
                    : "h-full max-h-[420px] w-full rounded-[8px] object-contain shadow-[var(--fp-shadow-soft)]"
                }
                height={isGeneratedCover ? 2044 : 700}
                priority={false}
                src={coverAssetPath}
                unoptimized
                width={isGeneratedCover ? 1460 : 500}
              />
            ) : (
              <div className="grid aspect-[5/7] w-full max-w-[280px] place-items-center rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-5 text-center shadow-[var(--fp-shadow-soft)]">
                <div className="grid gap-2">
                  <p className="text-[12px] font-bold uppercase text-fp-muted-ink">
                    Fairplay card
                  </p>
                  <p className="text-[26px] font-bold leading-8 text-fp-ink">
                    {card.title}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid content-start gap-5 p-5 pb-28 sm:p-6 sm:pb-28 lg:pb-6">
          <header className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {(card.labels ?? []).map((label) => (
                <Chip key={label} tone={labelTone[label]}>
                  {label}
                </Chip>
              ))}
            </div>
            <h1 className="text-[30px] font-bold leading-9 text-fp-ink">
              {card.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Chip>Assigned to {ownerLabel}</Chip>
              <Chip>{laneLabel}</Chip>
            </div>
          </header>

          <section className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-4">
            <h2 className="text-[16px] font-bold text-fp-ink">
              What is this card for?
            </h2>
            <p className="whitespace-pre-wrap text-[14px] leading-6 text-fp-muted-ink [overflow-wrap:anywhere]">
              {card.definition || "No purpose has been written for this card yet."}
            </p>
          </section>

          <section className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-4">
            <div className="grid gap-1">
              <h2 className="text-[16px] font-bold text-fp-ink">
                Full ownership includes
              </h2>
              <p className="text-[13px] leading-5 text-fp-muted-ink">
                The thinking and follow-through that sit behind the visible task.
              </p>
            </div>
            <dl className="grid gap-3">
              {ownershipPhases.map(({ label, value }) => (
                <div className="grid gap-1" key={label}>
                  <dt className="text-[13px] font-bold text-fp-ink">{label}</dt>
                  <dd className="whitespace-pre-wrap text-[13px] leading-5 text-fp-muted-ink [overflow-wrap:anywhere]">
                    {value || `No ${label.toLowerCase()} notes yet.`}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2" aria-label="Hidden effort">
              {(card.hiddenEffortKeys ?? []).map((effort) => (
                <Chip key={effort}>{humanize(effort)}</Chip>
              ))}
              {(card.hiddenEffortKeys ?? []).length === 0 ? (
                <span className="text-[13px] font-semibold text-fp-muted-ink">
                  No hidden-effort tags yet.
                </span>
              ) : null}
            </div>
            <p className="text-[13px] font-semibold text-fp-muted-ink">
              {card.nextReviewAt ? (
                <>
                  Review by{" "}
                  <time dateTime={card.nextReviewAt}>
                    {formatReviewDate(card.nextReviewAt)}
                  </time>
                </>
              ) : (
                "No review date set."
              )}
            </p>
          </section>

          <section className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-4">
            <h2 className="text-[16px] font-bold text-fp-ink">
              Fogging Estandards
            </h2>
            <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
              <textarea
                aria-label="Fogging Estandards"
                className="fp-input min-h-32 w-full min-w-0 max-w-full px-3 py-2 text-[14px] leading-6 [overflow-wrap:anywhere] disabled:opacity-70"
                disabled={!onSaveStandards || savingStandards}
                onChange={(event) => setStandardsDraft(event.target.value)}
                value={standardsDraft}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!onSaveStandards || savingStandards}
                onClick={() => void saveStandards()}
                variant="primary"
              >
                {savingStandards ? "Saving..." : "Save Estandards"}
              </Button>
              {standardsStatus ? (
                <p className="text-[13px] font-semibold text-fp-muted-ink" role="status">
                  {standardsStatus}
                </p>
              ) : null}
              {standardsError ? (
                <p className="text-[13px] font-semibold text-fp-danger" role="alert">
                  {standardsError}
                </p>
              ) : null}
            </div>
          </section>

          {personas ? (
            <OwnershipDetails
              currentAssignments={card.currentAssignments ?? []}
              expectedUpdatedAt={card.updatedAt}
              nextReviewAt={card.nextReviewAt ?? null}
              onSave={onSaveOwnership}
              personas={personas}
            />
          ) : null}

          <section className="grid gap-3">
            <h2 className="text-[18px] font-bold text-fp-ink">Assign lane</h2>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
                Destination
                <select
                  aria-label="Move destination"
                  className="fp-input px-3 text-[15px] disabled:opacity-60"
                  disabled={!onMove}
                  onChange={(event) =>
                    setSelectedBucket(event.target.value as CardDistributionBucket | "")
                  }
                  value={selectedBucket}
                >
                  <option value="">Choose lane</option>
                  {availableMoveBuckets.map((bucket) => (
                    <option key={bucket} value={bucket}>
                      {CARD_BUCKET_LABELS[bucket]}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                className="self-end"
                disabled={!onMove || !selectedBucket}
                onClick={moveSelectedCard}
              >
                <MoveRight aria-hidden="true" size={16} />
                Move
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Sheet>
  );
}

function standardsTextFor(card: CardDetailCard) {
  return (
    card.householdStandard ??
    card.minimumStandard ??
    "No standard has been written for this card yet."
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(value));
}

function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
