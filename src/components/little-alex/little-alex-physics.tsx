"use client";

import Matter from "matter-js";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  Touch as ReactTouch,
  TouchEvent as ReactTouchEvent
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { APP_LAYOUT_METRICS } from "@/components/app-shell/layout-tokens";
import { LITTLE_ALEX_SKIN_TONE_COLORS } from "@/contracts/little-alex";
import {
  type LittleAlexGenderPresentation,
  type LittleAlexSkinTone
} from "@/contracts/preferences";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_CHAT_PHRASE = "i'm little alex horne";
const DEFAULT_GENDER_PRESENTATION: LittleAlexGenderPresentation = "neutral";
const DEFAULT_SKIN_TONE: LittleAlexSkinTone = "tone_2";
const PHYSICS_SPEED_MULTIPLIER = 1.1;
const IDLE_STAND_DELAY_MS = 5_000;
const IDLE_RELEASE_STAND_DELAY_MS = 6_500;
const IDLE_STANDING_PAUSE_MS = 4_000;
const IDLE_WALK_STEP_PX = 0.36;
const MIN_IDLE_WALK_TURN_FRACTION = 0.05;
const MIN_IDLE_TURNS_BEFORE_DIRECTION_CHANGE = 3;
const BUBBLE_DRAG_DISTANCE_THRESHOLD = 14;
const BUBBLE_RELEASE_SPEED_THRESHOLD = 6;
const WALL_THICKNESS = 96;
const VIEWPORT_PADDING = 2;
const SERVER_SAFE_ANCHOR = { x: 906, y: 218 };
const RAGDOLL_RECOVERY_TRANSITION_MS = 360;

type Point = {
  x: number;
  y: number;
};

type PartKey = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

type PartConfig = {
  className: string;
  height: number;
  key: PartKey;
  offset: Point;
  width: number;
};

type AppearanceDetails = {
  brow: string;
  face: string;
  hair: string;
  head: string;
  mouth: string;
  silhouette: string;
};

type DragState = {
  lastPoint: Point;
  lastTime: number;
  maxDistance: number;
  offset: Point;
  pointerId: number;
  startPoint: Point;
  velocity: Point;
};

const TOUCH_DRAG_POINTER_ID_OFFSET = 10_000;

type GazeDirection = "center" | "left" | "right";

type GazeState = {
  direction: GazeDirection;
  x: number;
  y: number;
};

type IdleState = "active" | "standing" | "walking";

type RagdollVisualState = "settled" | "dragging" | "flinging" | "recovering";

type WalkDirection = -1 | 1;

export type PlayAreaBounds = {
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  width: number;
};

export type IdleWalkTurn = {
  direction: WalkDirection;
  targetX: number;
  turnsInDirection: number;
};

type PointerInput = {
  clientX: number;
  clientY: number;
  pageX?: number;
  pageY?: number;
  pointerId: number;
  preventDefault: () => void;
  screenX?: number;
  screenY?: number;
  stopPropagation: () => void;
  timeStamp: number;
};

type PhysicsWorld = {
  bodies: Record<PartKey, Matter.Body>;
  engine: Matter.Engine;
  runner: Matter.Runner;
  walls: Matter.Body[];
};

type LittleAlexPhysicsProps = {
  chatPhrase?: string;
  genderPresentation?: LittleAlexGenderPresentation;
  skinTone?: LittleAlexSkinTone;
};

const appearanceDetails = {
  feminine: {
    brow: "arched-brow",
    face: "cheek-highlight",
    hair: "long-hair",
    head: "soft-heart-head",
    mouth: "soft-smile",
    silhouette: "tapered-suit"
  },
  masculine: {
    brow: "strong-brow",
    face: "square-jaw",
    hair: "cropped-sideburns",
    head: "square-jaw-head",
    mouth: "confident-smirk",
    silhouette: "broad-shoulder-suit"
  },
  neutral: {
    brow: "relaxed-brow",
    face: "freckle-pair",
    hair: "side-swept",
    head: "round-head",
    mouth: "straight-smile",
    silhouette: "classic-suit"
  }
} satisfies Record<LittleAlexGenderPresentation, AppearanceDetails>;

const partConfigs: PartConfig[] = [
  {
    className: "fp-little-alex-head",
    height: 46,
    key: "head",
    offset: { x: 0, y: -56 },
    width: 46
  },
  {
    className: "fp-little-alex-torso",
    height: 68,
    key: "torso",
    offset: { x: 0, y: 0 },
    width: 54
  },
  {
    className: "fp-little-alex-arm fp-little-alex-arm-left",
    height: 66,
    key: "leftArm",
    offset: { x: -27, y: -1 },
    width: 20
  },
  {
    className: "fp-little-alex-arm fp-little-alex-arm-right",
    height: 66,
    key: "rightArm",
    offset: { x: 27, y: -1 },
    width: 20
  },
  {
    className: "fp-little-alex-leg fp-little-alex-leg-left",
    height: 66,
    key: "leftLeg",
    offset: { x: -14, y: 64 },
    width: 22
  },
  {
    className: "fp-little-alex-leg fp-little-alex-leg-right",
    height: 66,
    key: "rightLeg",
    offset: { x: 14, y: 64 },
    width: 22
  }
];

const DEFAULT_GAZE_STATE: GazeState = {
  direction: "center",
  x: 0,
  y: 0
};

const partConfigByKey = Object.fromEntries(
  partConfigs.map((part) => [part.key, part])
) as Record<PartKey, PartConfig>;

function positionForPart(anchor: Point, part: PartConfig): Point {
  return {
    x: anchor.x + part.offset.x,
    y: anchor.y + part.offset.y
  };
}

function littleAlexFullBodySpritePath(
  genderPresentation: LittleAlexGenderPresentation,
  skinTone: LittleAlexSkinTone
) {
  return `/assets/fairplay/little-alex-sprites/${genderPresentation}-${skinTone}-full.png`;
}

function littleAlexPartSpritePath(
  genderPresentation: LittleAlexGenderPresentation,
  skinTone: LittleAlexSkinTone,
  part: PartKey
) {
  return `/assets/fairplay/little-alex-sprites/${genderPresentation}-${skinTone}-${part}.png`;
}

function isRagdollPartVisible(state: RagdollVisualState) {
  return state === "flinging" || state === "recovering";
}

function fullBodyOpacity(state: RagdollVisualState) {
  return state === "flinging" ? 0 : 1;
}

const characterBounds = partConfigs.reduce(
  (bounds, part) => ({
    maxX: Math.max(bounds.maxX, part.offset.x + part.width / 2),
    maxY: Math.max(bounds.maxY, part.offset.y + part.height / 2),
    minX: Math.min(bounds.minX, part.offset.x - part.width / 2),
    minY: Math.min(bounds.minY, part.offset.y - part.height / 2)
  }),
  { maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity }
);
const FULL_BODY_DISPLAY_HEIGHT = characterBounds.maxY - characterBounds.minY;
const FULL_BODY_DISPLAY_WIDTH = 86;
const FULL_BODY_CENTER_OFFSET_Y =
  characterBounds.minY + FULL_BODY_DISPLAY_HEIGHT / 2;
const FULL_BODY_VISUAL_BOTTOM_PADDING = 12;
const MOBILE_FULL_BODY_VISUAL_SCALE = 0.32;
const MOBILE_FULL_BODY_VISUAL_INLINE_NUDGE = 31;

function cssLengthToPx(value: string | undefined, rootFontSizePx = 16) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const numeric = Number.parseFloat(trimmed);

  if (!Number.isFinite(numeric)) {
    return undefined;
  }

  if (trimmed.endsWith("rem")) {
    return numeric * rootFontSizePx;
  }

  return numeric;
}

function rootFontSizePx() {
  if (typeof window === "undefined") {
    return 16;
  }

  return (
    cssLengthToPx(window.getComputedStyle(document.documentElement).fontSize) ?? 16
  );
}

function computedCssVariablePx(name: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const rootStyle = window.getComputedStyle(document.documentElement);
  return cssLengthToPx(rootStyle.getPropertyValue(name), rootFontSizePx());
}

function computedShellBottomReservePx() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const shell = document.querySelector<HTMLElement>(".fp-little-alex-shell");
  if (!shell) {
    return undefined;
  }

  const bottom = cssLengthToPx(window.getComputedStyle(shell).bottom);
  return bottom === undefined ? undefined : Math.max(bottom, 0);
}

function littleAlexBottomReservePx(isDesktop: boolean) {
  return (
    computedShellBottomReservePx() ??
    computedCssVariablePx("--fp-little-alex-bottom-reserve") ??
    (isDesktop
      ? APP_LAYOUT_METRICS.littleAlexDesktopBottomReservePx
      : APP_LAYOUT_METRICS.littleAlexMobileBottomReservePx)
  );
}

function sidebarWidthPx() {
  return (
    computedCssVariablePx("--fp-app-sidebar-width") ??
    APP_LAYOUT_METRICS.sidebarWidthPx
  );
}

function viewportSize() {
  if (typeof window === "undefined") {
    return { height: 768, width: 1024 };
  }

  return {
    height: window.innerHeight || document.documentElement.clientHeight || 0,
    width: window.innerWidth || document.documentElement.clientWidth || 0
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampToViewportRange(value: number, min: number, max: number) {
  if (min > max) {
    return (min + max) / 2;
  }

  return clamp(value, min, max);
}

function firstFiniteCoordinate(
  ...values: Array<number | undefined>
): number | undefined {
  return values.find((value) => Number.isFinite(value));
}

export function playAreaBounds(viewport = viewportSize()): PlayAreaBounds {
  const isDesktop = viewport.width >= APP_LAYOUT_METRICS.desktopBreakpointPx;
  const minX = isDesktop ? sidebarWidthPx() : 0;
  const maxY = Math.max(
    viewport.height - littleAlexBottomReservePx(isDesktop),
    0
  );

  return {
    height: maxY,
    maxX: viewport.width,
    maxY,
    minX,
    minY: 0,
    width: Math.max(viewport.width - minX, 0)
  };
}

function anchorRange(bounds: PlayAreaBounds) {
  return {
    maxX: bounds.maxX - characterBounds.maxX - VIEWPORT_PADDING,
    maxY: bounds.maxY - characterBounds.maxY - VIEWPORT_PADDING,
    minX: bounds.minX - characterBounds.minX + VIEWPORT_PADDING,
    minY: bounds.minY - characterBounds.minY + VIEWPORT_PADDING
  };
}

function clampAnchor(anchor: Point, bounds = playAreaBounds()) {
  const range = anchorRange(bounds);

  return {
    x: clampToViewportRange(anchor.x, range.minX, range.maxX),
    y: clampToViewportRange(anchor.y, range.minY, range.maxY)
  };
}

function initialAnchor() {
  const viewport = viewportSize();
  const bounds = playAreaBounds(viewport);
  const range = anchorRange(bounds);

  return clampAnchor({
    x: range.maxX,
    y: range.maxY
  }, bounds);
}

function partStyle(part: PartConfig, center: Point, angle = 0): CSSProperties {
  return {
    height: part.height,
    transform: `translate3d(${center.x - part.width / 2}px, ${
      center.y - part.height / 2
    }px, 0) rotate(${angle}rad)`,
    width: part.width
  };
}

function reducedPartStyle(part: PartConfig, anchor: Point): CSSProperties {
  return {
    ...partStyle(part, positionForPart(anchor, part)),
    opacity: 0
  };
}

function fullBodyVisualHalfExtents(angle: number) {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  return {
    x: (FULL_BODY_DISPLAY_WIDTH * cos + FULL_BODY_DISPLAY_HEIGHT * sin) / 2,
    y: (FULL_BODY_DISPLAY_WIDTH * sin + FULL_BODY_DISPLAY_HEIGHT * cos) / 2
  };
}

function fullBodyVisualScale(viewport = viewportSize()) {
  return viewport.width < APP_LAYOUT_METRICS.desktopBreakpointPx
    ? MOBILE_FULL_BODY_VISUAL_SCALE
    : 1;
}

function fullBodyVisualInlineNudge(viewport = viewportSize()) {
  return viewport.width < APP_LAYOUT_METRICS.desktopBreakpointPx
    ? MOBILE_FULL_BODY_VISUAL_INLINE_NUDGE
    : 0;
}

function clampFullBodyAnchor(
  anchor: Point,
  angle = 0,
  bounds = playAreaBounds()
) {
  const halfExtents = fullBodyVisualHalfExtents(angle);

  return {
    x: clampToViewportRange(
      anchor.x,
      bounds.minX + halfExtents.x + VIEWPORT_PADDING,
      bounds.maxX - halfExtents.x - VIEWPORT_PADDING
    ),
    y: clampToViewportRange(
      anchor.y,
      bounds.minY + halfExtents.y - FULL_BODY_CENTER_OFFSET_Y + VIEWPORT_PADDING,
      bounds.maxY -
        halfExtents.y -
        FULL_BODY_CENTER_OFFSET_Y -
        VIEWPORT_PADDING -
        FULL_BODY_VISUAL_BOTTOM_PADDING
    )
  };
}

function fullBodySpriteStyle(
  anchor: Point,
  angle = 0,
  ragdollState: RagdollVisualState = "settled",
  viewport = viewportSize()
): CSSProperties {
  const clampedAnchor = clampFullBodyAnchor(anchor, angle, playAreaBounds(viewport));
  const scale = fullBodyVisualScale(viewport);
  const inlineNudge = fullBodyVisualInlineNudge(viewport);

  return {
    height: FULL_BODY_DISPLAY_HEIGHT,
    opacity: fullBodyOpacity(ragdollState),
    transform: `translate3d(${clampedAnchor.x - FULL_BODY_DISPLAY_WIDTH / 2 + inlineNudge}px, ${
      clampedAnchor.y + characterBounds.minY
    }px, 0) rotate(${angle}rad) scale(${scale})`,
    transformOrigin: scale === 1 ? "center center" : "center bottom",
    width: FULL_BODY_DISPLAY_WIDTH
  };
}

function grabTargetStyle(anchor: Point): CSSProperties {
  return {
    height: 96,
    transform: `translate3d(${anchor.x - 48}px, ${anchor.y - 72}px, 0)`,
    width: 96
  };
}

function bubbleStyle(anchor: Point, viewport = viewportSize()): CSSProperties {
  const bounds = playAreaBounds(viewport);
  const x = clampToViewportRange(anchor.x - 88, bounds.minX + 12, bounds.maxX - 192);
  const y = clampToViewportRange(anchor.y - 138, 12, bounds.maxY - 80);

  return {
    transform: `translate3d(${x}px, ${y}px, 0)`
  };
}

function createWalls(bounds: PlayAreaBounds) {
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  return [
    Matter.Bodies.rectangle(
      centerX,
      bounds.minY - WALL_THICKNESS / 2,
      bounds.width + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      centerX,
      bounds.maxY + WALL_THICKNESS / 2,
      bounds.width + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      bounds.minX - WALL_THICKNESS / 2,
      centerY,
      WALL_THICKNESS,
      bounds.height + WALL_THICKNESS * 2,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      bounds.maxX + WALL_THICKNESS / 2,
      centerY,
      WALL_THICKNESS,
      bounds.height + WALL_THICKNESS * 2,
      { isStatic: true }
    )
  ];
}

function bodyOptions() {
  return {
    density: 0.001,
    friction: 0.3,
    frictionAir: 0.035,
    restitution: 0.74
  };
}

function createBodies(anchor: Point): Record<PartKey, Matter.Body> {
  const options = bodyOptions();

  const bodies = Object.fromEntries(
    partConfigs.map((part) => {
      const position = positionForPart(anchor, part);
      const body =
        part.key === "head"
          ? Matter.Bodies.circle(position.x, position.y, part.width / 2, options)
          : Matter.Bodies.rectangle(
              position.x,
              position.y,
              part.width,
              part.height,
              {
                ...options,
                chamfer: { radius: part.key === "torso" ? 14 : 8 }
              }
            );

      return [part.key, body];
    })
  ) as Record<PartKey, Matter.Body>;

  Matter.Body.rotate(bodies.leftArm, -0.38);
  Matter.Body.rotate(bodies.rightArm, 0.38);
  Matter.Body.rotate(bodies.leftLeg, 0.16);
  Matter.Body.rotate(bodies.rightLeg, -0.16);

  return bodies;
}

function joint(
  bodyA: Matter.Body,
  pointA: Point,
  bodyB: Matter.Body,
  pointB: Point,
  length: number
) {
  return Matter.Constraint.create({
    bodyA,
    bodyB,
    damping: 0.18,
    length,
    pointA,
    pointB,
    stiffness: 0.22
  });
}

function createRagdoll(anchor: Point, width: number, height: number): PhysicsWorld {
  const engine = Matter.Engine.create({ enableSleeping: false });
  engine.gravity.y = 0.82 * PHYSICS_SPEED_MULTIPLIER;

  const bodies = createBodies(anchor);
  const head = partConfigByKey.head;
  const torso = partConfigByKey.torso;
  const arm = partConfigByKey.leftArm;
  const leg = partConfigByKey.leftLeg;
  const constraints = [
    joint(
      bodies.torso,
      { x: 0, y: -torso.height / 2 },
      bodies.head,
      { x: 0, y: head.height / 2 },
      2
    ),
    joint(
      bodies.torso,
      { x: -torso.width / 2, y: -torso.height / 3 },
      bodies.leftArm,
      { x: 0, y: -arm.height / 2 + 3 },
      8
    ),
    joint(
      bodies.torso,
      { x: torso.width / 2, y: -torso.height / 3 },
      bodies.rightArm,
      { x: 0, y: -arm.height / 2 + 3 },
      8
    ),
    joint(
      bodies.torso,
      { x: -torso.width / 4, y: torso.height / 2 - 2 },
      bodies.leftLeg,
      { x: 0, y: -leg.height / 2 + 2 },
      4
    ),
    joint(
      bodies.torso,
      { x: torso.width / 4, y: torso.height / 2 - 2 },
      bodies.rightLeg,
      { x: 0, y: -leg.height / 2 + 2 },
      4
    )
  ];
  const walls = createWalls(playAreaBounds({ height, width }));

  Matter.Composite.add(engine.world, [
    ...Object.values(bodies),
    ...constraints,
    ...walls
  ]);

  return {
    bodies,
    engine,
    runner: Matter.Runner.create(),
    walls
  };
}

function syncBodyToElement(
  body: Matter.Body,
  element: HTMLElement,
  part: PartConfig,
  ragdollState: RagdollVisualState
) {
  element.style.height = `${part.height}px`;
  element.style.opacity = isRagdollPartVisible(ragdollState) ? "1" : "0";
  element.style.transform = `translate3d(${body.position.x - part.width / 2}px, ${
    body.position.y - part.height / 2
  }px, 0) rotate(${body.angle}rad)`;
  element.style.width = `${part.width}px`;
}

function syncGrabTarget(element: HTMLElement | null, anchor: Point) {
  if (!element) {
    return;
  }

  element.style.height = "96px";
  element.style.transform = `translate3d(${anchor.x - 48}px, ${
    anchor.y - 72
  }px, 0)`;
  element.style.width = "96px";
}

function syncChatBubble(element: HTMLElement | null, anchor: Point) {
  if (!element) {
    return;
  }

  element.style.transform = bubbleStyle(anchor).transform as string;
}

function syncFullBodySprite(
  element: HTMLElement | null,
  anchor: Point,
  angle = 0,
  ragdollState: RagdollVisualState = "settled"
) {
  if (!element) {
    return;
  }

  const style = fullBodySpriteStyle(anchor, angle, ragdollState);
  element.style.height = `${style.height}px`;
  element.style.opacity = `${style.opacity}`;
  element.style.transform = style.transform as string;
  element.style.transformOrigin = style.transformOrigin as string;
  element.style.width = `${style.width}px`;
}

function visualHalfExtents(part: PartConfig, angle: number) {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  return {
    x: (part.width * cos + part.height * sin) / 2,
    y: (part.width * sin + part.height * cos) / 2
  };
}

function containBodyInPlayArea(
  body: Matter.Body,
  part: PartConfig,
  bounds: PlayAreaBounds
) {
  const halfExtents = visualHalfExtents(part, body.angle);
  const nextPosition = {
    x: clampToViewportRange(
      body.position.x,
      bounds.minX + halfExtents.x + VIEWPORT_PADDING,
      bounds.maxX - halfExtents.x - VIEWPORT_PADDING
    ),
    y: clampToViewportRange(
      body.position.y,
      bounds.minY + halfExtents.y + VIEWPORT_PADDING,
      bounds.maxY - halfExtents.y - VIEWPORT_PADDING
    )
  };

  const clampedX = nextPosition.x !== body.position.x;
  const clampedY = nextPosition.y !== body.position.y;

  if (!clampedX && !clampedY) {
    return;
  }

  Matter.Body.setPosition(body, nextPosition);
  Matter.Body.setVelocity(body, {
    x: clampedX ? 0 : body.velocity.x,
    y: clampedY ? 0 : body.velocity.y
  });
}

function containBodiesInPlayArea(
  bodies: Record<PartKey, Matter.Body>,
  bounds = playAreaBounds()
) {
  partConfigs.forEach((part) => {
    containBodyInPlayArea(bodies[part.key], part, bounds);
  });
}

function clampVelocity(value: number) {
  return clamp(value, -26 * PHYSICS_SPEED_MULTIPLIER, 26 * PHYSICS_SPEED_MULTIPLIER);
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointFromClient(
  input: {
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
    screenX?: number;
    screenY?: number;
  },
  fallback?: Point
): Point | null {
  const x = firstFiniteCoordinate(input.clientX, input.pageX, input.screenX);
  const y = firstFiniteCoordinate(input.clientY, input.pageY, input.screenY);

  if (x === undefined || y === undefined) {
    return fallback ?? null;
  }

  return { x, y };
}

function roundedGaze(value: number) {
  return Math.round(value * 100) / 100;
}

function gazeStateForTarget(target: Point, focus: Point): GazeState {
  const deltaX = target.x - focus.x;
  const deltaY = target.y - focus.y;
  const distance = Math.max(Math.hypot(deltaX, deltaY), 1);
  const x = roundedGaze(clamp(deltaX / distance, -1, 1));
  const y = roundedGaze(clamp(deltaY / distance, -0.8, 0.8));

  return {
    direction: x < -0.15 ? "left" : x > 0.15 ? "right" : "center",
    x,
    y
  };
}

function sameGazeState(a: GazeState, b: GazeState) {
  return a.direction === b.direction && a.x === b.x && a.y === b.y;
}

function releaseShouldShowBubble(drag: DragState, releasePoint: Point) {
  const releaseDistance = Math.max(
    drag.maxDistance,
    distanceBetween(drag.startPoint, releasePoint)
  );
  const releaseSpeed = Math.hypot(drag.velocity.x, drag.velocity.y);

  return (
    releaseDistance >= BUBBLE_DRAG_DISTANCE_THRESHOLD ||
    releaseSpeed >= BUBBLE_RELEASE_SPEED_THRESHOLD
  );
}

function setBodyPose(body: Matter.Body, position: Point, angle: number) {
  Matter.Body.setPosition(body, position);
  Matter.Body.setAngle(body, angle);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(body, 0);
}

function canWalkDistance(
  anchorX: number,
  direction: WalkDirection,
  range: Pick<ReturnType<typeof anchorRange>, "maxX" | "minX">,
  distance: number
) {
  return direction === -1
    ? anchorX - range.minX >= distance
    : range.maxX - anchorX >= distance;
}

export function nextIdleWalkTurn(
  current: IdleWalkTurn,
  anchorX: number,
  bounds = playAreaBounds(),
  random = Math.random
): IdleWalkTurn {
  const range = anchorRange(bounds);
  const minimumDistance = Math.max(bounds.width * MIN_IDLE_WALK_TURN_FRACTION, 1);
  let direction = current.direction;
  let turnsInDirection = current.turnsInDirection + 1;

  if (current.turnsInDirection >= MIN_IDLE_TURNS_BEFORE_DIRECTION_CHANGE) {
    const canMoveLeft = canWalkDistance(anchorX, -1, range, minimumDistance);
    const canMoveRight = canWalkDistance(anchorX, 1, range, minimumDistance);

    if (canMoveLeft && canMoveRight) {
      direction = random() < 0.5 ? -1 : 1;
    } else if (canMoveLeft) {
      direction = -1;
    } else if (canMoveRight) {
      direction = 1;
    }

    turnsInDirection =
      direction === current.direction ? current.turnsInDirection + 1 : 1;
  } else if (!canWalkDistance(anchorX, direction, range, minimumDistance)) {
    const oppositeDirection = (direction * -1) as WalkDirection;

    if (canWalkDistance(anchorX, oppositeDirection, range, minimumDistance)) {
      direction = oppositeDirection;
      turnsInDirection = 1;
    }
  }

  return {
    direction,
    targetX: clampToViewportRange(
      anchorX + direction * minimumDistance,
      range.minX,
      range.maxX
    ),
    turnsInDirection
  };
}

export function clampIdleWalkTurnToBounds(
  current: IdleWalkTurn,
  bounds = playAreaBounds()
): IdleWalkTurn {
  const range = anchorRange(bounds);

  return {
    ...current,
    targetX: clampToViewportRange(current.targetX, range.minX, range.maxX)
  };
}

function initialIdleWalkTurn(anchorX: number, bounds = playAreaBounds()): IdleWalkTurn {
  const range = anchorRange(bounds);
  const direction = anchorX >= (range.minX + range.maxX) / 2 ? -1 : 1;

  return {
    direction,
    targetX: anchorX,
    turnsInDirection: 0
  };
}

function setIdlePose(
  physics: PhysicsWorld,
  state: IdleState,
  walkTurn: IdleWalkTurn,
  viewport = viewportSize()
) {
  const torso = physics.bodies.torso;
  const bounds = playAreaBounds(viewport);
  const deltaX = walkTurn.targetX - torso.position.x;
  const step = clamp(deltaX, -IDLE_WALK_STEP_PX, IDLE_WALK_STEP_PX);
  const anchor = clampAnchor({
    x: torso.position.x + (state === "walking" ? step : 0),
    y: viewport.height - characterBounds.maxY - VIEWPORT_PADDING
  }, bounds);
  const reachedTarget =
    state === "walking" && Math.abs(walkTurn.targetX - anchor.x) <= IDLE_WALK_STEP_PX;
  const sway = state === "walking" ? Math.sin(Date.now() / 420) * 0.12 : 0;
  const armAngle = state === "walking" ? 0.14 : 0.1;
  const legAngle = state === "walking" ? 0.08 : 0.025;

  setBodyPose(
    physics.bodies.torso,
    positionForPart(anchor, partConfigByKey.torso),
    0
  );
  setBodyPose(physics.bodies.head, positionForPart(anchor, partConfigByKey.head), 0);
  setBodyPose(
    physics.bodies.leftArm,
    positionForPart(anchor, partConfigByKey.leftArm),
    -armAngle
  );
  setBodyPose(
    physics.bodies.rightArm,
    positionForPart(anchor, partConfigByKey.rightArm),
    armAngle
  );
  setBodyPose(
    physics.bodies.leftLeg,
    positionForPart(anchor, partConfigByKey.leftLeg),
    legAngle + sway
  );
  setBodyPose(
    physics.bodies.rightLeg,
    positionForPart(anchor, partConfigByKey.rightLeg),
    -legAngle - sway
  );

  return reachedTarget;
}

export function LittleAlexPhysics({
  chatPhrase = DEFAULT_CHAT_PHRASE,
  genderPresentation = DEFAULT_GENDER_PRESENTATION,
  skinTone = DEFAULT_SKIN_TONE
}: LittleAlexPhysicsProps) {
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedAnchor, setReducedAnchor] = useState(SERVER_SAFE_ANCHOR);
  const [idleState, setIdleState] = useState<IdleState>("active");
  const [idleStandDelayMs, setIdleStandDelayMs] = useState(IDLE_STAND_DELAY_MS);
  const [activityVersion, setActivityVersion] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [gaze, setGaze] = useState<GazeState>(DEFAULT_GAZE_STATE);
  const [ragdollVisualState, setRagdollVisualState] =
    useState<RagdollVisualState>("settled");
  const fullBodyStyle = fullBodySpriteStyle(
    reducedAnchor,
    0,
    ragdollVisualState,
    motionPreferenceReady ? viewportSize() : { height: 768, width: 1024 }
  );
  const bodyRefs = useRef<Partial<Record<PartKey, HTMLDivElement>>>({});
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimeoutRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const fullBodySpriteRef = useRef<HTMLImageElement | null>(null);
  const grabTargetRef = useRef<HTMLDivElement | null>(null);
  const idleDirectionRef = useRef(1);
  const idleTargetReachedRef = useRef(false);
  const idleStateRef = useRef<IdleState>("active");
  const idleWalkTurnRef = useRef<IdleWalkTurn>({
    direction: -1,
    targetX: SERVER_SAFE_ANCHOR.x,
    turnsInDirection: 0
  });
  const physicsRef = useRef<PhysicsWorld | null>(null);
  const ragdollRecoveryTimeoutRef = useRef<number | null>(null);
  const ragdollVisualStateRef = useRef<RagdollVisualState>("settled");

  useEffect(() => {
    idleStateRef.current = idleState;
  }, [idleState]);

  useEffect(() => {
    ragdollVisualStateRef.current = ragdollVisualState;
  }, [ragdollVisualState]);

  const clearRagdollRecoveryTimeout = useCallback(() => {
    if (!ragdollRecoveryTimeoutRef.current) {
      return;
    }

    window.clearTimeout(ragdollRecoveryTimeoutRef.current);
    ragdollRecoveryTimeoutRef.current = null;
  }, []);

  const syncRagdollVisibility = useCallback((state: RagdollVisualState) => {
    partConfigs.forEach((part) => {
      const element = bodyRefs.current[part.key];

      if (element) {
        element.style.opacity = isRagdollPartVisible(state) ? "1" : "0";
      }
    });
    if (fullBodySpriteRef.current) {
      fullBodySpriteRef.current.style.opacity = `${fullBodyOpacity(state)}`;
    }
  }, []);

  const setRagdollVisualStateNow = useCallback(
    (next: RagdollVisualState) => {
      ragdollVisualStateRef.current = next;
      syncRagdollVisibility(next);
      setRagdollVisualState(next);
    },
    [syncRagdollVisibility]
  );

  const beginRagdollRecovery = useCallback(() => {
    setRagdollVisualStateNow("recovering");
    clearRagdollRecoveryTimeout();
    ragdollRecoveryTimeoutRef.current = window.setTimeout(() => {
      setRagdollVisualStateNow("settled");
      ragdollRecoveryTimeoutRef.current = null;
    }, RAGDOLL_RECOVERY_TRANSITION_MS);
  }, [clearRagdollRecoveryTimeout, setRagdollVisualStateNow]);

  const updateGaze = useCallback(
    (target: Point) => {
      if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        return;
      }

      const focus = physicsRef.current?.bodies.head.position ?? {
        x: reducedAnchor.x,
        y: reducedAnchor.y + partConfigByKey.head.offset.y
      };
      const nextGaze = gazeStateForTarget(target, focus);

      setGaze((current) => (sameGazeState(current, nextGaze) ? current : nextGaze));
    },
    [reducedAnchor]
  );

  const syncPhysicsDom = useCallback(() => {
    const physics = physicsRef.current;

    if (!physics) {
      return;
    }

    if (idleStateRef.current !== "active") {
      const reachedTarget = setIdlePose(
        physics,
        idleStateRef.current,
        idleWalkTurnRef.current
      );

      if (reachedTarget && !idleTargetReachedRef.current) {
        idleTargetReachedRef.current = true;
        setIdleState("standing");
      }
    }
    containBodiesInPlayArea(physics.bodies);
    const ragdollState = ragdollVisualStateRef.current;
    partConfigs.forEach((part) => {
      const element = bodyRefs.current[part.key];

      if (element) {
        syncBodyToElement(physics.bodies[part.key], element, part, ragdollState);
      }
    });
    syncFullBodySprite(
      fullBodySpriteRef.current,
      physics.bodies.torso.position,
      physics.bodies.torso.angle,
      ragdollState
    );
    syncGrabTarget(grabTargetRef.current, physics.bodies.torso.position);
    syncChatBubble(bubbleRef.current, physics.bodies.head.position);
  }, []);

  useEffect(() => {
    const anchor = initialAnchor();

    idleWalkTurnRef.current = initialIdleWalkTurn(anchor.x);
    setReducedAnchor(anchor);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setMotionPreferenceReady(true);
      return undefined;
    }

    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const updateReducedMotion = () => {
      setReducedMotion(media.matches);
      setMotionPreferenceReady(true);
    };

    updateReducedMotion();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateReducedMotion);

      return () => {
        media.removeEventListener("change", updateReducedMotion);
      };
    }

    media.addListener(updateReducedMotion);

    return () => {
      media.removeListener(updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (!motionPreferenceReady || !reducedMotion) {
      return undefined;
    }

    const handleResize = () => {
      setReducedAnchor((current) => clampAnchor(current));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [motionPreferenceReady, reducedMotion]);

  useEffect(() => {
    if (!motionPreferenceReady || reducedMotion) {
      setIdleState("active");
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      if (ragdollVisualStateRef.current === "flinging") {
        beginRagdollRecovery();
      }
      setIdleState("standing");
    }, idleStandDelayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activityVersion,
    beginRagdollRecovery,
    idleStandDelayMs,
    motionPreferenceReady,
    reducedMotion
  ]);

  useEffect(() => {
    if (!motionPreferenceReady || reducedMotion) {
      return undefined;
    }

    if (idleState === "standing") {
      const walkTimeout = window.setTimeout(() => {
        const anchorX =
          physicsRef.current?.bodies.torso.position.x ?? reducedAnchor.x;

        idleTargetReachedRef.current = false;
        idleWalkTurnRef.current = nextIdleWalkTurn(
          idleWalkTurnRef.current,
          anchorX
        );
        setIdleState("walking");
      }, IDLE_STANDING_PAUSE_MS);

      return () => {
        window.clearTimeout(walkTimeout);
      };
    }

    return undefined;
  }, [idleState, motionPreferenceReady, reducedAnchor.x, reducedMotion]);

  useEffect(() => {
    if (idleState !== "active") {
      syncPhysicsDom();
    }
  }, [idleState, syncPhysicsDom]);

  useEffect(() => {
    if (
      idleState === "active" ||
      ragdollVisualStateRef.current !== "flinging"
    ) {
      return undefined;
    }

    beginRagdollRecovery();

    return undefined;
  }, [beginRagdollRecovery, idleState]);

  useEffect(() => {
    syncPhysicsDom();
  }, [ragdollVisualState, syncPhysicsDom]);

  useEffect(() => {
    if (!motionPreferenceReady) {
      return undefined;
    }

    const trackPoint = (point: Point) => {
      const torso = physicsRef.current?.bodies.torso.position ?? reducedAnchor;
      idleDirectionRef.current = point.x >= torso.x ? 1 : -1;
      updateGaze(point);
    };
    const trackPointer = (event: MouseEvent | PointerEvent) => {
      const point = pointFromClient(event);

      if (point) {
        trackPoint(point);
      }
    };
    const trackTouch = (event: TouchEvent) => {
      const touch = event.changedTouches[0] ?? event.touches[0];

      if (!touch) {
        return;
      }

      const point = pointFromClient(touch);

      if (!point) {
        return;
      }

      trackPoint(point);
    };

    window.addEventListener("mousemove", trackPointer);
    window.addEventListener("pointerdown", trackPointer);
    window.addEventListener("pointermove", trackPointer);
    window.addEventListener("touchstart", trackTouch, { passive: true });
    window.addEventListener("touchmove", trackTouch, { passive: true });

    return () => {
      window.removeEventListener("mousemove", trackPointer);
      window.removeEventListener("pointerdown", trackPointer);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("touchstart", trackTouch);
      window.removeEventListener("touchmove", trackTouch);
    };
  }, [motionPreferenceReady, reducedAnchor, updateGaze]);

  useEffect(() => {
    if (bubbleVisible) {
      syncPhysicsDom();
    }
  }, [bubbleVisible, syncPhysicsDom]);

  const showChatBubble = useCallback(() => {
    setBubbleVisible(true);
    if (bubbleTimeoutRef.current) {
      window.clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = window.setTimeout(() => {
      setBubbleVisible(false);
    }, 2_800);
  }, []);

  const beginDrag = useCallback(
    (point: Point, pointerId: number, timeStamp: number) => {
      clearRagdollRecoveryTimeout();
      setRagdollVisualStateNow(reducedMotion ? "settled" : "dragging");
      setIdleState("active");
      setIdleStandDelayMs(IDLE_STAND_DELAY_MS);
      setActivityVersion((current) => current + 1);
      idleTargetReachedRef.current = false;
      updateGaze(point);

      const center = reducedMotion
        ? reducedAnchor
        : physicsRef.current?.bodies.torso.position ?? reducedAnchor;

      dragRef.current = {
        lastPoint: point,
        lastTime: Number.isFinite(timeStamp) ? timeStamp : 0,
        maxDistance: 0,
        offset: {
          x: point.x - center.x,
          y: point.y - center.y
        },
        pointerId,
        startPoint: point,
        velocity: { x: 0, y: 0 }
      };
    },
    [
      clearRagdollRecoveryTimeout,
      reducedAnchor,
      reducedMotion,
      setRagdollVisualStateNow,
      updateGaze
    ]
  );

  useEffect(() => {
    if (!motionPreferenceReady || reducedMotion) {
      return undefined;
    }

    const { height, width } = viewportSize();
    const physics = createRagdoll(clampAnchor(reducedAnchor), width, height);
    physicsRef.current = physics;

    const sync = () => {
      syncPhysicsDom();
    };
    const handleResize = () => {
      const nextSize = viewportSize();
      const nextBounds = playAreaBounds(nextSize);

      Matter.Composite.remove(physics.engine.world, physics.walls);
      physics.walls = createWalls(nextBounds);
      Matter.Composite.add(physics.engine.world, physics.walls);
      containBodiesInPlayArea(physics.bodies, nextBounds);
      idleWalkTurnRef.current = clampIdleWalkTurnToBounds(
        idleWalkTurnRef.current,
        nextBounds
      );
      sync();
    };

    Matter.Events.on(physics.engine, "afterUpdate", sync);
    Matter.Runner.run(physics.runner, physics.engine);
    window.addEventListener("resize", handleResize);
    sync();

    return () => {
      window.removeEventListener("resize", handleResize);
      Matter.Events.off(physics.engine, "afterUpdate", sync);
      Matter.Runner.stop(physics.runner);
      Matter.Composite.clear(physics.engine.world, false);
      Matter.Engine.clear(physics.engine);
      if (physicsRef.current === physics) {
        physicsRef.current = null;
      }
    };
  }, [motionPreferenceReady, reducedAnchor, reducedMotion, syncPhysicsDom]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const point = pointFromClient(event);

      if (!point) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      beginDrag(point, event.pointerId, event.timeStamp);
    },
    [beginDrag]
  );

  const touchPointerId = useCallback((touch: ReactTouch) => {
    return TOUCH_DRAG_POINTER_ID_OFFSET + touch.identifier;
  }, []);

  const activeTouchFromEvent = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const activePointerId = dragRef.current?.pointerId;

    if (activePointerId !== undefined) {
      const activeIdentifier = activePointerId - TOUCH_DRAG_POINTER_ID_OFFSET;
      const changedTouch = Array.from(event.changedTouches).find(
        (touch) => touch.identifier === activeIdentifier
      );
      const currentTouch = Array.from(event.touches).find(
        (touch) => touch.identifier === activeIdentifier
      );

      return changedTouch ?? currentTouch ?? null;
    }

    return event.changedTouches[0] ?? event.touches[0] ?? null;
  }, []);

  const pointerInputFromTouch = useCallback(
    (
      touch: ReactTouch,
      event: ReactTouchEvent<HTMLDivElement>
    ): PointerInput => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      pointerId: touchPointerId(touch),
      preventDefault: () => event.preventDefault(),
      screenX: touch.screenX,
      screenY: touch.screenY,
      stopPropagation: () => event.stopPropagation(),
      timeStamp: event.timeStamp
    }),
    [touchPointerId]
  );

  const moveDrag = useCallback(
    (event: PointerInput) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const point = pointFromClient(event, drag.lastPoint);

      if (!point) {
        return;
      }

      updateGaze(point);

      const nextAnchor = clampAnchor({
        x: point.x - drag.offset.x,
        y: point.y - drag.offset.y
      });
      const eventTime = Number.isFinite(event.timeStamp)
        ? event.timeStamp
        : drag.lastTime + 16;
      const elapsed = Math.max(eventTime - drag.lastTime, 16);
      idleDirectionRef.current = point.x >= drag.lastPoint.x ? 1 : -1;
      drag.maxDistance = Math.max(
        drag.maxDistance,
        distanceBetween(drag.startPoint, point)
      );
      drag.velocity = {
        x: clampVelocity(((point.x - drag.lastPoint.x) / elapsed) * 16),
        y: clampVelocity(((point.y - drag.lastPoint.y) / elapsed) * 16)
      };
      drag.lastPoint = point;
      drag.lastTime = eventTime;

      if (reducedMotion) {
        setReducedAnchor(nextAnchor);
        return;
      }

      const physics = physicsRef.current;

      if (!physics) {
        return;
      }

      const torso = physics.bodies.torso;
      const translation = {
        x: nextAnchor.x - torso.position.x,
        y: nextAnchor.y - torso.position.y
      };

      Object.values(physics.bodies).forEach((body) => {
        Matter.Body.translate(body, translation);
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
      });
      containBodiesInPlayArea(physics.bodies);
      syncPhysicsDom();
    },
    [reducedMotion, syncPhysicsDom, updateGaze]
  );

  const releaseDrag = useCallback(
    (event: PointerInput, captureTarget?: HTMLElement | null) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const point = pointFromClient(event, drag.lastPoint);

      if (!point) {
        return;
      }

      updateGaze(point);
      dragRef.current = null;
      setIdleState("active");
      setIdleStandDelayMs(IDLE_RELEASE_STAND_DELAY_MS);
      setActivityVersion((current) => current + 1);
      idleTargetReachedRef.current = false;

      if (captureTarget?.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
      }

      const shouldShowBubble = releaseShouldShowBubble(drag, point);

      if (reducedMotion) {
        const releaseAnchor = clampAnchor({
          x: point.x - drag.offset.x,
          y: point.y - drag.offset.y
        });

        setRagdollVisualStateNow("settled");
        setReducedAnchor(releaseAnchor);
        idleWalkTurnRef.current = initialIdleWalkTurn(releaseAnchor.x);
        if (shouldShowBubble) {
          showChatBubble();
        }
        return;
      }

      const physics = physicsRef.current;

      if (!physics) {
        setRagdollVisualStateNow("settled");
        return;
      }

      setRagdollVisualStateNow(shouldShowBubble ? "flinging" : "settled");
      Object.entries(physics.bodies).forEach(([key, body]) => {
        const weight = key === "torso" ? 1 : 0.82;

        Matter.Body.setVelocity(body, {
          x: clampVelocity(drag.velocity.x * weight * PHYSICS_SPEED_MULTIPLIER),
          y: clampVelocity(drag.velocity.y * weight * PHYSICS_SPEED_MULTIPLIER)
        });
        Matter.Body.setAngularVelocity(
          body,
          clampVelocity(drag.velocity.x * PHYSICS_SPEED_MULTIPLIER) *
            (key === "head" ? 0.006 : 0.004)
        );
      });
      syncPhysicsDom();
      idleWalkTurnRef.current = initialIdleWalkTurn(physics.bodies.torso.position.x);
      if (shouldShowBubble) {
        showChatBubble();
      }
    },
    [reducedMotion, setRagdollVisualStateNow, showChatBubble, syncPhysicsDom, updateGaze]
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (dragRef.current) {
        return;
      }

      const touch = activeTouchFromEvent(event);

      if (!touch) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const point = pointFromClient(touch);

      if (!point) {
        return;
      }

      beginDrag(point, touchPointerId(touch), event.timeStamp);
    },
    [activeTouchFromEvent, beginDrag, touchPointerId]
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const touch = activeTouchFromEvent(event);

      if (!touch) {
        return;
      }

      moveDrag(pointerInputFromTouch(touch, event));
    },
    [activeTouchFromEvent, moveDrag, pointerInputFromTouch]
  );

  const handleTouchRelease = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const touch = activeTouchFromEvent(event);

      if (!touch) {
        return;
      }

      releaseDrag(pointerInputFromTouch(touch, event));
    },
    [activeTouchFromEvent, pointerInputFromTouch, releaseDrag]
  );

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      moveDrag(event);
    };
    const handleWindowPointerRelease = (event: PointerEvent) => {
      releaseDrag(event, grabTargetRef.current);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerRelease);
    window.addEventListener("pointercancel", handleWindowPointerRelease);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerRelease);
      window.removeEventListener("pointercancel", handleWindowPointerRelease);
    };
  }, [moveDrag, releaseDrag]);

  useEffect(
    () => () => {
      if (bubbleTimeoutRef.current) {
        window.clearTimeout(bubbleTimeoutRef.current);
      }
      clearRagdollRecoveryTimeout();
    },
    [clearRagdollRecoveryTimeout]
  );

  return (
    <div
      aria-hidden="true"
      className={[
        "fp-little-alex-shell",
        `fp-little-alex-presentation-${genderPresentation}`
      ].join(" ")}
      data-chat-phrase={chatPhrase}
      data-appearance-head={appearanceDetails[genderPresentation].head}
      data-appearance-silhouette={
        appearanceDetails[genderPresentation].silhouette
      }
      data-gender-presentation={genderPresentation}
      data-gaze-direction={gaze.direction}
      data-idle-state={
        motionPreferenceReady && reducedMotion ? "static" : idleState
      }
      data-motion-mode={
        motionPreferenceReady && reducedMotion ? "reduced" : "physics"
      }
      data-physics-engine="matter-js"
      data-idle-walk-direction={idleWalkTurnRef.current.direction}
      data-idle-walk-target-x={Math.round(idleWalkTurnRef.current.targetX)}
      data-idle-walk-turns={idleWalkTurnRef.current.turnsInDirection}
      data-ragdoll-state={ragdollVisualState}
      data-testid="little-alex-horne"
      style={
        {
          "--little-alex-gaze-x": gaze.x.toString(),
          "--little-alex-gaze-y": gaze.y.toString(),
          "--little-alex-skin": LITTLE_ALEX_SKIN_TONE_COLORS[skinTone],
          pointerEvents: "none"
        } as CSSProperties
      }
    >
      {bubbleVisible ? (
        <div
          className="fp-little-alex-chat-bubble"
          data-testid="little-alex-chat-bubble"
          ref={bubbleRef}
          style={bubbleStyle(reducedAnchor)}
        >
          {chatPhrase}
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- The coherent Qwen character follows Matter.js bodies directly. */}
      <img
        alt=""
        className="fp-little-alex-full-sprite"
        data-full-sprite-src={littleAlexFullBodySpritePath(
          genderPresentation,
          skinTone
        )}
        data-sprite-hair={appearanceDetails[genderPresentation].hair}
        data-testid="little-alex-full-sprite"
        draggable={false}
        ref={fullBodySpriteRef}
        src={littleAlexFullBodySpritePath(genderPresentation, skinTone)}
        style={fullBodyStyle}
      />
      {partConfigs.map((part) => (
        <div
          className={`fp-little-alex-part ${part.className}`}
          data-part={part.key}
          data-testid="little-alex-body-part"
          key={part.key}
          ref={(element) => {
            if (element) {
              bodyRefs.current[part.key] = element;
            } else {
              delete bodyRefs.current[part.key];
            }
          }}
          style={reducedPartStyle(part, reducedAnchor)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Limb sprites are tightly coupled to the Matter.js rig. */}
          <img
            alt=""
            className="fp-little-alex-sprite"
            data-part={part.key}
            data-testid="little-alex-sprite"
            draggable={false}
            src={littleAlexPartSpritePath(genderPresentation, skinTone, part.key)}
          />
        </div>
      ))}
      <div
        className="fp-little-alex-grab-target"
        data-testid="little-alex-grab-target"
        onPointerDown={handlePointerDown}
        onTouchCancel={handleTouchRelease}
        onTouchEnd={handleTouchRelease}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={grabTargetRef}
        style={{
          ...grabTargetStyle(reducedAnchor),
          pointerEvents: "auto"
        }}
      />
    </div>
  );
}
