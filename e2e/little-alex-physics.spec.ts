import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

import { littleAlexPixelQaFailures } from "./helpers/little-alex-pixel-qa";

const littleAlexSpriteScreenshotDir = "test-results/little-alex-qwen-sprites";
const littleAlexSpriteBasePath = "/assets/fairplay/little-alex-sprites";
const littleAlexSpriteParts = [
  "head",
  "torso",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg"
] as const;
const littleAlexSpritePresentations = [
  "neutral",
  "masculine",
  "feminine"
] as const;

type LittleAlexSpritePart = (typeof littleAlexSpriteParts)[number];
type LittleAlexSpritePresentation = (typeof littleAlexSpritePresentations)[number];

function expectedLittleAlexSpritePath(
  presentation: LittleAlexSpritePresentation,
  part: LittleAlexSpritePart
) {
  return `${littleAlexSpriteBasePath}/${presentation}-${part}.png`;
}

function expectedLittleAlexFullSpritePath(
  presentation: LittleAlexSpritePresentation
) {
  return `${littleAlexSpriteBasePath}/${presentation}-full.png`;
}

function uniqueHouseholdSlug() {
  return `alex-physics-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

async function expectApiPost(
  page: Page,
  path: string,
  action: () => Promise<void>
) {
  return expectApiRequest(page, path, "POST", action);
}

async function expectApiPatch(
  page: Page,
  path: string,
  action: () => Promise<void>
) {
  return expectApiRequest(page, path, "PATCH", action);
}

async function expectApiRequest(
  page: Page,
  path: string,
  method: "PATCH" | "POST",
  action: () => Promise<void>
) {
  const apiResponse = page
    .waitForResponse((response) =>
      response.url().includes(path) && response.request().method() === method
    )
    .then((response) => ({ response }));
  const apiFailure = page
    .waitForEvent("requestfailed", {
      predicate: (request) =>
        request.url().includes(path) && request.method() === method,
      timeout: 20_000
    })
    .then((request) => ({ request }));

  await action();
  const result = await Promise.race([apiResponse, apiFailure]);

  if ("request" in result) {
    const failure = result.request.failure();

    throw new Error(`${path} request failed: ${failure?.errorText ?? "unknown error"}`);
  }

  const responseText = await result.response.text();
  expect(
    result.response.ok(),
    `${path} failed: ${result.response.status()} ${responseText}`
  ).toBe(true);
}

async function createHouseholdAndChooseAlex(page: Page) {
  await page.goto("/create-household");
  await page.getByLabel("Household display name").fill("Alex Physics Home");
  await page.getByLabel("Household username").fill(uniqueHouseholdSlug());
  await page
    .getByLabel("Household password")
    .fill("correct horse battery staple");
  await expectApiPost(page, "/api/auth/create-household", () =>
    page.getByRole("button", { name: "Create household" }).click()
  );

  await expect(page).toHaveURL(/\/choose-persona/, { timeout: 10_000 });
  await expectApiPost(page, "/api/personas/select", () =>
    page.getByRole("button", { name: /choose Alex/i }).click()
  );
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = (await response.json()) as {
          selectedPersonaId?: string | null;
        };

        return body.selectedPersonaId ?? null;
      })
    )
    .not.toBeNull();
}

async function saveLittleAlexPresentation(
  page: Page,
  presentation: LittleAlexSpritePresentation
) {
  const label = presentation.slice(0, 1).toUpperCase() + presentation.slice(1);

  await page.goto("/app/settings");
  await page.getByRole("button", { name: label }).click();
  await expectApiPatch(page, "/api/preferences/little-alex", () =>
    page.getByRole("button", { name: "Save Little Alex" }).click()
  );
  await expect(page.getByRole("status")).toContainText(
    "Little Alex updated for Alex."
  );
}

async function expectLittleAlexInViewport(
  page: Page,
  options: { minLeft?: number } = {}
) {
  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(6);

  await expect
    .poll(
      () =>
        page.evaluate(({ minLeft }) => {
          const tolerance = 1;
          const viewport = {
            height: window.innerHeight,
            width: window.innerWidth
          };

          return Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="little-alex-body-part"]'
            )
          )
            .concat(
              Array.from(
                document.querySelectorAll<HTMLElement>(
                  '[data-testid="little-alex-full-sprite"]'
                )
              )
            )
            .filter((part) => {
              const style = window.getComputedStyle(part);
              const rect = part.getBoundingClientRect();

              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                rect.height > 0 &&
                rect.width > 0
              );
            })
            .flatMap((part) => {
              const rect = part.getBoundingClientRect();
              const name = part.dataset.part ?? "fullSprite";
              const failures: string[] = [];

              const minimumLeft = minLeft ?? 0;

              if (rect.left < minimumLeft - tolerance) {
                failures.push(`${name} left ${rect.left} < ${minimumLeft}`);
              }

              if (rect.top < -tolerance) {
                failures.push(`${name} top ${rect.top}`);
              }

              if (rect.right > viewport.width + tolerance) {
                failures.push(`${name} right ${rect.right} > ${viewport.width}`);
              }

              if (rect.bottom > viewport.height + tolerance) {
                failures.push(`${name} bottom ${rect.bottom} > ${viewport.height}`);
              }

              return failures;
            });
        }, options),
      { timeout: 3_000 }
    )
    .toEqual([]);
}

async function expectLittleAlexSpritesLoaded(
  page: Page,
  presentation: LittleAlexSpritePresentation
) {
  const expectedSpritePaths = Object.fromEntries(
    littleAlexSpriteParts.map((part) => [
      part,
      expectedLittleAlexSpritePath(presentation, part)
    ])
  ) as Record<LittleAlexSpritePart, string>;

  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(
    littleAlexSpriteParts.length
  );

  await expect
    .poll(
      () =>
        page.evaluate((expectedPath) => {
          const expectedUrl = new URL(expectedPath, window.location.origin).href;
          const sprite = document.querySelector<HTMLImageElement>(
            '[data-testid="little-alex-full-sprite"]'
          );
          const failures: string[] = [];

          if (!sprite) {
            return ["full-body sprite is missing"];
          }

          if (
            sprite.currentSrc !== expectedUrl &&
            sprite.src !== expectedUrl &&
            sprite.getAttribute("src") !== expectedPath &&
            sprite.dataset.fullSpriteSrc !== expectedPath
          ) {
            failures.push(`full-body sprite path mismatch: ${sprite.currentSrc}`);
          }

          if (
            !sprite.complete ||
            sprite.naturalHeight <= 0 ||
            sprite.naturalWidth <= 0
          ) {
            failures.push("full-body sprite image did not load");
          }

          const rect = sprite.getBoundingClientRect();
          if (rect.height < 120 || rect.width < 50) {
            failures.push(
              `full-body sprite rendered too small: ${rect.width.toFixed(
                1
              )}x${rect.height.toFixed(1)}`
            );
          }

          return failures;
        }, expectedLittleAlexFullSpritePath(presentation)),
      { timeout: 5_000 }
    )
    .toEqual([]);

  await expect
    .poll(
      () =>
        page.evaluate(
          ({ expectedSpritePaths, parts }) => {
            const failures: string[] = [];
            const viewport = {
              height: window.innerHeight,
              width: window.innerWidth
            };

            for (const part of parts) {
              const expectedPath = expectedSpritePaths[part];
              const expectedUrl = new URL(expectedPath, window.location.origin).href;
              const bodyPart = document.querySelector<HTMLElement>(
                `[data-testid="little-alex-body-part"][data-part="${part}"]`
              );

              if (!bodyPart) {
                failures.push(`${part} body part is missing`);
                continue;
              }

              const sprite = Array.from(bodyPart.querySelectorAll("img")).find(
                (image) =>
                  image.currentSrc === expectedUrl ||
                  image.src === expectedUrl ||
                  image.getAttribute("src") === expectedPath ||
                  image.dataset.spriteSrc === expectedPath
              );

              if (!sprite) {
                failures.push(`${part} sprite image missing ${expectedPath}`);
                continue;
              }

              if (
                !sprite.complete ||
                sprite.naturalHeight <= 0 ||
                sprite.naturalWidth <= 0
              ) {
                failures.push(`${part} sprite image did not load`);
              }

              const rect = sprite.getBoundingClientRect();
              if (
                rect.width <= 0 ||
                rect.height <= 0 ||
                rect.left < -1 ||
                rect.top < -1 ||
                rect.right > viewport.width + 1 ||
                rect.bottom > viewport.height + 1
              ) {
                failures.push(`${part} sprite is outside safe viewport bounds`);
              }
            }

            return failures;
          },
          {
            expectedSpritePaths,
            parts: littleAlexSpriteParts
          }
        ),
      { timeout: 5_000 }
    )
    .toEqual([]);
}

type PixelComponent = {
  area: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type PixelBounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

async function littleAlexFullBodyPixelFailures(
  presentation: LittleAlexSpritePresentation
) {
  const assetPath = path.join(
    process.cwd(),
    "public/assets/fairplay/little-alex-sprites",
    `${presentation}-full.png`
  );
  const { data, info } = await sharp(await readFile(assetPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const visibleMask = new Uint8Array(info.width * info.height);
  const tanMask = new Uint8Array(info.width * info.height);
  const blackMask = new Uint8Array(info.width * info.height);
  const failures: string[] = [];

  for (let pixel = 0; pixel < visibleMask.length; pixel += 1) {
    const offset = pixel * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];

    if (alpha >= 24) {
      visibleMask[pixel] = 1;
    }
    if (alpha >= 48 && red <= 82 && green <= 82 && blue <= 88) {
      blackMask[pixel] = 1;
    }
  }

  const bounds = maskBounds(visibleMask, info.width, info.height);
  if (!bounds) {
    return [`${presentation}: full-body sprite has no visible pixels`];
  }

  const bodyWidth = bounds.maxX - bounds.minX + 1;
  const bodyHeight = bounds.maxY - bounds.minY + 1;
  const clipboardRegion = {
    maxX: Math.floor(bounds.minX + bodyWidth * 0.88),
    maxY: Math.floor(bounds.minY + bodyHeight * 0.68),
    minX: Math.floor(bounds.minX + bodyWidth * 0.12),
    minY: Math.floor(bounds.minY + bodyHeight * 0.33)
  };

  for (let pixel = 0; pixel < tanMask.length; pixel += 1) {
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    const offset = pixel * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];

    if (
      x >= clipboardRegion.minX &&
      x <= clipboardRegion.maxX &&
      y >= clipboardRegion.minY &&
      y <= clipboardRegion.maxY &&
      alpha >= 40 &&
      red >= 140 &&
      red <= 235 &&
      green >= 95 &&
      green <= 195 &&
      blue >= 45 &&
      blue <= 145 &&
      red - blue >= 38 &&
      green - blue >= 18
    ) {
      tanMask[pixel] = 1;
    }
  }

  const aspectRatio = bodyWidth / bodyHeight;
  if (aspectRatio < 0.28 || aspectRatio > 0.52) {
    failures.push(
      `${presentation}: full-body aspect ratio ${aspectRatio.toFixed(
        2
      )} is outside 0.28..0.52`
    );
  }

  const dilatedVisible = dilateMask(visibleMask, info.width, info.height, 10);
  const visibleComponents = connectedComponents(
    dilatedVisible,
    info.width,
    info.height
  ).filter((component) => component.area >= 120);
  const visibleArea = visibleComponents.reduce(
    (total, component) => total + component.area,
    0
  );
  const largestVisibleComponent = Math.max(
    ...visibleComponents.map((component) => component.area)
  );
  if (
    visibleComponents.length !== 1 &&
    largestVisibleComponent / Math.max(visibleArea, 1) < 0.985
  ) {
    failures.push(
      `${presentation}: visible body splits into ${visibleComponents.length} significant components`
    );
  }

  const clipboardComponents = connectedComponents(
    dilateMask(tanMask, info.width, info.height, 10),
    info.width,
    info.height
  ).filter((component) => component.area >= 260);
  const largestClipboardArea = Math.max(
    ...clipboardComponents.map((component) => component.area),
    0
  );
  const clipboardLikeComponents = clipboardComponents.filter(
    (component) =>
      component.area >= Math.max(1_200, largestClipboardArea * 0.22) &&
      component.maxX - component.minX + 1 >= bodyWidth * 0.2 &&
      component.maxY - component.minY + 1 >= bodyHeight * 0.12
  );
  if (clipboardLikeComponents.length !== 1) {
    failures.push(
      `${presentation}: expected exactly one large central tan clipboard region, found ${clipboardLikeComponents.length}`
    );
  }

  failures.push(
    ...limbProportionFailures({
      blackMask,
      bounds,
      height: info.height,
      presentation,
      width: info.width
    })
  );

  return failures;
}

function limbProportionFailures({
  blackMask,
  bounds,
  height,
  presentation,
  width
}: {
  blackMask: Uint8Array;
  bounds: PixelBounds;
  height: number;
  presentation: LittleAlexSpritePresentation;
  width: number;
}) {
  const bodyWidth = bounds.maxX - bounds.minX + 1;
  const bodyHeight = bounds.maxY - bounds.minY + 1;
  const centerX = bounds.minX + bodyWidth / 2;
  const lowerStartY = bounds.minY + bodyHeight * 0.56;
  const lowerEndY = bounds.minY + bodyHeight * 0.98;
  const centerGap = Math.max(4, bodyWidth * 0.04);
  const leftLeg = maskBoundsInRegion(blackMask, width, height, {
    maxX: Math.floor(centerX - centerGap),
    maxY: Math.floor(lowerEndY),
    minX: bounds.minX,
    minY: Math.floor(lowerStartY)
  });
  const rightLeg = maskBoundsInRegion(blackMask, width, height, {
    maxX: bounds.maxX,
    maxY: Math.floor(lowerEndY),
    minX: Math.ceil(centerX + centerGap),
    minY: Math.floor(lowerStartY)
  });
  const failures: string[] = [];

  if (!leftLeg || !rightLeg) {
    failures.push(`${presentation}: could not detect both black pant legs`);
    return failures;
  }

  const leftLegHeight = leftLeg.maxY - leftLeg.minY + 1;
  const rightLegHeight = rightLeg.maxY - rightLeg.minY + 1;
  const averageLegHeight = (leftLegHeight + rightLegHeight) / 2;
  const legHeightDelta =
    Math.abs(leftLegHeight - rightLegHeight) / Math.max(averageLegHeight, 1);
  if (legHeightDelta > 0.2) {
    failures.push(
      `${presentation}: leg height mismatch ${(legHeightDelta * 100).toFixed(
        1
      )}%`
    );
  }

  const legAreaRatio =
    Math.min(leftLeg.area, rightLeg.area) / Math.max(leftLeg.area, rightLeg.area);
  if (legAreaRatio < 0.52) {
    failures.push(
      `${presentation}: leg area ratio ${legAreaRatio.toFixed(2)} is too uneven`
    );
  }

  return failures;
}

function maskBounds(mask: Uint8Array, width: number, height: number) {
  return maskBoundsInRegion(mask, width, height, {
    maxX: width - 1,
    maxY: height - 1,
    minX: 0,
    minY: 0
  });
}

function maskBoundsInRegion(
  mask: Uint8Array,
  width: number,
  height: number,
  region: PixelBounds
) {
  let area = 0;
  const bounds = {
    maxX: -Infinity,
    maxY: -Infinity,
    minX: Infinity,
    minY: Infinity
  };

  for (
    let y = Math.max(0, region.minY);
    y <= Math.min(height - 1, region.maxY);
    y += 1
  ) {
    for (
      let x = Math.max(0, region.minX);
      x <= Math.min(width - 1, region.maxX);
      x += 1
    ) {
      if (!mask[y * width + x]) {
        continue;
      }

      area += 1;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  if (area === 0) {
    return null;
  }

  return { ...bounds, area };
}

function dilateMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
) {
  const horizontal = new Uint8Array(mask.length);
  const output = new Uint8Array(mask.length);

  for (let y = 0; y < height; y += 1) {
    let active = 0;
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x]) {
        active += 1;
      }
      if (x > radius && mask[y * width + x - radius - 1]) {
        active -= 1;
      }
      if (active > 0) {
        horizontal[y * width + x] = 1;
      }
      const trailing = x - radius;
      if (trailing >= 0 && horizontal[y * width + x]) {
        for (let fillX = Math.max(0, trailing); fillX <= x; fillX += 1) {
          horizontal[y * width + fillX] = 1;
        }
      }
    }
  }

  for (let x = 0; x < width; x += 1) {
    let active = 0;
    for (let y = 0; y < height; y += 1) {
      if (horizontal[y * width + x]) {
        active += 1;
      }
      if (y > radius && horizontal[(y - radius - 1) * width + x]) {
        active -= 1;
      }
      if (active > 0) {
        output[y * width + x] = 1;
      }
      const trailing = y - radius;
      if (trailing >= 0 && output[y * width + x]) {
        for (let fillY = Math.max(0, trailing); fillY <= y; fillY += 1) {
          output[fillY * width + x] = 1;
        }
      }
    }
  }

  return output;
}

function connectedComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  const components: PixelComponent[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (visited[start] || !mask[start]) {
        continue;
      }

      const queue = [start];
      const component: PixelComponent = {
        area: 0,
        maxX: x,
        maxY: y,
        minX: x,
        minY: y
      };
      visited[start] = 1;

      for (let index = 0; index < queue.length; index += 1) {
        const pixel = queue[index];
        const px = pixel % width;
        const py = Math.floor(pixel / width);
        component.area += 1;
        component.minX = Math.min(component.minX, px);
        component.maxX = Math.max(component.maxX, px);
        component.minY = Math.min(component.minY, py);
        component.maxY = Math.max(component.maxY, py);

        for (const [nx, ny] of [
          [px + 1, py],
          [px - 1, py],
          [px, py + 1],
          [px, py - 1]
        ]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }
          const next = ny * width + nx;
          if (visited[next] || !mask[next]) {
            continue;
          }
          visited[next] = 1;
          queue.push(next);
        }
      }

      components.push(component);
    }
  }

  return components;
}

async function littleAlexRigProportionFailures(page: Page) {
  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(
    littleAlexSpriteParts.length
  );

  return page.evaluate((parts) => {
    type RectSnapshot = {
      bottom: number;
      height: number;
      left: number;
      right: number;
      top: number;
      width: number;
    };

    type PartSnapshot = {
      part: string;
      rect: RectSnapshot;
    };

    const horizontalOverlap = (a: RectSnapshot, b: RectSnapshot) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const verticalOverlap = (a: RectSnapshot, b: RectSnapshot) =>
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const verticalGap = (upper: RectSnapshot, lower: RectSnapshot) =>
      lower.top - upper.bottom;

    const snapshots = Object.fromEntries(
      parts.map((part) => {
        const bodyPart = document.querySelector<HTMLElement>(
          `[data-testid="little-alex-body-part"][data-part="${part}"]`
        );
        const rect = bodyPart?.getBoundingClientRect();

        if (!bodyPart || !rect) {
          return [part, null];
        }

        return [
          part,
          {
            part,
            rect: {
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              width: rect.width
            }
          } satisfies PartSnapshot
        ];
      })
    ) as Record<string, PartSnapshot | null>;

    const failures: string[] = [];

    for (const part of parts) {
      if (!snapshots[part]) {
        failures.push(`${part} body part is missing`);
      }
    }

    const head = snapshots.head?.rect;
    const torso = snapshots.torso?.rect;
    const leftArm = snapshots.leftArm?.rect;
    const rightArm = snapshots.rightArm?.rect;
    const leftLeg = snapshots.leftLeg?.rect;
    const rightLeg = snapshots.rightLeg?.rect;

    if (head && torso) {
      const neckGap = verticalGap(head, torso);
      const neckOverlap = horizontalOverlap(head, torso);

      if (neckGap < -2 || neckGap > 4) {
        failures.push(
          `head/torso vertical gap ${neckGap.toFixed(1)} is outside -2..4`
        );
      }

      if (neckOverlap < Math.min(head.width, torso.width) * 0.42) {
        failures.push(
          `head/torso horizontal overlap ${neckOverlap.toFixed(1)} is too small`
        );
      }
    }

    for (const [name, leg] of [
      ["leftLeg", leftLeg],
      ["rightLeg", rightLeg]
    ] as const) {
      if (!torso || !leg) {
        continue;
      }

      const hipGap = verticalGap(torso, leg);
      const hipOverlap = horizontalOverlap(torso, leg);

      if (hipGap > 2) {
        failures.push(`torso/${name} vertical gap ${hipGap.toFixed(1)} > 2`);
      }

      if (hipOverlap < leg.width * 0.55) {
        failures.push(
          `torso/${name} horizontal overlap ${hipOverlap.toFixed(1)} is too small`
        );
      }
    }

    for (const [name, arm] of [
      ["leftArm", leftArm],
      ["rightArm", rightArm]
    ] as const) {
      if (!torso || !arm) {
        continue;
      }

      const shoulderOverlap = horizontalOverlap(torso, arm);
      const shoulderBand = {
        ...torso,
        bottom: torso.top + torso.height * 0.42
      };
      const shoulderVerticalOverlap = verticalOverlap(shoulderBand, arm);

      if (shoulderOverlap < arm.width * 0.35) {
        failures.push(
          `torso/${name} shoulder overlap ${shoulderOverlap.toFixed(1)} is too small`
        );
      }

      if (shoulderVerticalOverlap < arm.height * 0.2) {
        failures.push(
          `torso/${name} shoulder vertical overlap ${shoulderVerticalOverlap.toFixed(
            1
          )} is too small`
        );
      }
    }

    return failures;
  }, littleAlexSpriteParts);
}

async function littleAlexScreenshotPixelFailures(
  page: Page,
  presentation: LittleAlexSpritePresentation,
  screenshotPath: string
) {
  const visiblePng = await page.screenshot({
    fullPage: false,
    path: screenshotPath
  });
  const hideStyle = await page.addStyleTag({
    content: `[data-testid="little-alex-horne"] { opacity: 0 !important; transition: none !important; visibility: hidden !important; }`
  });

  try {
    const hiddenPng = await page.screenshot({ fullPage: false });

    return littleAlexPixelQaFailures({
      hiddenPng,
      label: presentation,
      visiblePng
    });
  } finally {
    await hideStyle.evaluate((style) => {
      style.parentNode?.removeChild(style);
    });
  }
}

async function dragLittleAlex(page: Page, deltaX: number, deltaY: number) {
  const grabTarget = page.getByTestId("little-alex-grab-target");
  const box = await grabTarget.boundingBox();

  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX * 0.45, startY + deltaY * 0.45, {
    steps: 4
  });
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 4 });
  await page.mouse.up();
}

async function dragLittleAlexTo(page: Page, targetX: number, targetY: number) {
  const grabTarget = page.getByTestId("little-alex-grab-target");
  const box = await grabTarget.boundingBox();

  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move((startX + targetX) / 2, (startY + targetY) / 2, {
    steps: 4
  });
  await page.mouse.move(targetX, targetY, { steps: 4 });
  await page.mouse.up();
}

test.describe("Little Alex physics", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await rm(littleAlexSpriteScreenshotDir, { force: true, recursive: true });
    await mkdir(littleAlexSpriteScreenshotDir, { recursive: true });
  });

  test("appears globally on standard and immersive protected app routes", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);

    await page.goto("/app/home");
    await expect(page.getByTestId("little-alex-horne")).toHaveAttribute(
      "data-motion-mode",
      "physics"
    );
    await expect(page.getByTestId("little-alex-body-part")).toHaveCount(6);
    await expect(page.getByRole("button", { name: /little alex/i })).toHaveCount(0);
    await expect(page.getByTestId("little-alex-horne")).toHaveCSS(
      "pointer-events",
      "none"
    );
    await expect(page.getByTestId("little-alex-grab-target")).toHaveCSS(
      "pointer-events",
      "auto"
    );

    await page.goto("/app/crash-course");
    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await expect(page.getByTestId("app-main")).toHaveAttribute(
      "data-layout",
      "immersive"
    );
  });

  test("can be dragged and flung while staying inside the viewport", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    const littleAlex = page.getByTestId("little-alex-horne");
    const viewport = page.viewportSize();

    await expect
      .poll(async () => {
        await page.mouse.move(32, 180);

        return littleAlex.getAttribute("data-gaze-direction");
      })
      .toBe("left");
    await expect
      .poll(async () => {
        await page.mouse.move((viewport?.width ?? 1280) - 24, 180);

        return littleAlex.getAttribute("data-gaze-direction");
      })
      .toBe("right");

    const grabTarget = page.getByTestId("little-alex-grab-target");
    const grabBox = await grabTarget.boundingBox();

    expect(grabBox).not.toBeNull();

    if (!grabBox) {
      return;
    }

    await page.mouse.click(
      grabBox.x + grabBox.width / 2,
      grabBox.y + grabBox.height / 2
    );
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveCount(0);

    const torso = page.locator('[data-part="torso"]');
    const before = await torso.boundingBox();

    await dragLittleAlex(page, -240, 180);
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
      "i'm little alex horne"
    );
    await page.waitForTimeout(500);

    const after = await torso.boundingBox();
    expect(after).not.toBeNull();
    expect(before).not.toBeNull();

    if (before && after) {
      expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(
        20
      );
    }

    await expectLittleAlexInViewport(page);
  });

  test("stays to the right of the desktop sidebar after a leftward fling", async ({
    page
  }) => {
    await page.setViewportSize({ height: 720, width: 1280 });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await dragLittleAlex(page, -1_200, 120);
    await page.waitForTimeout(500);

    await expectLittleAlexInViewport(page, { minLeft: 256 });
  });

  test("uses saved Little Alex preferences for appearance and fling bubble", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Feminine" }).click();
    await page
      .getByLabel("Little Alex chat bubble phrase")
      .fill("well done everyone");
    await page.getByRole("button", { name: "Tone 4" }).click();
    await expectApiPatch(page, "/api/preferences/little-alex", () =>
      page.getByRole("button", { name: "Save Little Alex" }).click()
    );
    await expect(page.getByRole("status")).toContainText(
      "Little Alex updated for Alex."
    );

    await page.goto("/app/home");
    const littleAlex = page.getByTestId("little-alex-horne");

    await expect(littleAlex).toHaveAttribute(
      "data-gender-presentation",
      "feminine"
    );
    await expect(littleAlex).toHaveAttribute(
      "data-chat-phrase",
      "well done everyone"
    );
    await dragLittleAlex(page, -180, 120);
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
      "well done everyone"
    );
  });

  test("stands still after five seconds untouched before slow idle walking", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    const littleAlex = page.getByTestId("little-alex-horne");

    await expect(littleAlex).toHaveAttribute("data-idle-state", "active");
    await expect(littleAlex).toHaveAttribute("data-idle-state", "standing", {
      timeout: 6_500
    });
    await expect
      .poll(
        () =>
          littleAlex.evaluate((element) => {
            const idleState = element.getAttribute("data-idle-state");
            const turns = Number(element.getAttribute("data-idle-walk-turns") ?? 0);

            return idleState === "walking" || turns > 0;
          }),
        { timeout: 6_000 }
      )
      .toBe(true);
    await expectLittleAlexInViewport(page);
  });

  test("keeps every body part inside a constrained mobile landscape viewport", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.setViewportSize({ height: 260, width: 300 });
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await expectLittleAlexInViewport(page);

    await dragLittleAlex(page, 220, 160);
    await page.waitForTimeout(500);

    await expectLittleAlexInViewport(page);
  });

  test("does not cover mobile navigation taps when resting near the bottom nav", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ height: 720, width: 390 });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toHaveCSS("z-index", "9");

    const mobileNav = page.getByRole("navigation", { name: "Primary" });
    const libraryLink = mobileNav.getByRole("link", { name: "Library" });
    const libraryBox = await libraryLink.boundingBox();

    expect(libraryBox).not.toBeNull();

    if (!libraryBox) {
      return;
    }

    await dragLittleAlexTo(
      page,
      libraryBox.x + libraryBox.width / 2,
      libraryBox.y + libraryBox.height / 2
    );

    await libraryLink.click();
    await expect(page).toHaveURL(/\/app\/library/);
  });

  test("uses a static draggable-safe mode with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    const littleAlex = page.getByTestId("little-alex-horne");
    await expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");
    await expect(littleAlex).toHaveAttribute("data-idle-state", "static");

    const torso = page.locator('[data-part="torso"]');
    const before = await torso.boundingBox();
    await dragLittleAlex(page, -180, 80);
    const after = await torso.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();

    if (before && after) {
      expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(
        20
      );
    }

    await expectLittleAlexInViewport(page);
  });

  test("captures visual QA screenshots for all sprite presentations", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ height: 720, width: 1280 });
    await createHouseholdAndChooseAlex(page);
    const rigProportionFailures: string[] = [];
    const fullBodyPixelFailures: string[] = [];

    for (const presentation of littleAlexSpritePresentations) {
      await saveLittleAlexPresentation(page, presentation);
      await page.goto("/app/home");

      const littleAlex = page.getByTestId("little-alex-horne");
      await expect(littleAlex).toHaveAttribute(
        "data-gender-presentation",
        presentation
      );
      await expectLittleAlexSpritesLoaded(page, presentation);
      await expectLittleAlexInViewport(page, { minLeft: 256 });

      const screenshotPath = `${littleAlexSpriteScreenshotDir}/${presentation}.png`;
      rigProportionFailures.push(
        ...(await littleAlexScreenshotPixelFailures(
          page,
          presentation,
          screenshotPath
        ))
      );
      rigProportionFailures.push(
        ...(await littleAlexRigProportionFailures(page)).map(
          (failure) => `${presentation}: ${failure}`
        )
      );
      fullBodyPixelFailures.push(
        ...(await littleAlexFullBodyPixelFailures(presentation))
      );

      await dragLittleAlex(page, -220, 120);
      await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
        "i'm little alex horne"
      );
      await expectLittleAlexInViewport(page, { minLeft: 256 });
    }

    expect(rigProportionFailures).toEqual([]);
    expect(fullBodyPixelFailures).toEqual([]);
  });
});
