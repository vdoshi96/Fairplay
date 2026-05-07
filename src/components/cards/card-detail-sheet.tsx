"use client";

import { CalendarClock, Flag, MoveRight, Scissors } from "lucide-react";
import Image from "next/image";

import type { CardTemplateLabel } from "@/contracts/card-templates";
import type { ResponsibilityBoardLane } from "@/domain/enums";
import { RESPONSIBILITY_BOARD_LANES } from "@/domain/enums";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";

export type CardDetailCard = {
  id: string;
  title: string;
  labels?: readonly CardTemplateLabel[];
  boardLane?: ResponsibilityBoardLane;
  ownerLabel?: string | null;
  definition?: string | null;
  conception?: string | null;
  planning?: string | null;
  execution?: string | null;
  minimumStandard?: string | null;
  householdStandard?: string | null;
  notes?: string | null;
  coverAssetPath?: string | null;
  sourceCoverAssetPath?: string | null;
};

const aiDraftCoverPathPattern =
  /^\/api\/ai-card-drafts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/cover$/i;

type CardDetailSheetProps = {
  card: CardDetailCard;
  onFlagForRadar?: () => void;
  onMove?: (lane: ResponsibilityBoardLane) => void;
  onScheduleCheckIn?: () => void;
  onTrim?: () => void;
};

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

const laneLabels: Record<ResponsibilityBoardLane, string> = {
  cards_of_concern: "Cards of Concern",
  player_1: "Alex",
  player_2: "Max",
  kid_split: "Kid Split",
  not_in_play: "Not in Play",
  trimmed: "Trimmed"
};

export function CardDetailSheet({
  card,
  onFlagForRadar,
  onMove,
  onScheduleCheckIn,
  onTrim
}: CardDetailSheetProps) {
  const laneLabel = card.boardLane ? laneLabels[card.boardLane] : "Not placed";
  const ownerLabel = card.ownerLabel ?? laneLabel;
  const isGeneratedCover = aiDraftCoverPathPattern.test(card.sourceCoverAssetPath ?? "");
  const coverAssetPath = card.sourceCoverAssetPath ?? card.coverAssetPath ?? null;
  const noActionHooks =
    !onFlagForRadar && !onMove && !onScheduleCheckIn && !onTrim;
  const unavailableMessage = noActionHooks
    ? "Card actions are unavailable on this page. Use the editor below or return to the load map."
    : "Some card actions are unavailable on this page.";
  const unavailableMessageId = `${card.id}-card-actions-unavailable`;

  return (
    <Sheet className="grid gap-5 p-0 sm:p-0">
      <div
        className={
          isGeneratedCover
            ? "grid overflow-hidden rounded bg-white lg:grid-cols-[minmax(380px,48vw)_1fr]"
            : "grid overflow-hidden rounded bg-white lg:grid-cols-[minmax(260px,360px)_1fr]"
        }
      >
        <div
          className={
            isGeneratedCover
              ? "grid min-h-[600px] grid-rows-[minmax(520px,1fr)_auto] border-b border-fp-line bg-fp-surface lg:min-h-[760px] lg:border-b-0 lg:border-r"
              : "grid min-h-[420px] grid-rows-[minmax(300px,1fr)_auto] border-b border-fp-line bg-fp-surface lg:border-b-0 lg:border-r"
          }
        >
          <div
            className={
              isGeneratedCover
                ? "relative grid min-h-[520px] place-items-center overflow-hidden bg-fp-surface lg:min-h-[680px]"
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
                    ? "h-full min-h-[520px] w-full object-cover lg:min-h-[680px]"
                    : "h-full max-h-[420px] w-full rounded object-contain shadow-[var(--fp-shadow-soft)]"
                }
                height={isGeneratedCover ? 2044 : 700}
                priority={false}
                src={coverAssetPath}
                unoptimized
                width={isGeneratedCover ? 1460 : 500}
              />
            ) : (
              <div className="grid aspect-[5/7] w-full max-w-[280px] place-items-center rounded border border-fp-line bg-white p-5 text-center shadow-[var(--fp-shadow-soft)]">
                <div className="grid gap-2">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-fp-muted-ink">
                    Fairplay card
                  </p>
                  <p className="text-[26px] font-bold leading-8 text-fp-ink">
                    {card.title}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-2 border-t border-fp-line bg-white/80 p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-fp-muted-ink">
              Lane / Owner
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip>{laneLabel}</Chip>
              {ownerLabel !== laneLabel ? <Chip>{ownerLabel}</Chip> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 pb-28 sm:p-6 sm:pb-28 lg:pb-6">
          <header className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {(card.labels ?? []).map((label) => (
                <Chip key={label} tone={labelTone[label]}>
                  {label}
                </Chip>
              ))}
            </div>
            <div className="grid gap-2">
              <h1 className="text-[30px] font-bold leading-9 text-fp-ink">
                {card.title}
              </h1>
              {card.definition ? (
                <p className="text-[15px] leading-7 text-fp-muted-ink">
                  {card.definition}
                </p>
              ) : null}
            </div>
          </header>

          <section
            aria-label="CPE sections"
            className="grid gap-3"
            role="region"
          >
            <h2 className="text-[18px] font-bold text-fp-ink">CPE</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <CpePanel title="Conception">{card.conception}</CpePanel>
              <CpePanel title="Planning">{card.planning}</CpePanel>
              <CpePanel title="Execution">{card.execution}</CpePanel>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <StandardPanel title="Minimum standard">
              {card.minimumStandard}
            </StandardPanel>
            <StandardPanel title="Household standard">
              {card.householdStandard}
            </StandardPanel>
          </section>

          {card.notes ? (
            <section className="grid gap-2 rounded border border-fp-line bg-fp-surface p-4">
              <h2 className="text-[16px] font-bold text-fp-ink">Notes</h2>
              <p className="text-[14px] leading-6 text-fp-muted-ink">{card.notes}</p>
            </section>
          ) : null}

          <section className="grid gap-3">
            <h2 className="text-[18px] font-bold text-fp-ink">Move card</h2>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {RESPONSIBILITY_BOARD_LANES.map((lane) => (
                <Button
                  aria-describedby={!onMove ? unavailableMessageId : undefined}
                  className="justify-between"
                  disabled={!onMove || lane === card.boardLane}
                  key={lane}
                  onClick={() => onMove?.(lane)}
                >
                  Move to {laneLabels[lane]}
                  <MoveRight aria-hidden="true" size={16} />
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 grid gap-2 border-t border-fp-line bg-white/95 p-3 shadow-[0_-10px_30px_rgba(31,41,55,0.08)] backdrop-blur sm:grid-cols-3 lg:static lg:flex lg:shadow-none">
        {!onFlagForRadar || !onMove || !onScheduleCheckIn || !onTrim ? (
          <p
            className="text-[13px] font-semibold text-fp-muted-ink sm:col-span-3 lg:flex-1"
            id={unavailableMessageId}
          >
            {unavailableMessage}
          </p>
        ) : null}
        <Button
          aria-describedby={!onFlagForRadar ? unavailableMessageId : undefined}
          disabled={!onFlagForRadar}
          onClick={onFlagForRadar}
          variant="primary"
        >
          <Flag aria-hidden="true" size={16} />
          Flag for radar
        </Button>
        <Button
          aria-describedby={!onScheduleCheckIn ? unavailableMessageId : undefined}
          disabled={!onScheduleCheckIn}
          onClick={onScheduleCheckIn}
        >
          <CalendarClock aria-hidden="true" size={16} />
          Schedule check-in
        </Button>
        <Button
          aria-describedby={!onTrim ? unavailableMessageId : undefined}
          disabled={!onTrim}
          onClick={onTrim}
        >
          <Scissors aria-hidden="true" size={16} />
          Trim
        </Button>
      </div>
    </Sheet>
  );
}

function CpePanel({
  children,
  title
}: {
  children?: string | null;
  title: string;
}) {
  return (
    <article className="grid min-h-[172px] content-start gap-2 rounded border border-fp-line bg-white p-4">
      <h3 className="text-[14px] font-bold text-fp-ink">{title}</h3>
      <p className="text-[14px] leading-6 text-fp-muted-ink">
        {children || "No source guidance has been added yet."}
      </p>
    </article>
  );
}

function StandardPanel({
  children,
  title
}: {
  children?: string | null;
  title: string;
}) {
  return (
    <article className="grid min-h-[140px] content-start gap-2 rounded border border-fp-line bg-white p-4">
      <h2 className="text-[16px] font-bold text-fp-ink">{title}</h2>
      <p className="text-[14px] leading-6 text-fp-muted-ink">
        {children || "No standard has been written yet."}
      </p>
    </article>
  );
}
