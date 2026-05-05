import type { FeatureGuideId } from "./guide-content";

type FeatureGuideHelperProps = {
  className?: string;
  guideId: FeatureGuideId;
};

type HelperSceneConfig = {
  frameClassName: string;
  items: string[];
  label: string;
  scene: string;
};

const helperScenes = {
  loadMap: {
    frameClassName: "bg-fp-soft",
    items: [
      "left-2 top-8 h-6 w-4 rounded bg-fp-radar",
      "left-7 top-5 h-8 w-5 rounded bg-fp-alex",
      "left-12 top-9 h-5 w-8 rounded bg-fp-shared",
      "left-3 top-3 h-1.5 w-14 rounded-full bg-fp-line",
      "right-2 bottom-2 h-3 w-3 rounded-full bg-fp-helper"
    ],
    label: "Load Map helper scene",
    scene: "lane-board"
  },
  library: {
    frameClassName: "bg-white",
    items: [
      "left-2 top-4 h-9 w-2 rounded bg-fp-alex",
      "left-5 top-6 h-7 w-2 rounded bg-fp-max",
      "left-8 top-3 h-10 w-2 rounded bg-fp-helper",
      "right-3 top-5 h-7 w-8 rounded border border-fp-line bg-fp-soft",
      "left-2 bottom-2 h-1.5 w-16 rounded-full bg-fp-line"
    ],
    label: "Library helper scene",
    scene: "card-shelf"
  },
  radar: {
    frameClassName: "bg-fp-soft",
    items: [
      "left-7 top-7 h-4 w-4 rounded-full border-2 border-fp-radar",
      "left-5 top-5 h-8 w-8 rounded-full border border-fp-radar/60",
      "left-3 top-3 h-12 w-12 rounded-full border border-fp-radar/30",
      "right-3 top-5 h-3 w-3 rounded-full bg-fp-radar",
      "left-4 bottom-3 h-2 w-8 rounded-full bg-fp-helper"
    ],
    label: "Radar helper scene",
    scene: "signal-radar"
  },
  checkIns: {
    frameClassName: "bg-white",
    items: [
      "left-4 top-8 h-6 w-12 rounded bg-fp-soft",
      "left-6 top-4 h-4 w-4 rounded-full bg-fp-alex",
      "right-5 top-4 h-4 w-4 rounded-full bg-fp-max",
      "left-8 bottom-3 h-2 w-7 rounded-full bg-fp-shared",
      "right-3 bottom-3 h-3 w-3 rounded-full bg-fp-helper"
    ],
    label: "Check-ins helper scene",
    scene: "decision-table"
  },
  settings: {
    frameClassName: "bg-fp-soft",
    items: [
      "left-3 top-4 h-9 w-12 rounded border border-fp-line bg-white",
      "left-6 top-7 h-1.5 w-6 rounded-full bg-fp-alex",
      "left-6 top-11 h-1.5 w-8 rounded-full bg-fp-max",
      "right-4 top-6 h-3 w-3 rounded-full bg-fp-helper",
      "right-5 bottom-3 h-2 w-7 rounded-full bg-fp-shared"
    ],
    label: "Settings helper scene",
    scene: "control-panel"
  }
} satisfies Record<FeatureGuideId, HelperSceneConfig>;

export function FeatureGuideHelper({
  className = "h-16 w-20 shrink-0",
  guideId
}: FeatureGuideHelperProps) {
  const scene = helperScenes[guideId];

  return (
    <div
      aria-label={scene.label}
      className={[
        "relative overflow-hidden rounded-[8px] border border-fp-line shadow-soft",
        scene.frameClassName,
        className
      ].join(" ")}
      data-helper-scene={scene.scene}
      data-testid={`feature-guide-helper-${guideId}`}
      role="img"
    >
      {scene.items.map((itemClassName) => (
        <span
          aria-hidden="true"
          className={`absolute ${itemClassName}`}
          key={itemClassName}
        />
      ))}
    </div>
  );
}
