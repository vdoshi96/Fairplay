export const LITTLE_ALEX_SKIN_TONES = [
  "tone_1",
  "tone_2",
  "tone_3",
  "tone_4",
  "tone_5"
] as const;

export type LittleAlexSkinToneValue = (typeof LITTLE_ALEX_SKIN_TONES)[number];

export const LITTLE_ALEX_SKIN_TONE_COLORS = {
  tone_1: "#f3c7a6",
  tone_2: "#d8a078",
  tone_3: "#c18463",
  tone_4: "#b7795f",
  tone_5: "#8f5f45"
} as const satisfies Record<LittleAlexSkinToneValue, string>;

export const LITTLE_ALEX_HAIR_COLORS = [
  "dark_brown",
  "black",
  "auburn",
  "blonde",
  "silver"
] as const;

export type LittleAlexHairColorValue =
  (typeof LITTLE_ALEX_HAIR_COLORS)[number];

export const LITTLE_ALEX_HAIR_COLOR_COLORS = {
  dark_brown: "#553d33",
  black: "#202124",
  auburn: "#8f4632",
  blonde: "#d7b36f",
  silver: "#c8c7bc"
} as const satisfies Record<LittleAlexHairColorValue, string>;
