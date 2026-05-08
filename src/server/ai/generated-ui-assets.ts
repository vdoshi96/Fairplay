export const GENERATED_UI_ASSET_OUTPUT_DIR =
  "public/assets/fairplay/generated-ui";
export const GENERATED_UI_QWEN_MODEL = "qwen-image-2.0-pro";

export type GeneratedUiAssetSpec = {
  alt: string;
  composition: string;
  courseText?: string;
  promptSubject: string;
  ratio: string;
  size: `${number}*${number}`;
  slug: string;
  outputPath: `${typeof GENERATED_UI_ASSET_OUTPUT_DIR}/${string}.png`;
};

export const generatedUiAssetNegativePrompt = [
  "readable text",
  "pseudo-writing",
  "captions",
  "subtitles",
  "labels",
  "handwriting",
  "printed text",
  "text blocks",
  "word-like marks",
  "diagram labels",
  "title text",
  "UI text",
  "calendar numbers",
  "numbered labels",
  "speech bubble text",
  "signage",
  "glyphs",
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
  courseText?: string;
  promptSubject: string;
  ratio: string;
}) {
  return [
    "Original Fairplay app illustration.",
    "Style: cute flat 2D cartoon, warm adult product polish, rounded geometric forms, soft paper texture, crisp silhouettes, no 3D, no photorealism.",
    "Silent storyboard rule: this image sits next to app subtitles, so it must communicate only with objects, body language, color, arrows, blank tiles, and composition. Do not render words, letters, labels, captions, numbers, signage, handwriting, UI text, or pseudo-writing anywhere.",
    "Palette: warm off-white base with balanced teal, blue, coral, golden yellow, fresh green, and dark ink accents. Avoid one-note beige, slate, purple, brown, or orange themes.",
    `Canvas: ${input.ratio} composition, mobile-readable, generous breathing room, no border, no title area.`,
    `Subject: ${input.promptSubject}.`,
    `Composition: ${input.composition}.`,
    "Safety/IP: original app artwork only; no public deck, workbook, card-game, source-art, brand, or public-figure resemblance.",
    "Final image must contain no readable text, no pseudo-writing, no labels, no captions, no logos, no watermark, no branded interface, and no people doing stereotyped chores."
  ]
    .filter(Boolean)
    .join("\n");
}

const crashCourseSceneSpecs = [
  {
    alt: "Hidden household load storyboard background",
    composition:
      "a warm entry table with one visible form, one lunch container, soft calendar loops, tiny reminder sparks, route lines, and care objects glowing behind the obvious task",
    courseText:
      "household work includes visible work and hidden work before and after the obvious task",
    promptSubject:
      "hidden household work becoming visible through calm planning paths",
    slug: "crash-course-hidden-load-entry"
  },
  {
    alt: "Visible work and reminder storyboard background",
    composition:
      "a kitchen counter with one hand placing a blank item in a basket while another side shows calendar dots, a timing path, and a quiet consequence marker",
    courseText:
      "separate doing the final action from carrying the reminders, timing, details, and consequence",
    promptSubject:
      "the difference between visible action and cognitive reminder load",
    slug: "crash-course-visible-reminder"
  },
  {
    alt: "Recurring reset storyboard background",
    composition:
      "a gentle loop path around dishes, folded cloth, medicine timer, and lunch box shapes, contrasted with one completed project marker on a side path",
    courseText:
      "recurring work resets like a treadmill while finite projects have clearer finish lines",
    promptSubject:
      "recurring household responsibilities returning again and again",
    slug: "crash-course-treadmill-reset"
  },
  {
    alt: "Active responsibilities storyboard background",
    composition:
      "a tidy table sorting blank rounded responsibility tiles into active, paused, and later zones with a clear warm path through the active group",
    courseText:
      "fairness is clearer when only current-season responsibilities are treated as active",
    promptSubject:
      "choosing the household responsibilities that are actually active",
    slug: "crash-course-active-set"
  },
  {
    alt: "Owner and helper storyboard background",
    composition:
      "two abstract sidekick characters around a grocery table, one holding the outcome tile and route line, the other offering useful support objects",
    courseText:
      "helping is valuable, but the owner carries the outcome and follow-through",
    promptSubject:
      "balanced owner and helper roles around one shared household outcome",
    slug: "crash-course-helper-owner"
  },
  {
    alt: "Full ownership path storyboard background",
    composition:
      "three unlabeled object moments linked by one continuous responsibility path: a glowing idea lamp, a folded route map with plain colored roads only, and a completed household basket; no words on any object",
    courseText:
      "full ownership carries conception, planning, and execution from noticing to reliable completion",
    promptSubject:
      "a silent full-responsibility path from noticing to planning to completion",
    slug: "crash-course-cpe-outcome"
  },
  {
    alt: "Done well enough storyboard background",
    composition:
      "a blank note, small lunch container, timing arc, safety pin shape, flexible ribbon, and two balanced color dots agreeing on one finish line",
    courseText:
      "done well enough names what matters, what is flexible, acceptable timing, and care details",
    promptSubject:
      "a clear shared household standard before resentment builds",
    slug: "crash-course-done-standard"
  },
  {
    alt: "Kind standard storyboard background",
    composition:
      "a calm workbench with one blank protected outcome tile, multiple colored method paths, and two sidekick dots leaving room around the owner; no signs, notes, words, or labels",
    courseText:
      "a shared standard protects the outcome without becoming control or avoidance",
    promptSubject:
      "a silent visual metaphor for preserving owner autonomy while protecting the outcome",
    slug: "crash-course-standard-autonomy"
  },
  {
    alt: "Handoff context storyboard background",
    composition:
      "two abstract sidekick characters on either side of a bridge path, passing a blank responsibility tile with access, timing, blocker, training, and review dots traveling with it",
    courseText:
      "a handoff moves context, not just the task, so the next owner does not have to extract it",
    promptSubject:
      "a calm household handoff with context traveling alongside the responsibility",
    slug: "crash-course-handoff-context"
  },
  {
    alt: "Board storyboard background",
    composition:
      "an airy room-scale abstract map of rounded responsibility lanes, owner dots, cadence markers, blank review flags, and concentration paths; no title, no headings, no words, no tiny writing",
    courseText:
      "the Board shows concentration, cadence, unclear ownership, and due reviews without becoming a scoreboard",
    promptSubject:
      "a silent household responsibility map used for discussion instead of scoring",
    slug: "crash-course-load-map"
  },
  {
    alt: "Capacity shift storyboard background",
    composition:
      "a balanced scale beside a soft capacity meter, travel path, rest symbol, recovery leaf, and movable responsibility dots shifting without blame",
    courseText:
      "fairness changes as work seasons, health, travel, recovery, stress, and bandwidth change",
    promptSubject:
      "fairness adapting to capacity and context over time",
    slug: "crash-course-capacity-shift"
  },
  {
    alt: "Check-in signal storyboard background",
    composition:
      "a quiet check-in table with small signal lights for blockers, appreciation, reviews, standards, and decisions flowing into neutral choice paths",
    courseText:
      "Check-ins catch small signals before they harden into bigger tension",
    promptSubject:
      "a calm household check-in turning signals into choices",
    slug: "crash-course-check-in-signal"
  },
  {
    alt: "Repair loop storyboard background",
    composition:
      "two blank speech bubbles, a small missed-step marker, repair note shape, support dot, review loop, and warm light returning to a shared path",
    courseText:
      "repair names what missed, what changed, what support is needed, and what will be different next time",
    promptSubject:
      "kind repair after a household agreement misses the mark",
    slug: "crash-course-repair-loop"
  },
  {
    alt: "Next move storyboard background",
    composition:
      "one highlighted blank responsibility tile moving along a simple path from a shelf to an abstract map to a small check-in table, with two balanced sidekick dots nearby; all surfaces are blank",
    courseText:
      "turn the course into one real responsibility, an owner, a done-well-enough standard, and a review point",
    promptSubject:
      "one silent practical next move from learning into the app workflow",
    slug: "crash-course-next-move"
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
  ...professionalPageBackgroundSpecs
];
