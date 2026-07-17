import { mkdir } from "node:fs/promises";
import { dirname, extname } from "node:path";

import sharp from "sharp";

const sourcePaths = [
  "public/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png",
  "public/assets/fairplay/generated-ui/backgrounds/auth-warm-threshold.png",
  "public/assets/fairplay/generated-ui/backgrounds/check-in-table.png",
  "public/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png",
  "public/assets/fairplay/generated-ui/backgrounds/library-shelf.png",
  "public/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png",
  "public/assets/fairplay/generated-ui/backgrounds/onboarding-rhythm-path.png",
  "public/assets/fairplay/generated-ui/backgrounds/settings-preferences.png",
  "public/assets/fairplay/generated-ui/login-household-garden.png"
];

const widths = [768, 1536];

for (const sourcePath of sourcePaths) {
  const outputBase = sourcePath.slice(0, -extname(sourcePath).length);
  await mkdir(dirname(sourcePath), { recursive: true });

  for (const width of widths) {
    const pipeline = sharp(sourcePath).resize({
      fit: "inside",
      withoutEnlargement: true,
      width
    });

    await Promise.all([
      pipeline
        .clone()
        .avif({ effort: 5, quality: 52 })
        .toFile(`${outputBase}-${width}.avif`),
      pipeline
        .clone()
        .webp({ effort: 4, quality: 74 })
        .toFile(`${outputBase}-${width}.webp`)
    ]);
  }
}

console.log(
  `Generated AVIF/WebP variants for ${sourcePaths.length} images at ${widths.join(
    "px and "
  )}px.`
);
