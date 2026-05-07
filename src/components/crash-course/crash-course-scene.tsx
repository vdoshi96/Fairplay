/* eslint-disable @next/next/no-img-element */
import type { CrashCourseSceneKey } from "./crash-course-content";

type CrashCourseSceneProps = {
  scene: CrashCourseSceneKey;
  className?: string;
};

type SceneDetail = {
  composition: string;
  label: string;
  src: string;
};

const SCENE_DETAILS: Record<CrashCourseSceneKey, SceneDetail> = {
  "not-chore": {
    composition: "hidden-load-home",
    label: "Household load learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/not-chore.png"
  },
  "owner-helper": {
    composition: "owner-helper-grocery-handoff",
    label: "Owner and helper learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/owner-helper.png"
  },
  "cpe-path": {
    composition: "cpe-path-garden-map",
    label: "Conception planning execution learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/cpe-path.png"
  },
  "standards-note": {
    composition: "standards-note-workbench",
    label: "Minimum standards learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/standards-note.png"
  },
  "board-lanes": {
    composition: "board-lanes-room",
    label: "Board lanes learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/board-lanes.png"
  },
  "active-deck": {
    composition: "active-deck-sorting-table",
    label: "Active deck learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/active-deck.png"
  },
  handoff: {
    composition: "handoff-context-bridge",
    label: "Handoff learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/handoff.png"
  },
  "dynamic-fair": {
    composition: "dynamic-fair-capacity-scales",
    label: "Dynamic fairness learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/dynamic-fair.png"
  },
  repair: {
    composition: "repair-dialogue-corner",
    label: "Repair learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/repair.png"
  }
};

export function CrashCourseScene({ scene, className = "" }: CrashCourseSceneProps) {
  const detail = SCENE_DETAILS[scene];

  return (
    <div
      aria-label={detail.label}
      className={[
        "relative h-full min-h-[560px] w-full overflow-hidden bg-[#edf4ee]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-scene-composition={detail.composition}
      data-scene-scale="immersive-background"
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-full min-h-[560px] w-full object-cover"
        data-testid="crash-course-scene-image"
        draggable={false}
        height={1024}
        loading="eager"
        src={detail.src}
        width={1536}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(237,244,238,0.22),rgba(237,244,238,0.02)_42%,rgba(237,244,238,0.2))]" />
    </div>
  );
}
