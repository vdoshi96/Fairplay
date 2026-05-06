export const LITTLE_ALEX_SPRITE_OUTPUT_DIR =
  "public/assets/fairplay/little-alex-sprites";
export const LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR =
  `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/source-sheets`;
export const LITTLE_ALEX_SPRITE_QWEN_MODEL = "qwen-image-2.0-pro";
export const LITTLE_ALEX_SPRITE_SHEET_SIZE = "1536*1024";
export const LITTLE_ALEX_SPRITE_CELL_WIDTH = 512;
export const LITTLE_ALEX_SPRITE_CELL_HEIGHT = 512;

export const LITTLE_ALEX_SPRITE_PRESENTATIONS = [
  "neutral",
  "masculine",
  "feminine"
] as const;

export const LITTLE_ALEX_SPRITE_PARTS = [
  "head",
  "torso",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg"
] as const;

export const LITTLE_ALEX_SPRITE_CELL_ORDER = [
  { column: 0, part: "head", row: 0 },
  { column: 1, part: "torso", row: 0 },
  { column: 2, part: "leftArm", row: 0 },
  { column: 0, part: "rightArm", row: 1 },
  { column: 1, part: "leftLeg", row: 1 },
  { column: 2, part: "rightLeg", row: 1 }
] as const satisfies readonly {
  column: 0 | 1 | 2;
  part: LittleAlexSpritePart;
  row: 0 | 1;
}[];

export type LittleAlexSpritePresentation =
  (typeof LITTLE_ALEX_SPRITE_PRESENTATIONS)[number];
export type LittleAlexSpritePart = (typeof LITTLE_ALEX_SPRITE_PARTS)[number];
export type LittleAlexSpriteSlug =
  `${LittleAlexSpritePresentation}-${LittleAlexSpritePart}`;
export type LittleAlexSpriteSheetSlug = `${LittleAlexSpritePresentation}-sheet`;

export type LittleAlexSpriteSheetSpec = {
  alt: string;
  outputPath: `${typeof LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR}/${LittleAlexSpriteSheetSlug}.png`;
  presentation: LittleAlexSpritePresentation;
  promptSubject: string;
  sheetInstructions: string;
  size: typeof LITTLE_ALEX_SPRITE_SHEET_SIZE;
  slug: LittleAlexSpriteSheetSlug;
};

export type LittleAlexSpriteAssetSpec = {
  alt: string;
  crop: {
    column: 0 | 1 | 2;
    height: typeof LITTLE_ALEX_SPRITE_CELL_HEIGHT;
    row: 0 | 1;
    width: typeof LITTLE_ALEX_SPRITE_CELL_WIDTH;
    x: number;
    y: number;
  };
  outputPath: `${typeof LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${LittleAlexSpriteSlug}.png`;
  part: LittleAlexSpritePart;
  presentation: LittleAlexSpritePresentation;
  size: `${typeof LITTLE_ALEX_SPRITE_CELL_WIDTH}*${typeof LITTLE_ALEX_SPRITE_CELL_HEIGHT}`;
  slug: LittleAlexSpriteSlug;
  sourceSheetSlug: LittleAlexSpriteSheetSlug;
};

export const littleAlexSpriteNegativePrompt = [
  "readable text",
  "pseudo-writing",
  "letters",
  "numbers",
  "logo",
  "watermark",
  "brand mark",
  "photorealistic",
  "3D render",
  "real-person likeness",
  "celebrity",
  "public figure",
  "copied mascot",
  "copied app art",
  "source-art resemblance",
  "green clothing",
  "green accessories",
  "mismatched skin tone",
  "mismatched line style",
  "mismatched suit fabric",
  "detached shoulder",
  "extra limbs",
  "full body pose",
  "full assembled character",
  "complete body",
  "three character poses",
  "repeated full character",
  "head attached to torso in arm or leg cells",
  "cropped-off important edges",
  "angry expression",
  "scary expression"
].join(", ");

const presentationSubjects = {
  neutral:
    "gender-neutral original helper sidekick with rounded simple face, small side-part dark hair cap, calm curious eyebrows, black suit, white shirt, tan clipboard, and compact balanced proportions",
  masculine:
    "masculine original helper sidekick with short swept dark hair, slightly broader jaw and confident helpful brow, black suit, white shirt, tan clipboard, and sturdy compact proportions",
  feminine:
    "feminine original helper sidekick with clearly long hair in a dark flowing shape below the head, soft confident expression, black suit, white shirt, tan clipboard, and compact balanced proportions"
} satisfies Record<LittleAlexSpritePresentation, string>;

const sharedSheetInstructions = [
  "all six parts belong to the same original character",
  "identical skin tone",
  "identical line style",
  "identical black suit fabric",
  "identical white shirt",
  "identical tan clipboard style",
  "natural shoulder caps that will overlap the torso",
  "blank clipboard paper with no readable text"
].join("; ");

export const LITTLE_ALEX_SPRITE_SHEETS: LittleAlexSpriteSheetSpec[] =
  LITTLE_ALEX_SPRITE_PRESENTATIONS.map((presentation) => {
    const slug = `${presentation}-sheet` as LittleAlexSpriteSheetSlug;
    return {
      alt: `Little Alex ${presentation} matching sprite-part source sheet`,
      outputPath: `${LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR}/${slug}.png`,
      presentation,
      promptSubject: presentationSubjects[presentation],
      sheetInstructions: sharedSheetInstructions,
      size: LITTLE_ALEX_SPRITE_SHEET_SIZE,
      slug
    };
  });

export const LITTLE_ALEX_SPRITE_ASSETS: LittleAlexSpriteAssetSpec[] =
  LITTLE_ALEX_SPRITE_PRESENTATIONS.flatMap((presentation) =>
    LITTLE_ALEX_SPRITE_CELL_ORDER.map(({ column, part, row }) => {
      const slug = `${presentation}-${part}` as LittleAlexSpriteSlug;
      return {
        alt: `Little Alex ${presentation} ${part} cropped transparent sprite`,
        crop: {
          column,
          height: LITTLE_ALEX_SPRITE_CELL_HEIGHT,
          row,
          width: LITTLE_ALEX_SPRITE_CELL_WIDTH,
          x: column * LITTLE_ALEX_SPRITE_CELL_WIDTH,
          y: row * LITTLE_ALEX_SPRITE_CELL_HEIGHT
        },
        outputPath: `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${slug}.png`,
        part,
        presentation,
        size: `${LITTLE_ALEX_SPRITE_CELL_WIDTH}*${LITTLE_ALEX_SPRITE_CELL_HEIGHT}`,
        slug,
        sourceSheetSlug: `${presentation}-sheet`
      };
    })
  );

export function buildLittleAlexSpritePrompt(input: LittleAlexSpriteSheetSpec) {
  return [
    "Original Fairplay app sidekick sprite sheet.",
    "Style: cute flat 2D original cartoon artwork, crisp simple silhouette, clean vector-like shapes, soft paper texture, no 3D, no photorealism.",
    "Safety/IP: original helper character only; no real-person likeness, no public figure resemblance, no copied mascot, no logo, no watermark.",
    `Variant: ${input.presentation}. Character: ${input.promptSubject}.`,
    `Consistency: ${input.sheetInstructions}.`,
    "Asset type: animation-rig paper-doll source sheet made of separated body-part cutouts, not character pose thumbnails.",
    "Canvas: 1536 by 1024 PNG, strict 3x2 grid with equal 512 by 512 cells and no gutters. Do not draw grid lines, labels, numbers, or captions.",
    "Grid order must be exact: row 1 cell 1 contains head only; row 1 cell 2 contains headless torso only; row 1 cell 3 contains detached left arm only; row 2 cell 1 contains detached right arm only; row 2 cell 2 contains detached left leg only; row 2 cell 3 contains detached right leg only.",
    "Each cell contains exactly one isolated floating body part centered with generous green margin. Never draw a complete assembled person, a full body pose, or multiple character pose thumbnails.",
    "The torso cell shows the black suit jacket, natural shoulder caps, white shirt, and a blank tan clipboard tucked across the front, with no head and no legs. The rightArm cell visibly holds the matching clipboard as a detached sleeve-and-hand part. The arm cells include shoulder caps for natural torso overlap.",
    "Production target: pure chroma green background (#00ff00) across every cell so the generator script can remove it into alpha and crop known cells into transparent PNG sprites.",
    "Keep all parts mobile-readable, wholesome, and visibly different from the other presentation variants while preserving the exact same character within this sheet."
  ].join("\n");
}
