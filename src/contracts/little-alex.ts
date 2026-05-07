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
