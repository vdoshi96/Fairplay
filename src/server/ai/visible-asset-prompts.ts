type SourceCardPromptInput = {
  title: string;
  labels: readonly string[];
  summary: string;
};

const labelMotifs: Record<string, string> = {
  Caregiving: "gentle support arc, simple care supplies, calm follow-through",
  "Daily Grind": "routine loop, tidy rhythm, repeatable household cadence",
  Out: "route line, keys, bag, transit or appointment shape",
  Home: "domestic object cluster, shelves, tools, bowls, plants, or linens",
  Magic: "delight marker, soft glow, ribbon, celebration shape",
  Wild: "manageable disruption, tilted shape, repair patch, stabilizing signal",
  "Happiness Trio": "personal wellbeing, open space, balanced dots, hobby object",
  Kids: "child-related supplies without faces, school or care objects",
  "Kid Split": "two balanced child-context zones with shared planning signal"
};

const objectCueRules: Array<[RegExp, string]> = [
  [/\b(calendar|schedule|appointment|birthday|holiday|weekend|date)\b/i, "textless calendar tile"],
  [/\b(school|teacher|homework|forms?|tutor|education)\b/i, "blank folder and pencil"],
  [/\b(meal|meals|dinner|breakfast|lunch|grocer|groceries|food|kitchen)\b/i, "bowl, grocery bag, or simple plate"],
  [/\b(laundry|clothes|wardrobe|dry-clean)\b/i, "folded fabric and basket"],
  [/\b(dish|dishes)\b/i, "plate, cup, and simple rinse sparkle"],
  [/\b(clean|cleaning|tidy|organizing|garbage)\b/i, "sparkle, cloth, bin, or clean surface"],
  [/\b(medical|health|dental|illness|birth control|medicine)\b/i, "blank medicine organizer and care cup"],
  [/\b(money|cash|bill|bills|insurance|estate|mortgage|coupon|coupons)\b/i, "plain wallet, coin dots, or sealed envelope"],
  [/\b(travel|transport|transportation|car|auto|relocation|packing)\b/i, "route line, keys, luggage, or vehicle silhouette"],
  [/\b(pet|pets|dog|animal)\b/i, "pet bowl and soft care marker"],
  [/\b(friend|friends|friendships|social|community|charity|service|civic)\b/i, "connected dots and shared table object"],
  [/\b(garden|lawn|plant|plants)\b/i, "leaf, planter, and small tool"],
  [/\b(photo|photos|memory|memories|thank)\b/i, "blank photo frame and ribbon"],
  [/\b(child|children|kid|kids|baby|diaper|bedtime|morning|watching)\b/i, "soft blanket, toy block shape, or care basket"],
  [/\b(spiritual|spirituality|death|parent|parents|family|in-law|in-laws|extended)\b/i, "support ring, candle-like glow, and blank note"],
  [/\b(job|work|electronics|mail|return|returns)\b/i, "blank document, device shape, or parcel"],
  [/\b(self-care|friendship|friendships|unicorn|romance|marriage)\b/i, "open space, small spark, and balanced personal object"]
];

export const sourceCardCoverNegativePrompt = [
  "readable text",
  "title",
  "labels",
  "captions",
  "letters",
  "numbers",
  "logo",
  "watermark",
  "brand mark",
  "playing card",
  "card deck",
  "printable card",
  "trading card",
  "border",
  "suit marks",
  "rotated side text",
  "Trello board",
  "kanban columns",
  "workbook layout",
  "worksheet",
  "PDF page",
  "source deck style",
  "copied public app style",
  "copied book art",
  "proprietary labels",
  "photorealistic",
  "3D render",
  "cluttered scene",
  "tiny details",
  "people",
  "faces",
  "gender stereotypes",
  "one partner managing while another avoids work",
  "blame",
  "shame",
  "anger",
  "crying",
  "confrontation",
  "therapy scene",
  "clinical diagnosis"
].join(", ");

export function buildSourceCardCoverPrompt(input: SourceCardPromptInput) {
  const motifs = input.labels.map((label) => labelMotifs[label]).filter(Boolean);
  const cues = objectCuesFor(input.title, input.summary);

  return [
    "Create an original Fairplay household responsibility cover image.",
    "",
    "Style: flat 2D vector illustration, warm adult product tone, clean geometric shapes, soft rounded forms, crisp edges, no hand-drawn wobble, no comic style, no faux printed-card design.",
    "Composition: portrait 5:7, centered object-led scene, 1-3 simple household objects or abstract responsibility symbols, generous breathing room, readable at small mobile sizes, no border, no title area, no labels, no text.",
    "Palette: warm off-white background with balanced accents from teal, blue, coral, golden yellow, fresh green, and dark ink. Do not make the image one-note beige, orange, purple, slate, or brown.",
    "Tone: calm, practical, kind, non-punitive, relationship-safe. Show shared household planning through neutral objects, paths, dots, check marks, calendars, containers, light, plants, meals, documents, or gentle abstract signals.",
    "Safety/IP: original app illustration only. Do not imitate public decks, card games, worksheets, Trello boards, workbook pages, book/source art, proprietary category systems, logos, brands, or copied layouts.",
    "",
    `Object cues: ${cues.join(", ")}.`,
    motifs.length > 0 ? `Motif cues: ${motifs.join("; ")}.` : null,
    "Final image must contain no readable text, no pseudo-writing, no title, no category badge, no border, and no people."
  ]
    .filter(Boolean)
    .join("\n");
}

function objectCuesFor(title: string, summary: string) {
  const titleCues = matchingObjectCues(title);
  const cues = titleCues.length > 0 ? titleCues : matchingObjectCues(summary);

  return cues.length > 0
    ? [...new Set(cues)].slice(0, 4)
    : ["abstract household planning tile", "soft signal arc", "small organizing container"];
}

function matchingObjectCues(value: string) {
  return objectCueRules
    .filter(([pattern]) => pattern.test(value))
    .map(([, cue]) => cue);
}
