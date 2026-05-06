import sharp from "sharp";
import { expect, test } from "@playwright/test";

import { littleAlexPixelQaFailures } from "./helpers/little-alex-pixel-qa";

const fixtureSize = { height: 260, width: 220 };
const fixtureBackground = "#f6f3ec";

async function renderFixture(svgBody: string) {
  return sharp(
    Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${fixtureSize.width}" height="${fixtureSize.height}" viewBox="0 0 ${fixtureSize.width} ${fixtureSize.height}">
        <rect width="100%" height="100%" fill="${fixtureBackground}" />
        ${svgBody}
      </svg>
    `)
  )
    .png()
    .toBuffer();
}

async function renderHiddenFixture() {
  return renderFixture("");
}

test.describe("Little Alex pixel QA", () => {
  test("accepts a near-connected character with one clipboard", async () => {
    const hiddenPng = await renderHiddenFixture();
    const visiblePng = await renderFixture(`
      <circle cx="110" cy="54" r="30" fill="#f1b48d" />
      <path d="M82 44 Q110 8 138 44 L130 64 Q110 48 90 64 Z" fill="#252525" />
      <rect x="78" y="80" width="64" height="76" rx="14" fill="#181a1d" />
      <rect x="90" y="68" width="40" height="26" fill="#ffffff" />
      <rect x="64" y="92" width="24" height="70" rx="10" fill="#181a1d" />
      <rect x="132" y="92" width="24" height="70" rx="10" fill="#181a1d" />
      <rect x="98" y="101" width="34" height="48" rx="4" fill="#c69b5a" />
      <rect x="100" y="103" width="30" height="44" rx="3" fill="#d2ad72" />
      <rect x="86" y="150" width="26" height="66" rx="11" fill="#1d252b" />
      <rect x="108" y="150" width="26" height="66" rx="11" fill="#1d252b" />
    `);

    await expect(
      littleAlexPixelQaFailures({ hiddenPng, label: "coherent", visiblePng })
    ).resolves.toEqual([]);
  });

  test("rejects detached body islands and duplicate clipboard regions", async () => {
    const hiddenPng = await renderHiddenFixture();
    const visiblePng = await renderFixture(`
      <circle cx="110" cy="34" r="24" fill="#f1b48d" />
      <rect x="78" y="102" width="64" height="58" rx="12" fill="#181a1d" />
      <rect x="52" y="108" width="24" height="54" rx="10" fill="#181a1d" />
      <rect x="146" y="108" width="24" height="54" rx="10" fill="#181a1d" />
      <rect x="76" y="120" width="28" height="42" rx="4" fill="#d2ad72" />
      <rect x="116" y="120" width="28" height="42" rx="4" fill="#d2ad72" />
      <rect x="78" y="208" width="30" height="42" rx="11" fill="#1d252b" />
      <rect x="112" y="208" width="30" height="42" rx="11" fill="#1d252b" />
    `);

    const failures = await littleAlexPixelQaFailures({
      hiddenPng,
      label: "detached-duplicate",
      visiblePng
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining("near-connected"),
        expect.stringContaining("clipboard-like tan regions")
      ])
    );
  });
});
