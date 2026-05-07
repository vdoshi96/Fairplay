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
  "hidden-load-entry": {
    composition: "hidden-load-entryway",
    label: "Household load learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/hidden-load-entry.png"
  },
  "visible-reminder": {
    composition: "visible-reminder-counter",
    label: "Reminder and visible work storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/visible-reminder.png"
  },
  "treadmill-reset": {
    composition: "treadmill-reset-loop",
    label: "Recurring responsibility storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/treadmill-reset.png"
  },
  "active-set": {
    composition: "active-set-sorting",
    label: "Active responsibilities storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/active-set.png"
  },
  "helper-owner": {
    composition: "helper-owner-grocery-table",
    label: "Owner and helper learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/helper-owner.png"
  },
  "cpe-outcome": {
    composition: "cpe-outcome-path",
    label: "Conception planning execution learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/cpe-outcome.png"
  },
  "done-standard": {
    composition: "done-standard-note",
    label: "Done well enough storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/done-standard.png"
  },
  "standard-autonomy": {
    composition: "standard-autonomy-workbench",
    label: "Kind standard storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/standard-autonomy.png"
  },
  "handoff-context": {
    composition: "handoff-context-bridge",
    label: "Handoff learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/handoff-context.png"
  },
  "load-map": {
    composition: "load-map-room",
    label: "Load Map learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/load-map.png"
  },
  "capacity-shift": {
    composition: "capacity-shift-scale",
    label: "Capacity shift storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/capacity-shift.png"
  },
  "check-in-signal": {
    composition: "check-in-signal-table",
    label: "Check-in signal storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/check-in-signal.png"
  },
  "repair-loop": {
    composition: "repair-loop-corner",
    label: "Repair learning scene",
    src: "/assets/fairplay/generated-ui/crash-course/repair-loop.png"
  },
  "next-move": {
    composition: "next-move-path",
    label: "Next move storyboard scene",
    src: "/assets/fairplay/generated-ui/crash-course/next-move.png"
  }
};

export function CrashCourseScene({ scene, className = "" }: CrashCourseSceneProps) {
  const detail = SCENE_DETAILS[scene];

  return (
    <div
      aria-label={detail.label}
      className={[
        "relative h-full min-h-[520px] w-full overflow-hidden bg-[#edf4ee]",
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
        className="h-full min-h-[520px] w-full object-cover"
        data-testid="crash-course-scene-image"
        draggable={false}
        height={1024}
        loading="eager"
        src={detail.src}
        width={1536}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(237,244,238,0.02)_0%,rgba(237,244,238,0.14)_48%,rgba(34,41,35,0.28)_100%)]" />
    </div>
  );
}
