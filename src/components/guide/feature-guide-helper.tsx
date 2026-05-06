/* eslint-disable @next/next/no-img-element */
import type { FeatureGuideId } from "./guide-content";

type FeatureGuideHelperProps = {
  className?: string;
  guideId: FeatureGuideId;
};

type HelperSceneConfig = {
  label: string;
  scene: string;
  src: string;
};

const helperScenes = {
  loadMap: {
    label: "Load Map helper scene",
    scene: "lane-board",
    src: "/assets/fairplay/generated-ui/feature-guide/load-map.png"
  },
  library: {
    label: "Library helper scene",
    scene: "card-shelf",
    src: "/assets/fairplay/generated-ui/feature-guide/library.png"
  },
  radar: {
    label: "Radar helper scene",
    scene: "signal-radar",
    src: "/assets/fairplay/generated-ui/feature-guide/radar.png"
  },
  checkIns: {
    label: "Check-ins helper scene",
    scene: "decision-table",
    src: "/assets/fairplay/generated-ui/feature-guide/check-ins.png"
  },
  settings: {
    label: "Settings helper scene",
    scene: "control-panel",
    src: "/assets/fairplay/generated-ui/feature-guide/settings.png"
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
        "relative overflow-hidden rounded-[8px] border border-fp-line bg-white shadow-soft",
        className
      ].join(" ")}
      data-helper-scene={scene.scene}
      data-testid={`feature-guide-helper-${guideId}`}
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        data-testid={`feature-guide-helper-image-${guideId}`}
        draggable={false}
        height={768}
        loading="lazy"
        src={scene.src}
        width={1024}
      />
    </div>
  );
}
