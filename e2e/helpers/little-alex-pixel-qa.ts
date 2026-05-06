import sharp from "sharp";

type LittleAlexPixelQaInput = {
  hiddenPng: Buffer;
  label: string;
  visiblePng: Buffer;
};

type RawImage = {
  data: Buffer;
  height: number;
  width: number;
};

type Bounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type Component = Bounds & {
  area: number;
  height: number;
  width: number;
};

const diffThreshold = 24;
const bridgeRadiusPx = 8;
const maxMajorPartGapPx = 14;

export async function littleAlexPixelQaFailures(
  input: LittleAlexPixelQaInput
): Promise<string[]> {
  const [visible, hidden] = await Promise.all([
    pngToRaw(input.visiblePng),
    pngToRaw(input.hiddenPng)
  ]);

  if (visible.width !== hidden.width || visible.height !== hidden.height) {
    return [
      `${input.label}: screenshot dimensions differ (${visible.width}x${visible.height} vs ${hidden.width}x${hidden.height})`
    ];
  }

  const { bounds, foregroundPixels, mask } = createDiffMask(visible, hidden);
  const failures: string[] = [];

  if (!bounds || foregroundPixels < 450) {
    return [
      `${input.label}: Little Alex foreground was not detectable in screenshot diff`
    ];
  }

  const rawComponents = findComponents(mask, visible.width, visible.height, 12);
  const majorRawComponents = rawComponents.filter(
    (component) => component.area >= Math.max(70, foregroundPixels * 0.006)
  );

  const bridgedMask = dilateMask(mask, visible.width, visible.height, bridgeRadiusPx);
  const bridgedComponents = findComponents(
    bridgedMask,
    visible.width,
    visible.height,
    Math.max(90, foregroundPixels * 0.01)
  );
  const bridgedArea = bridgedComponents.reduce(
    (total, component) => total + component.area,
    0
  );
  const largestBridgeShare =
    bridgedArea > 0 && bridgedComponents[0]
      ? bridgedComponents[0].area / bridgedArea
      : 0;

  if (bridgedComponents.length !== 1 || largestBridgeShare < 0.92) {
    failures.push(
      `${input.label}: visible silhouette is split into ${bridgedComponents.length} near-connected components after ${bridgeRadiusPx}px bridge; largest share ${largestBridgeShare.toFixed(
        2
      )}; components ${summarizeComponents(bridgedComponents)}`
    );
  }

  const gappedComponents = majorRawComponents
    .map((component) => ({
      component,
      gap: nearestComponentGap(component, majorRawComponents)
    }))
    .filter(({ gap }) => gap > maxMajorPartGapPx);

  if (gappedComponents.length > 0) {
    failures.push(
      `${input.label}: visible body parts have large pixel gaps over ${maxMajorPartGapPx}px: ${gappedComponents
        .map(
          ({ component, gap }) =>
            `${component.area}px area at ${formatBounds(component)} gap ${gap.toFixed(
              1
            )}px`
        )
        .join("; ")}`
    );
  }

  const clipboardCandidates = findClipboardCandidates(
    visible,
    mask,
    bounds,
    foregroundPixels
  );

  if (clipboardCandidates.length !== 1) {
    failures.push(
      `${input.label}: clipboard-like tan regions check expected exactly 1 cluster, found ${clipboardCandidates.length}; candidates ${summarizeComponents(
        clipboardCandidates
      )}`
    );
  }

  return failures;
}

async function pngToRaw(png: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    height: info.height,
    width: info.width
  };
}

function createDiffMask(visible: RawImage, hidden: RawImage) {
  const mask = new Uint8Array(visible.width * visible.height);
  let foregroundPixels = 0;
  let bounds: Bounds | null = null;

  for (let y = 0; y < visible.height; y += 1) {
    for (let x = 0; x < visible.width; x += 1) {
      const index = y * visible.width + x;
      const offset = index * 4;
      const delta =
        Math.abs(visible.data[offset] - hidden.data[offset]) +
        Math.abs(visible.data[offset + 1] - hidden.data[offset + 1]) +
        Math.abs(visible.data[offset + 2] - hidden.data[offset + 2]);

      if (delta < diffThreshold) {
        continue;
      }

      mask[index] = 1;
      foregroundPixels += 1;
      bounds = expandBounds(bounds, x, y);
    }
  }

  return { bounds, foregroundPixels, mask };
}

function expandBounds(bounds: Bounds | null, x: number, y: number): Bounds {
  if (!bounds) {
    return { bottom: y, left: x, right: x, top: y };
  }

  return {
    bottom: Math.max(bounds.bottom, y),
    left: Math.min(bounds.left, x),
    right: Math.max(bounds.right, x),
    top: Math.min(bounds.top, y)
  };
}

function findComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minArea: number
) {
  const seen = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components: Component[] = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (seen[start] || mask[start] === 0) {
      continue;
    }

    let area = 0;
    let head = 0;
    let left = width;
    let right = 0;
    let top = height;
    let bottom = 0;
    let tail = 0;

    seen[start] = 1;
    queue[tail] = start;
    tail += 1;

    while (head < tail) {
      const index = queue[head];
      head += 1;

      const x = index % width;
      const y = Math.floor(index / width);

      area += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          const nx = x + dx;
          const ny = y + dy;

          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }

          const neighbor = ny * width + nx;

          if (seen[neighbor] || mask[neighbor] === 0) {
            continue;
          }

          seen[neighbor] = 1;
          queue[tail] = neighbor;
          tail += 1;
        }
      }
    }

    if (area >= minArea) {
      components.push({
        area,
        bottom,
        height: bottom - top + 1,
        left,
        right,
        top,
        width: right - left + 1
      });
    }
  }

  return components.sort((a, b) => b.area - a.area);
}

function dilateMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
) {
  const dilated = new Uint8Array(mask.length);

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 0) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(width - 1, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(height - 1, y + radius);

    for (let dy = minY; dy <= maxY; dy += 1) {
      const rowOffset = dy * width;

      for (let dx = minX; dx <= maxX; dx += 1) {
        dilated[rowOffset + dx] = 1;
      }
    }
  }

  return dilated;
}

function nearestComponentGap(component: Component, components: Component[]) {
  const nearest = components
    .filter((candidate) => candidate !== component)
    .map((candidate) => componentGap(component, candidate))
    .sort((a, b) => a - b)[0];

  return nearest ?? 0;
}

function componentGap(a: Component, b: Component) {
  const horizontalGap = Math.max(
    0,
    Math.max(a.left, b.left) - Math.min(a.right, b.right) - 1
  );
  const verticalGap = Math.max(
    0,
    Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom) - 1
  );

  return Math.hypot(horizontalGap, verticalGap);
}

function findClipboardCandidates(
  visible: RawImage,
  foregroundMask: Uint8Array,
  characterBounds: Bounds,
  foregroundPixels: number
) {
  const tanMask = new Uint8Array(foregroundMask.length);
  const characterHeight = characterBounds.bottom - characterBounds.top + 1;
  const bodyStartY = characterBounds.top + characterHeight * 0.28;
  const bodyEndY = characterBounds.top + characterHeight * 0.72;

  for (let y = characterBounds.top; y <= characterBounds.bottom; y += 1) {
    if (y < bodyStartY || y > bodyEndY) {
      continue;
    }

    for (let x = characterBounds.left; x <= characterBounds.right; x += 1) {
      const index = y * visible.width + x;

      if (foregroundMask[index] === 0) {
        continue;
      }

      const offset = index * 4;

      if (
        isClipboardTan(
          visible.data[offset],
          visible.data[offset + 1],
          visible.data[offset + 2]
        )
      ) {
        tanMask[index] = 1;
      }
    }
  }

  const minimumArea = Math.max(42, foregroundPixels * 0.004);

  return findComponents(tanMask, visible.width, visible.height, minimumArea).filter(
    (component) => {
      const aspectRatio = component.width / component.height;
      const rectangularity = component.area / (component.width * component.height);
      const centerY = component.top + component.height / 2;
      const verticalPosition =
        (centerY - characterBounds.top) / Math.max(1, characterHeight);

      return (
        component.width >= 8 &&
        component.height >= 10 &&
        aspectRatio >= 0.35 &&
        aspectRatio <= 1.45 &&
        rectangularity >= 0.35 &&
        verticalPosition >= 0.3 &&
        verticalPosition <= 0.72
      );
    }
  );
}

function isClipboardTan(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const saturation = max === 0 ? 0 : (max - min) / max;

  return (
    red >= 110 &&
    red <= 230 &&
    green >= 78 &&
    green <= 195 &&
    blue >= 35 &&
    blue <= 150 &&
    red >= green * 0.95 &&
    red <= green * 1.75 &&
    green >= blue * 1.08 &&
    saturation >= 0.16 &&
    saturation <= 0.72
  );
}

function summarizeComponents(components: Component[]) {
  if (components.length === 0) {
    return "none";
  }

  return components
    .slice(0, 6)
    .map((component) => `${component.area}px@${formatBounds(component)}`)
    .join(", ");
}

function formatBounds(bounds: Bounds) {
  return `${bounds.left},${bounds.top}-${bounds.right},${bounds.bottom}`;
}
