export const GENERATED_UI_ASSET_OUTPUT_DIR =
  "public/assets/fairplay/generated-ui";
export const GENERATED_UI_QWEN_MODEL = "qwen-image-2.0-pro";

export type GeneratedUiAssetSpec = {
  alt: string;
  composition: string;
  promptSubject: string;
  ratio: string;
  size: `${number}*${number}`;
  slug: string;
  outputPath: `${typeof GENERATED_UI_ASSET_OUTPUT_DIR}/${string}.png`;
};

export const generatedUiAssetNegativePrompt = [
  "readable text",
  "pseudo-writing",
  "letters",
  "numbers",
  "logo",
  "watermark",
  "brand mark",
  "copied public app style",
  "copied book art",
  "Fair Play source art",
  "Better Share style",
  "Trello board",
  "workbook layout",
  "worksheet",
  "printable card",
  "playing card",
  "card deck",
  "source deck style",
  "photorealistic",
  "3D render",
  "real-person likeness",
  "celebrity",
  "gender stereotype",
  "chore stereotype",
  "blame",
  "shame",
  "anger",
  "crying",
  "confrontation",
  "therapy scene",
  "clinical diagnosis"
].join(", ");

export function buildGeneratedUiAssetPrompt(input: {
  alt: string;
  composition: string;
  promptSubject: string;
  ratio: string;
}) {
  return [
    "Original Fairplay app illustration.",
    "Style: cute flat 2D cartoon, warm adult product polish, rounded geometric forms, soft paper texture, crisp silhouettes, no 3D, no photorealism.",
    "Palette: warm off-white base with balanced teal, blue, coral, golden yellow, fresh green, and dark ink accents. Avoid one-note beige, slate, purple, brown, or orange themes.",
    `Canvas: ${input.ratio} composition, mobile-readable, generous breathing room, no border, no title area.`,
    `Subject: ${input.promptSubject}.`,
    `Composition: ${input.composition}.`,
    `Accessibility intent: ${input.alt}.`,
    "Safety/IP: original app artwork only; no public deck, workbook, card-game, source-art, brand, or public-figure resemblance.",
    "Final image must contain no readable text, no pseudo-writing, no logos, no watermark, no branded interface, and no people doing stereotyped chores."
  ].join("\n");
}

const crashCourseSceneSpecs = [
  {
    alt: "Hidden household load background",
    composition:
      "a cozy room with visible household objects in front and subtle memory loops, calendar shapes, route paths, care signals, and organizing containers behind them",
    promptSubject:
      "invisible household work becoming visible through calm abstract planning paths",
    slug: "crash-course-not-chore"
  },
  {
    alt: "Owner and helper background",
    composition:
      "two abstract sidekick characters with a shared grocery basket, one holding a blank responsibility tile and one carrying neutral support objects",
    promptSubject:
      "balanced owner and helper roles working around one shared household outcome",
    slug: "crash-course-owner-helper"
  },
  {
    alt: "Conception planning execution path background",
    composition:
      "three connected islands with a lightbulb object, a simple route map, and a finished household basket joined by one soft path",
    promptSubject:
      "a full responsibility path from noticing to planning to completion",
    slug: "crash-course-cpe-path"
  },
  {
    alt: "Minimum standards note background",
    composition:
      "a blank note, measuring ribbon, small household bowl, and two balanced color dots agreeing on the same finish line",
    promptSubject:
      "shared minimum standards as a clear kind agreement",
    slug: "crash-course-standards-note"
  },
  {
    alt: "Board lanes background",
    composition:
      "soft abstract responsibility lanes made from rounded panels, colored dots, and gentle arrows, not a copied kanban board",
    promptSubject:
      "household responsibilities moving through clear visible states",
    slug: "crash-course-board-lanes"
  },
  {
    alt: "Active deck background",
    composition:
      "two small piles of blank rounded tiles, one glowing active path and one paused path, with a helper spark keeping the system calm",
    promptSubject:
      "choosing which responsibilities are active without card-deck mimicry",
    slug: "crash-course-active-deck"
  },
  {
    alt: "Handoff background",
    composition:
      "two abstract sidekick characters on either side of a soft bridge path, passing a blank rounded responsibility tile with context dots",
    promptSubject: "a calm household handoff with context traveling alongside the task",
    slug: "crash-course-handoff"
  },
  {
    alt: "Radar check-in background",
    composition:
      "quiet radar rings, topic bubbles, a check-in table shape, and two balanced persona dots moving toward a shared decision path",
    promptSubject:
      "noticing household signals before they become stressful",
    slug: "crash-course-radar-check-in"
  },
  {
    alt: "Dynamic fairness background",
    composition:
      "a balanced scale, soft capacity meter, rest symbol, and shared support path with no scores or blame",
    promptSubject:
      "fairness adapting to capacity and context over time",
    slug: "crash-course-dynamic-fair"
  },
  {
    alt: "Repair background",
    composition:
      "two blank speech bubbles, a gentle repair note shape, a bridge, and warm light returning to a shared path",
    promptSubject:
      "kind repair after a household agreement misses the mark",
    slug: "crash-course-repair"
  }
] as const;

const professionalPageBackgroundSpecs = [
  {
    alt: "Warm Fairplay threshold background",
    composition:
      "a softly lit entry table with a tiny home, paired avatar dots, blank tiles, plant shapes, orbit paths, and a gentle open doorway glow",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/auth-warm-threshold.png`,
    promptSubject:
      "welcoming household app sign-in backdrop with professional product warmth",
    ratio: "4:3",
    size: "1536*1152",
    slug: "auth-warm-threshold-background"
  },
  {
    alt: "Household planning canvas background",
    composition:
      "an airy abstract workspace with faint room contours, calm planning paths, soft tile clusters, balanced persona color dots, and layered paper texture",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/app-shell-household-canvas.png`,
    promptSubject:
      "subtle full-app canvas for a polished household operations website",
    ratio: "3:2",
    size: "1536*1024",
    slug: "app-shell-household-canvas"
  },
  {
    alt: "Learning studio home background",
    composition:
      "a friendly learning studio with abstract lesson shelves, route cards without text, small milestone objects, helper spark, and a calm work table",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/home-learning-studio.png`,
    promptSubject:
      "professional website hero art for learning a household planning product",
    ratio: "3:2",
    size: "1536*1024",
    slug: "home-learning-studio-background"
  },
  {
    alt: "Household rhythm onboarding path background",
    composition:
      "a warm path through four simple household stations, paired persona dots, helper spark, blank setup tiles, and soft waypoint shapes",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/onboarding-rhythm-path.png`,
    promptSubject:
      "first setup journey backdrop for a household responsibility app",
    ratio: "3:2",
    size: "1536*1024",
    slug: "onboarding-rhythm-path-background"
  },
  {
    alt: "Responsibility load map workbench background",
    composition:
      "a clean operations workbench with abstract lane zones, movable blank responsibility tiles, owner dots, signal chips, and measuring paths",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/load-map-workbench.png`,
    promptSubject:
      "professional dashboard background for mapping household responsibility load",
    ratio: "3:2",
    size: "1536*1024",
    slug: "load-map-workbench-background"
  },
  {
    alt: "Responsibility library shelf background",
    composition:
      "a tidy illustrated shelf with blank rounded cards, search lens shape, small containers, warm labels as abstract color blocks, and helper spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/library-shelf.png`,
    promptSubject:
      "premium product background for browsing a responsibility card library",
    ratio: "3:2",
    size: "1536*1024",
    slug: "library-shelf-background"
  },
  {
    alt: "Radar signal room background",
    composition:
      "a calm signal room with soft radar rings, topic bubbles, abstract trays made only of blank color blocks, a shared decision path, and paired persona dots; no paper notes, no clipped documents, no writing marks",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/radar-signal-room.png`,
    promptSubject:
      "professional website background for capturing household concern signals",
    ratio: "3:2",
    size: "1536*1024",
    slug: "radar-signal-room-background"
  },
  {
    alt: "Check-in table background",
    composition:
      "a quiet meeting table with blank agenda tiles, decision loop, shared calendar shape, two balanced color dots, and a completion spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/check-in-table.png`,
    promptSubject:
      "polished app background for a guided household check-in workflow",
    ratio: "3:2",
    size: "1536*1024",
    slug: "check-in-table-background"
  },
  {
    alt: "Settings preferences studio background",
    composition:
      "a tidy preference studio with blank control toggles, persona dots, soft theme swatches, small house mark, and calm setup path",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/backgrounds/settings-preferences.png`,
    promptSubject:
      "professional settings page background for household app preferences",
    ratio: "3:2",
    size: "1536*1024",
    slug: "settings-preferences-background"
  }
] as const;

export const GENERATED_UI_ASSETS: GeneratedUiAssetSpec[] = [
  {
    alt: "Fairplay household garden login scene",
    composition:
      "two abstract rounded sidekick characters near a tiny home, plants, soft clouds, blank planning tiles, and a helper spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/login-household-garden.png`,
    promptSubject: "a warm home-and-garden first impression for a household planning app",
    ratio: "4:3",
    size: "1536*1152",
    slug: "login-household-garden"
  },
  {
    alt: "Alex avatar",
    composition:
      "bust crop on a light circular background with simple geometric face and tiny square glasses",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/alex-avatar.png`,
    promptSubject: "rounded teal mint abstract sidekick avatar with calm curious expression",
    ratio: "1:1",
    size: "768*768",
    slug: "alex-avatar"
  },
  {
    alt: "Max avatar",
    composition:
      "bust crop on a light circular background with simple geometric face and coral scarf notch",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/max-avatar.png`,
    promptSubject:
      "rounded blue periwinkle abstract sidekick avatar with attentive practical expression",
    ratio: "1:1",
    size: "768*768",
    slug: "max-avatar"
  },
  {
    alt: "Household helper mascot",
    composition:
      "small rounded house-orbit sprite with friendly simple face, two tiny floating hands, and one golden spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/helper-mascot.png`,
    promptSubject: "neutral household helper mascot for a planning app",
    ratio: "1:1",
    size: "768*768",
    slug: "helper-mascot"
  },
  {
    alt: "Fairplay household orbit mark",
    composition:
      "simple app mark with a tiny home dot, orbit path, balanced color nodes, and generous maskable-safe padding",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/fairplay-mark.png`,
    promptSubject: "friendly household orbit app mark",
    ratio: "1:1",
    size: "768*768",
    slug: "fairplay-mark"
  },
  {
    alt: "Shared radar illustration",
    composition:
      "calm circular pulse rings, two balanced persona dots, helper spark near the edge, and topic bubbles drifting toward a quiet decision path",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/radar-illustration.png`,
    promptSubject: "low-stress shared attention radar for household planning",
    ratio: "3:2",
    size: "1536*1024",
    slug: "radar-illustration"
  },
  {
    alt: "Check-in spark",
    composition:
      "small completed review loop with restrained geometric confetti, two balanced dots, and a helper spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/check-in-spark.png`,
    promptSubject: "calm check-in completion spark",
    ratio: "8:5",
    size: "1024*640",
    slug: "check-in-spark"
  },
  {
    alt: "AI task helper sidekick",
    composition:
      "small formal assistant sidekick with dark rounded hair shape, tiny suit jacket, clipboard, and a helpful spark, stylized and original",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/ai-task-helper.png`,
    promptSubject:
      "cute original task-manager sidekick for a household AI draft tool",
    ratio: "1:1",
    size: "768*768",
    slug: "ai-task-helper"
  },
  {
    alt: "Greg Taskmaster avatar",
    composition:
      "stern original task judge avatar seated on a grand dark throne, wearing rectangular glasses, a black suit, darker black shirt, and holding a task card",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/greg-taskmaster-avatar.png`,
    promptSubject:
      "original comedic task judge avatar for the Library AI capture control",
    ratio: "1:1",
    size: "1254*1254",
    slug: "greg-taskmaster-avatar"
  },
  {
    alt: "Crash course completion celebration",
    composition:
      "two abstract sidekick avatars, a helper spark, soft ribbon arcs, blank milestone tiles, and restrained celebration shapes",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/crash-course/completion-celebration.png`,
    promptSubject:
      "warm completion splash for finishing a Fairplay crash course",
    ratio: "1:1",
    size: "768*768",
    slug: "crash-course-completion-celebration"
  },
  ...crashCourseSceneSpecs.map((scene) => ({
    ...scene,
    outputPath:
      `${GENERATED_UI_ASSET_OUTPUT_DIR}/crash-course/${scene.slug.replace("crash-course-", "")}.png` as const,
    ratio: "3:2",
    size: "1536*1024" as const
  })),
  ...professionalPageBackgroundSpecs,
  {
    alt: "Load Map guide thumbnail",
    composition:
      "soft lane-like zones made from abstract rounded panels, two balanced persona dots, shared orbit path, and a helper spark",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/feature-guide/load-map.png`,
    promptSubject: "household load map helper thumbnail",
    ratio: "4:3",
    size: "1024*768",
    slug: "feature-guide-load-map"
  },
  {
    alt: "Library guide thumbnail",
    composition:
      "tidy shelf of abstract rounded tiles and containers, search magnifier shape, helper spark, and balanced color-coded dots",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/feature-guide/library.png`,
    promptSubject: "household responsibility library browsing helper thumbnail",
    ratio: "4:3",
    size: "1024*768",
    slug: "feature-guide-library"
  },
  {
    alt: "Radar guide thumbnail",
    composition:
      "calm circular pulse rings, topic bubbles, two balanced persona dots, and a quiet decision path",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/feature-guide/radar.png`,
    promptSubject: "shared attention radar helper thumbnail",
    ratio: "4:3",
    size: "1024*768",
    slug: "feature-guide-radar"
  },
  {
    alt: "Check-ins guide thumbnail",
    composition:
      "small table shape with two balanced avatar dots, blank decision loop, helper spark, and calm completion path",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/feature-guide/check-ins.png`,
    promptSubject: "household check-in helper thumbnail",
    ratio: "4:3",
    size: "1024*768",
    slug: "feature-guide-check-ins"
  },
  {
    alt: "Settings guide thumbnail",
    composition:
      "friendly controls panel with blank toggles, color dots, helper spark, and tidy preference path",
    outputPath: `${GENERATED_UI_ASSET_OUTPUT_DIR}/feature-guide/settings.png`,
    promptSubject: "household settings helper thumbnail",
    ratio: "4:3",
    size: "1024*768",
    slug: "feature-guide-settings"
  }
];
