import type { CrashCourseSceneKey } from "./crash-course-content";

type CrashCourseSceneProps = {
  scene: CrashCourseSceneKey;
  className?: string;
};

type SceneDetail = {
  label: string;
  sign: string;
  composition: string;
  accent: string;
  softAccent: string;
  ground: string;
};

const SCENE_DETAILS: Record<CrashCourseSceneKey, SceneDetail> = {
  "not-chore": {
    label: "Household load learning scene",
    sign: "Visible work is only part of the load",
    composition: "hidden-load-home",
    accent: "#2f7d6e",
    softAccent: "#cfe3dc",
    ground: "#dfeadd"
  },
  "owner-helper": {
    label: "Owner and helper learning scene",
    sign: "The owner holds the outcome",
    composition: "owner-helper-grocery-handoff",
    accent: "#506fa8",
    softAccent: "#d8e1f2",
    ground: "#e5eadc"
  },
  "cpe-path": {
    label: "Conception planning execution learning scene",
    sign: "Follow the whole responsibility path",
    composition: "cpe-path-garden-map",
    accent: "#47746c",
    softAccent: "#d6e7e0",
    ground: "#e8ddcf"
  },
  "standards-note": {
    label: "Minimum standards learning scene",
    sign: "Agree on done well enough",
    composition: "standards-note-workbench",
    accent: "#9b6d35",
    softAccent: "#eadcc7",
    ground: "#d9e8df"
  },
  "board-lanes": {
    label: "Board lanes learning scene",
    sign: "Cards belong in a clear state",
    composition: "board-lanes-room",
    accent: "#8c6ab4",
    softAccent: "#e5dff0",
    ground: "#dce6ed"
  },
  "active-deck": {
    label: "Active deck learning scene",
    sign: "Keep what matters now",
    composition: "active-deck-sorting-table",
    accent: "#c26f59",
    softAccent: "#f0d6cd",
    ground: "#dceadb"
  },
  handoff: {
    label: "Handoff learning scene",
    sign: "Context travels with ownership",
    composition: "handoff-context-bridge",
    accent: "#506fa8",
    softAccent: "#d8e1f2",
    ground: "#e5dece"
  },
  "radar-check-in": {
    label: "Radar and check-ins learning scene",
    sign: "Notice, decide, review",
    composition: "radar-check-in-signal-room",
    accent: "#8c6ab4",
    softAccent: "#e5dff0",
    ground: "#dbe8e8"
  },
  "dynamic-fair": {
    label: "Dynamic fairness learning scene",
    sign: "Capacity changes the load",
    composition: "dynamic-fair-capacity-scales",
    accent: "#47746c",
    softAccent: "#d6e7e0",
    ground: "#e8dccf"
  },
  repair: {
    label: "Repair learning scene",
    sign: "Pause, clarify, repair",
    composition: "repair-dialogue-corner",
    accent: "#c26f59",
    softAccent: "#f0d6cd",
    ground: "#dfe7ee"
  }
};

type PersonPose = "open" | "carry" | "point" | "write" | "rest" | "reach";

function SceneBackdrop({ detail }: { detail: SceneDetail }) {
  return (
    <g>
      <rect fill="#edf4ee" height="640" width="960" />
      <circle cx="112" cy="92" fill={detail.accent} opacity="0.18" r="58" />
      <path
        d="M0 365 C120 300 220 362 318 312 C438 250 522 332 646 286 C770 240 842 282 960 226 V640 H0 Z"
        fill={detail.softAccent}
      />
      <path
        d="M0 430 C146 386 244 454 378 405 C530 350 640 436 790 386 C858 363 914 366 960 344 V640 H0 Z"
        fill={detail.ground}
      />
      <path d="M0 540 C210 500 350 558 520 520 C690 480 796 524 960 488 V640 H0 Z" fill="#f7f3ec" />
    </g>
  );
}

function SceneSign({ detail }: { detail: SceneDetail }) {
  return (
    <g data-testid="scene-sign" transform="translate(480 86)">
      <rect
        fill="#ffffff"
        height="58"
        rx="29"
        stroke="#202124"
        strokeOpacity="0.12"
        strokeWidth="3"
        width="430"
        x="-215"
        y="-29"
      />
      <text
        fill="#202124"
        fontSize="24"
        fontWeight="800"
        textAnchor="middle"
        x="0"
        y="9"
      >
        {detail.sign}
      </text>
    </g>
  );
}

function armPathForPose(pose: PersonPose) {
  if (pose === "carry") {
    return "M-44 -2 L-23 30 M24 24 L47 35";
  }

  if (pose === "point") {
    return "M-42 0 C-24 16 -8 18 8 7 M20 1 L56 -24";
  }

  if (pose === "write") {
    return "M-39 4 C-24 22 -11 26 4 17 M17 10 L40 25";
  }

  if (pose === "rest") {
    return "M-38 6 C-18 20 18 20 38 6";
  }

  if (pose === "reach") {
    return "M-48 8 L-22 -18 M18 4 L48 -8";
  }

  return "M-48 2 C-28 25 28 25 48 2";
}

function Person({
  hair = "#3b2d29",
  pose = "open",
  scale = 1,
  shirt,
  skin = "#f4c7a1",
  testId,
  x,
  y
}: {
  hair?: string;
  pose?: PersonPose;
  scale?: number;
  shirt: string;
  skin?: string;
  testId?: string;
  x: number;
  y: number;
}) {
  return (
    <g data-testid={testId} transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-33 -88 C-27 -114 27 -114 33 -88 V-65 H-33 Z" fill={hair} />
      <circle cx="0" cy="-80" fill={skin} r="31" stroke="#202124" strokeOpacity="0.12" strokeWidth="4" />
      <path
        d="M-43 54 C-39 -5 -23 -47 0 -47 C23 -47 39 -5 43 54 Z"
        fill={shirt}
        stroke="#202124"
        strokeOpacity="0.1"
        strokeWidth="3"
      />
      <path
        d={armPathForPose(pose)}
        fill="none"
        stroke="#202124"
        strokeLinecap="round"
        strokeOpacity="0.48"
        strokeWidth="10"
      />
      <circle cx="-10" cy="-85" fill="#202124" r="3" />
      <circle cx="10" cy="-85" fill="#202124" r="3" />
      <path d="M-10 -71 C-4 -66 4 -66 10 -71" fill="none" stroke="#202124" strokeLinecap="round" strokeWidth="4" />
    </g>
  );
}

function Card({
  fill = "#ffffff",
  height = 78,
  rotate = 0,
  testId,
  width = 120,
  x,
  y
}: {
  fill?: string;
  height?: number;
  rotate?: number;
  testId?: string;
  width?: number;
  x: number;
  y: number;
}) {
  return (
    <rect
      data-testid={testId}
      fill={fill}
      height={height}
      rx="12"
      stroke="#202124"
      strokeOpacity="0.14"
      strokeWidth="3"
      transform={`rotate(${rotate} ${x + width / 2} ${y + height / 2})`}
      width={width}
      x={x}
      y={y}
    />
  );
}

function StageLabels() {
  return (
    <g>
      {["Conception", "Planning", "Execution"].map((stage, index) => {
        const x = 250 + index * 230;

        return (
          <g key={stage}>
            {index > 0 ? (
              <path
                d={`M${x - 164} 330 C${x - 100} 280 ${x - 68} 280 ${x - 28} 330`}
                fill="none"
                stroke="#506fa8"
                strokeLinecap="round"
                strokeWidth="14"
              />
            ) : null}
            <circle cx={x} cy="330" fill="#ffffff" r="72" stroke="#506fa8" strokeWidth="7" />
            <text
              fill="#202124"
              fontSize="24"
              fontWeight="800"
              textAnchor="middle"
              x={x}
              y="339"
            >
              {stage}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function HiddenLoadHomeScene() {
  return (
    <g>
      <path d="M158 324 L328 190 L498 324 V502 H158 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.12" strokeWidth="5" />
      <path d="M132 324 L328 174 L524 324" fill="none" stroke="#47746c" strokeLinecap="round" strokeWidth="18" />
      <rect fill="#f7f3ec" height="98" rx="14" width="92" x="282" y="404" />
      <g data-testid="visible-task-basket" transform="translate(610 398)">
        <path d="M-82 30 H82 L62 112 H-62 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.16" strokeWidth="5" />
        <path d="M-46 30 C-38 -18 38 -18 46 30" fill="none" stroke="#9b6d35" strokeLinecap="round" strokeWidth="9" />
        <circle cx="-30" cy="66" fill="#c26f59" r="18" />
        <circle cx="16" cy="60" fill="#506fa8" r="20" />
        <path d="M-42 94 H48" stroke="#47746c" strokeLinecap="round" strokeWidth="9" />
      </g>
      <g data-testid="hidden-planning-notes" transform="translate(676 206)">
        <Card fill="#fff8df" height={84} rotate={-8} width={136} x={-68} y={-42} />
        <path d="M-38 -16 H42 M-38 8 H30 M-38 32 H12" stroke="#47746c" strokeLinecap="round" strokeWidth="8" />
        <circle cx="76" cy="-54" fill="#c26f59" opacity="0.22" r="28" />
      </g>
      <Person hair="#2f241f" pose="write" scale={1.35} shirt="#2f7d6e" testId="load-owner-planner" x={260} y={505} />
      <Person hair="#4d3326" pose="carry" scale={1.08} shirt="#506fa8" testId="load-visible-doer" x={760} y={528} />
    </g>
  );
}

function OwnerHelperScene() {
  return (
    <g>
      <g data-testid="grocery-outcome-props" transform="translate(504 332)">
        <rect fill="#ffffff" height="126" rx="18" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="158" x="-79" y="-63" />
        <path d="M-44 -26 H42 M-44 4 H28 M-44 34 H48" stroke="#506fa8" strokeLinecap="round" strokeWidth="9" />
        <circle cx="85" cy="-64" fill="#c26f59" r="26" />
        <path d="M88 -92 L78 -78" stroke="#47746c" strokeLinecap="round" strokeWidth="8" />
      </g>
      <path d="M254 420 C348 356 498 358 616 420" fill="none" stroke="#d8e1f2" strokeLinecap="round" strokeWidth="42" />
      <Person hair="#2f241f" pose="point" scale={1.46} shirt="#506fa8" testId="owner-outcome-lead" x={330} y={512} />
      <g data-testid="helper-step-carry">
        <Person hair="#65422f" pose="carry" scale={1.16} shirt="#2f7d6e" x={716} y={530} />
        <path d="M672 492 H780 L760 578 H692 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" />
        <path d="M694 492 C706 446 746 446 758 492" fill="none" stroke="#9b6d35" strokeLinecap="round" strokeWidth="8" />
      </g>
      <path d="M420 312 C472 282 522 282 574 312" fill="none" stroke="#506fa8" strokeDasharray="16 16" strokeLinecap="round" strokeWidth="9" />
    </g>
  );
}

function CpePathScene() {
  return (
    <g>
      <path d="M122 504 C208 396 294 406 382 322 C500 208 624 256 800 166" fill="none" stroke="#eadcc7" strokeLinecap="round" strokeWidth="86" />
      <path d="M122 504 C208 396 294 406 382 322 C500 208 624 256 800 166" fill="none" stroke="#47746c" strokeDasharray="20 24" strokeLinecap="round" strokeWidth="11" />
      <StageLabels />
      <g data-testid="cpe-map-props" transform="translate(160 420)">
        <Card fill="#fff8df" height={96} rotate={-10} width={154} x={-77} y={-48} />
        <path d="M-43 -14 C-12 -36 10 6 43 -18 M-43 18 H35" stroke="#9b6d35" strokeLinecap="round" strokeWidth="7" />
      </g>
      <Person hair="#2d2a35" pose="reach" scale={1.04} shirt="#c26f59" testId="cpe-path-walker" x={780} y={522} />
    </g>
  );
}

function StandardsNoteScene() {
  return (
    <g>
      <rect fill="#9b6d35" height="30" opacity="0.24" rx="15" width="640" x="160" y="488" />
      <rect fill="#ffffff" height="238" rx="20" stroke="#202124" strokeOpacity="0.14" strokeWidth="6" width="326" x="330" y="216" />
      <path d="M384 280 H602 M384 334 H576 M384 388 H542" stroke="#47746c" strokeLinecap="round" strokeWidth="13" />
      <g data-testid="standards-measure-props" transform="translate(684 384)">
        <rect fill="#fff8df" height="92" rx="14" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="128" x="-64" y="-46" />
        <path d="M-32 -16 L-6 16 L38 -24" fill="none" stroke="#2f7d6e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
        <circle cx="72" cy="42" fill="#c26f59" opacity="0.24" r="30" />
      </g>
      <Person hair="#4d3326" pose="write" scale={1.22} shirt="#9b6d35" testId="standards-note-writer" x={230} y={520} />
      <Person hair="#2f241f" pose="point" scale={1.08} shirt="#506fa8" testId="standards-note-reviewer" x={748} y={532} />
    </g>
  );
}

function BoardLanesScene() {
  const lanes = ["Reserve", "Concern", "Alex", "Max"];

  return (
    <g>
      <rect fill="#ffffff" height="276" rx="24" stroke="#202124" strokeOpacity="0.14" strokeWidth="6" width="720" x="120" y="186" />
      {lanes.map((lane, index) => (
        <g data-testid={`board-lane-${lane.toLowerCase()}`} key={lane}>
          <rect
            fill={index % 2 === 0 ? "#f7f3ec" : "#eef5f1"}
            height="218"
            rx="16"
            stroke="#202124"
            strokeOpacity="0.12"
            strokeWidth="4"
            width="144"
            x={160 + index * 166}
            y="218"
          />
          <text fill="#202124" fontSize="23" fontWeight="800" textAnchor="middle" x={232 + index * 166} y="256">
            {lane}
          </text>
          <Card fill={index === 1 ? "#fff8df" : "#ffffff"} height={58} rotate={index * 2 - 3} width={94} x={185 + index * 166} y={292} />
          <Card fill={index === 2 ? "#d8e1f2" : "#ffffff"} height={58} rotate={3 - index} width={94} x={185 + index * 166} y={360} />
        </g>
      ))}
      <Person hair="#2d2a35" pose="reach" scale={0.96} shirt="#8c6ab4" testId="board-lanes-mover" x={820} y={548} />
    </g>
  );
}

function ActiveDeckScene() {
  return (
    <g>
      <ellipse cx="480" cy="490" fill="#9b6d35" opacity="0.24" rx="292" ry="46" />
      <rect fill="#ffffff" height="46" rx="23" stroke="#202124" strokeOpacity="0.12" strokeWidth="4" width="520" x="220" y="402" />
      <g data-testid="active-deck-keep-pile">
        <Card fill="#d6e7e0" rotate={-9} x={300} y={292} />
        <Card fill="#ffffff" rotate={4} x={330} y={282} />
        <Card fill="#fff8df" rotate={12} x={362} y={296} />
      </g>
      <g data-testid="active-deck-pause-pile">
        <Card fill="#f0d6cd" rotate={10} x={558} y={292} />
        <Card fill="#ffffff" rotate={-7} x={590} y={302} />
      </g>
      <path d="M282 222 H432 M566 222 H706" stroke="#c26f59" strokeLinecap="round" strokeWidth="12" />
      <Person hair="#65422f" pose="reach" scale={1.18} shirt="#c26f59" testId="active-deck-sorter" x={480} y={560} />
    </g>
  );
}

function HandoffScene() {
  return (
    <g>
      <path d="M238 394 C350 292 496 498 628 386 C674 348 712 320 770 306" fill="none" stroke="#d8e1f2" strokeLinecap="round" strokeWidth="54" />
      <path d="M266 380 C372 318 492 476 612 386 C668 344 714 318 770 306" fill="none" stroke="#506fa8" strokeLinecap="round" strokeWidth="13" />
      <path d="M736 284 L780 304 L748 340" fill="none" stroke="#506fa8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13" />
      <g data-testid="handoff-context-packet" transform="translate(480 324)">
        <rect fill="#ffffff" height="126" rx="18" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="206" x="-103" y="-63" />
        <text fill="#202124" fontSize="25" fontWeight="800" textAnchor="middle" x="0" y="-8">
          Context
        </text>
        <path d="M-54 28 H56" stroke="#47746c" strokeLinecap="round" strokeWidth="9" />
      </g>
      <Person hair="#2f241f" pose="open" scale={1.12} shirt="#47746c" testId="handoff-current-owner" x={206} y={532} />
      <Person hair="#4d3326" pose="reach" scale={1.12} shirt="#506fa8" testId="handoff-next-owner" x={790} y={532} />
    </g>
  );
}

function RadarCheckInScene() {
  return (
    <g>
      <g data-testid="radar-signal-display" transform="translate(350 332)">
        <circle cx="0" cy="0" fill="#ffffff" r="142" stroke="#8c6ab4" strokeOpacity="0.35" strokeWidth="8" />
        <circle cx="0" cy="0" fill="#8c6ab4" opacity="0.14" r="88" />
        <circle cx="0" cy="0" fill="none" r="48" stroke="#8c6ab4" strokeOpacity="0.3" strokeWidth="5" />
        <path d="M0 0 L100 -76" stroke="#8c6ab4" strokeLinecap="round" strokeWidth="12" />
        <circle cx="0" cy="0" fill="#8c6ab4" r="15" />
        <circle cx="58" cy="-38" fill="#c26f59" r="12" />
      </g>
      <g data-testid="check-in-topic-table" transform="translate(660 418)">
        <rect fill="#ffffff" height="116" rx="18" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="220" x="-110" y="-58" />
        <Card fill="#fff8df" height={52} rotate={-7} width={82} x={-84} y={-26} />
        <Card fill="#d8e1f2" height={52} rotate={8} width={82} x={2} y={-28} />
      </g>
      <Person hair="#2d2a35" pose="point" scale={1.04} shirt="#8c6ab4" testId="radar-signal-reader" x={180} y={532} />
      <Person hair="#65422f" pose="write" scale={1.02} shirt="#2f7d6e" testId="check-in-note-taker" x={770} y={544} />
    </g>
  );
}

function DynamicFairScene() {
  return (
    <g>
      <g data-testid="dynamic-fair-scales" transform="translate(480 314)">
        <path d="M0 -118 V136" stroke="#47746c" strokeLinecap="round" strokeWidth="16" />
        <path d="M-218 -76 H218" stroke="#47746c" strokeLinecap="round" strokeWidth="16" />
        <path d="M-166 -70 L-224 54 H-108 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" />
        <path d="M166 -70 L108 54 H224 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" />
        <circle cx="-166" cy="16" fill="#c26f59" opacity="0.28" r="42" />
        <rect fill="#d6e7e0" height="72" rx="14" width="88" x="122" y="-4" />
        <path d="M-58 138 H58" stroke="#47746c" strokeLinecap="round" strokeWidth="18" />
      </g>
      <g data-testid="capacity-meter" transform="translate(724 222)">
        <rect fill="#ffffff" height="144" rx="18" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="88" x="-44" y="-72" />
        <rect fill="#c26f59" height="44" rx="10" width="54" x="-27" y="10" />
        <rect fill="#2f7d6e" height="50" rx="10" width="54" x="-27" y="-48" />
      </g>
      <Person hair="#2f241f" pose="carry" scale={1.08} shirt="#47746c" testId="dynamic-fair-carrier" x={248} y={540} />
      <Person hair="#4d3326" pose="rest" scale={1.02} shirt="#9b6d35" testId="dynamic-fair-recovering" x={766} y={550} />
    </g>
  );
}

function RepairScene() {
  return (
    <g>
      <g data-testid="repair-dialogue-bubbles">
        <path d="M236 230 H410 Q438 230 438 258 V326 Q438 354 410 354 H282 L236 404 V354 H210 Q182 354 182 326 V258 Q182 230 210 230 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" />
        <path d="M550 206 H730 Q758 206 758 234 V306 Q758 334 730 334 H676 L632 382 V334 H550 Q522 334 522 306 V234 Q522 206 550 206 Z" fill="#fff8df" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" />
        <path d="M232 280 H382 M572 258 H716 M572 294 H680" stroke="#c26f59" strokeLinecap="round" strokeWidth="9" />
      </g>
      <g data-testid="repair-note" transform="translate(480 434)">
        <rect fill="#ffffff" height="96" rx="16" stroke="#202124" strokeOpacity="0.14" strokeWidth="5" width="180" x="-90" y="-48" />
        <path d="M-44 -10 L-16 18 L44 -24" fill="none" stroke="#2f7d6e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
      </g>
      <Person hair="#2d2a35" pose="open" scale={1.1} shirt="#c26f59" testId="repair-speaker" x={282} y={540} />
      <Person hair="#65422f" pose="reach" scale={1.1} shirt="#506fa8" testId="repair-listener" x={690} y={540} />
    </g>
  );
}

function SceneComposition({ scene }: { scene: CrashCourseSceneKey }) {
  if (scene === "not-chore") {
    return <HiddenLoadHomeScene />;
  }

  if (scene === "owner-helper") {
    return <OwnerHelperScene />;
  }

  if (scene === "cpe-path") {
    return <CpePathScene />;
  }

  if (scene === "standards-note") {
    return <StandardsNoteScene />;
  }

  if (scene === "board-lanes") {
    return <BoardLanesScene />;
  }

  if (scene === "active-deck") {
    return <ActiveDeckScene />;
  }

  if (scene === "handoff") {
    return <HandoffScene />;
  }

  if (scene === "radar-check-in") {
    return <RadarCheckInScene />;
  }

  if (scene === "dynamic-fair") {
    return <DynamicFairScene />;
  }

  return <RepairScene />;
}

export function CrashCourseScene({ scene, className = "" }: CrashCourseSceneProps) {
  const detail = SCENE_DETAILS[scene];

  return (
    <div
      aria-label={detail.label}
      className={`overflow-hidden bg-[#edf4ee] ${className}`}
      data-scene-composition={detail.composition}
      data-scene-scale="immersive-background"
      role="img"
    >
      <svg className="h-full min-h-[560px] w-full" viewBox="0 0 960 640">
        <SceneBackdrop detail={detail} />
        <SceneComposition scene={scene} />
        <SceneSign detail={detail} />
      </svg>
    </div>
  );
}
