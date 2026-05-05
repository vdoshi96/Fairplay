import type { CrashCourseSceneKey } from "./crash-course-content";

type CrashCourseSceneProps = {
  scene: CrashCourseSceneKey;
  className?: string;
};

type SceneDetail = {
  label: string;
  sign: string;
  motif: "home" | "path" | "note" | "lanes" | "deck" | "handoff" | "radar";
};

const SCENE_DETAILS: Record<CrashCourseSceneKey, SceneDetail> = {
  "not-chore": {
    label: "Household load learning scene",
    sign: "Visible and hidden work",
    motif: "home"
  },
  "owner-helper": {
    label: "Owner and helper learning scene",
    sign: "Owner holds the outcome",
    motif: "home"
  },
  "cpe-path": {
    label: "Conception planning execution learning scene",
    sign: "Responsibility path",
    motif: "path"
  },
  "standards-note": {
    label: "Minimum standards learning scene",
    sign: "Done well enough",
    motif: "note"
  },
  "board-lanes": {
    label: "Board lanes learning scene",
    sign: "Cards have a place",
    motif: "lanes"
  },
  "active-deck": {
    label: "Active deck learning scene",
    sign: "Keep what matters now",
    motif: "deck"
  },
  handoff: {
    label: "Handoff learning scene",
    sign: "Context travels too",
    motif: "handoff"
  },
  "radar-check-in": {
    label: "Radar and check-ins learning scene",
    sign: "Notice, decide, review",
    motif: "radar"
  },
  "dynamic-fair": {
    label: "Dynamic fairness learning scene",
    sign: "Capacity changes",
    motif: "path"
  },
  repair: {
    label: "Repair learning scene",
    sign: "Pause and repair",
    motif: "note"
  }
};

function StageLabels() {
  return (
    <g>
      {["Conception", "Planning", "Execution"].map((stage, index) => {
        const x = 82 + index * 104;
        return (
          <g key={stage}>
            {index > 0 ? (
              <path
                d={`M${x - 58} 129 C${x - 36} 118 ${x - 28} 118 ${x - 16} 129`}
                fill="none"
                stroke="#506fa8"
                strokeLinecap="round"
                strokeWidth="5"
              />
            ) : null}
            <circle cx={x} cy="129" fill="#ffffff" r="30" stroke="#506fa8" strokeWidth="3" />
            <text
              fill="#202124"
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
              x={x}
              y="134"
            >
              {stage}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SceneMotif({ detail }: { detail: SceneDetail }) {
  if (detail.motif === "path") {
    return <StageLabels />;
  }

  if (detail.motif === "lanes") {
    return (
      <g>
        {["Reserve", "Concern", "Alex", "Max"].map((lane, index) => (
          <g key={lane}>
            <rect
              fill={index % 2 === 0 ? "#f7f3ec" : "#ffffff"}
              height="54"
              rx="7"
              stroke="#202124"
              strokeOpacity="0.12"
              width="58"
              x={52 + index * 70}
              y="111"
            />
            <text fill="#3b3d42" fontSize="10" fontWeight="700" textAnchor="middle" x={81 + index * 70} y="142">
              {lane}
            </text>
          </g>
        ))}
      </g>
    );
  }

  if (detail.motif === "deck") {
    return (
      <g>
        {[0, 1, 2].map((card) => (
          <rect
            fill={card === 0 ? "#ffffff" : card === 1 ? "#f7f3ec" : "#eef5f1"}
            height="56"
            key={card}
            rx="8"
            stroke="#202124"
            strokeOpacity="0.14"
            transform={`rotate(${card * 7 - 7} ${162 + card * 24} 135)`}
            width="76"
            x={124 + card * 24}
            y={104 - card * 2}
          />
        ))}
      </g>
    );
  }

  if (detail.motif === "handoff") {
    return (
      <g>
        <path d="M105 134 H255" fill="none" stroke="#506fa8" strokeLinecap="round" strokeWidth="6" />
        <path d="M239 118 L258 134 L239 150" fill="none" stroke="#506fa8" strokeLinecap="round" strokeWidth="6" />
        <rect fill="#ffffff" height="54" rx="8" stroke="#202124" strokeOpacity="0.14" width="84" x="136" y="95" />
        <text fill="#202124" fontSize="12" fontWeight="700" textAnchor="middle" x="178" y="127">
          Context
        </text>
      </g>
    );
  }

  if (detail.motif === "radar") {
    return (
      <g>
        <circle cx="180" cy="129" fill="#ffffff" r="55" stroke="#8c6ab4" strokeOpacity="0.35" strokeWidth="3" />
        <circle cx="180" cy="129" fill="#8c6ab4" opacity="0.14" r="34" />
        <path d="M180 129 L221 98" stroke="#8c6ab4" strokeLinecap="round" strokeWidth="5" />
        <circle cx="180" cy="129" fill="#8c6ab4" r="6" />
      </g>
    );
  }

  if (detail.motif === "note") {
    return (
      <g>
        <rect fill="#ffffff" height="74" rx="9" stroke="#202124" strokeOpacity="0.14" width="122" x="119" y="91" />
        <path d="M140 113 H218 M140 133 H204 M140 153 H190" stroke="#47746c" strokeLinecap="round" strokeWidth="5" />
      </g>
    );
  }

  return (
    <g>
      <path d="M122 127 L180 82 L238 127 V171 H122 Z" fill="#ffffff" stroke="#202124" strokeOpacity="0.14" strokeWidth="3" />
      <path d="M112 127 L180 75 L248 127" fill="none" stroke="#47746c" strokeLinecap="round" strokeWidth="7" />
      <rect fill="#f7f3ec" height="38" rx="6" width="36" x="162" y="132" />
    </g>
  );
}

function Person({
  color,
  testId,
  x,
  y
}: {
  color: string;
  testId: string;
  x: number;
  y: number;
}) {
  return (
    <g data-testid={testId} transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-34" fill="#f4c7a1" r="16" stroke="#202124" strokeOpacity="0.12" strokeWidth="2" />
      <path d="M-19 24 C-17 -2 -10 -18 0 -18 C10 -18 17 -2 19 24 Z" fill={color} />
      <path d="M-26 -2 C-16 9 -8 12 0 12 C8 12 16 9 26 -2" fill="none" stroke="#202124" strokeLinecap="round" strokeOpacity="0.45" strokeWidth="4" />
      <circle cx="-5" cy="-37" fill="#202124" r="1.8" />
      <circle cx="5" cy="-37" fill="#202124" r="1.8" />
      <path d="M-5 -29 C-2 -26 2 -26 5 -29" fill="none" stroke="#202124" strokeLinecap="round" strokeWidth="2" />
    </g>
  );
}

export function CrashCourseScene({ scene, className = "" }: CrashCourseSceneProps) {
  const detail = SCENE_DETAILS[scene];

  return (
    <div
      aria-label={detail.label}
      className={`overflow-hidden rounded-[8px] border border-fp-line bg-fp-soft ${className}`}
      role="img"
    >
      <svg className="h-full min-h-[210px] w-full" viewBox="0 0 360 240">
        <rect fill="#f7f3ec" height="240" width="360" />
        <circle cx="52" cy="48" fill="#c26f59" opacity="0.2" r="22" />
        <path d="M20 185 C65 157 104 181 138 162 C178 139 207 165 250 148 C292 132 316 149 340 131 V240 H20 Z" fill="#dfeadd" />
        <path d="M0 196 C68 181 101 203 154 186 C216 166 270 196 360 176 V240 H0 Z" fill="#eef5f1" />
        <SceneMotif detail={detail} />
        <rect fill="#ffffff" height="30" rx="15" stroke="#202124" strokeOpacity="0.1" width="176" x="92" y="22" />
        <text fill="#202124" fontSize="13" fontWeight="700" textAnchor="middle" x="180" y="42">
          {detail.sign}
        </text>
        <Person color="#2f7d6e" testId="scene-alex" x={77} y={202} />
        <Person color="#506fa8" testId="scene-max" x={283} y={202} />
        <g data-testid="scene-helper" transform="translate(180 204)">
          <circle cx="0" cy="-31" fill="#f6d8b7" r="13" stroke="#202124" strokeOpacity="0.12" strokeWidth="2" />
          <path d="M-16 20 C-15 -2 -8 -15 0 -15 C8 -15 15 -2 16 20 Z" fill="#9b6d35" />
          <path d="M-20 -2 C-10 7 10 7 20 -2" fill="none" stroke="#202124" strokeLinecap="round" strokeOpacity="0.45" strokeWidth="4" />
          <circle cx="-4" cy="-33" fill="#202124" r="1.5" />
          <circle cx="4" cy="-33" fill="#202124" r="1.5" />
          <path d="M-4 -26 C-1 -24 1 -24 4 -26" fill="none" stroke="#202124" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
