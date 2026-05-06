"use client";

import Matter from "matter-js";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  LittleAlexGenderPresentation,
  LittleAlexSkinTone
} from "@/contracts/preferences";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_CHAT_PHRASE = "i'm little alex horne";
const DEFAULT_GENDER_PRESENTATION: LittleAlexGenderPresentation = "neutral";
const DEFAULT_SKIN_TONE: LittleAlexSkinTone = "tone_2";
const PHYSICS_SPEED_MULTIPLIER = 1.1;
const IDLE_DELAY_MS = 5_000;
const IDLE_PAUSE_MS = 900;
const BUBBLE_DRAG_DISTANCE_THRESHOLD = 14;
const BUBBLE_RELEASE_SPEED_THRESHOLD = 6;
const WALL_THICKNESS = 96;
const VIEWPORT_PADDING = 2;
const SERVER_SAFE_ANCHOR = { x: 906, y: 218 };

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

type DragState = {
  lastPoint: Point;
  lastTime: number;
  maxDistance: number;
  offset: Point;
  pointerId: number;
  startPoint: Point;
  velocity: Point;
};

type GazeDirection = "center" | "left" | "right";

type GazeState = {
  direction: GazeDirection;
  x: number;
  y: number;
};

type IdleState = "active" | "walking" | "paused";

type PointerInput = {
  clientX: number;
  clientY: number;
  pointerId: number;
  preventDefault: () => void;
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

const skinToneCssValues: Record<LittleAlexSkinTone, string> = {
  tone_1: "#f3c7a6",
  tone_2: "#d8a078",
  tone_3: "#c18463",
  tone_4: "#b7795f",
  tone_5: "#8f5f45"
};

const partConfigs: PartConfig[] = [
  {
    className: "fp-little-alex-head",
    height: 44,
    key: "head",
    offset: { x: 0, y: -62 },
    width: 44
  },
  {
    className: "fp-little-alex-torso",
    height: 64,
    key: "torso",
    offset: { x: 0, y: 0 },
    width: 50
  },
  {
    className: "fp-little-alex-arm fp-little-alex-arm-left",
    height: 58,
    key: "leftArm",
    offset: { x: -42, y: -4 },
    width: 18
  },
  {
    className: "fp-little-alex-arm fp-little-alex-arm-right",
    height: 58,
    key: "rightArm",
    offset: { x: 42, y: -4 },
    width: 18
  },
  {
    className: "fp-little-alex-leg fp-little-alex-leg-left",
    height: 62,
    key: "leftLeg",
    offset: { x: -18, y: 62 },
    width: 20
  },
  {
    className: "fp-little-alex-leg fp-little-alex-leg-right",
    height: 62,
    key: "rightLeg",
    offset: { x: 18, y: 62 },
    width: 20
  }
];

const DEFAULT_GAZE_STATE: GazeState = {
  direction: "center",
  x: 0,
  y: 0
};

const characterBounds = partConfigs.reduce(
  (bounds, part) => ({
    maxX: Math.max(bounds.maxX, part.offset.x + part.width / 2),
    maxY: Math.max(bounds.maxY, part.offset.y + part.height / 2),
    minX: Math.min(bounds.minX, part.offset.x - part.width / 2),
    minY: Math.min(bounds.minY, part.offset.y - part.height / 2)
  }),
  { maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity }
);

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

function clampAnchor(anchor: Point) {
  const { height, width } = viewportSize();
  const minX = -characterBounds.minX + VIEWPORT_PADDING;
  const maxX = width - characterBounds.maxX - VIEWPORT_PADDING;
  const minY = -characterBounds.minY + VIEWPORT_PADDING;
  const maxY = height - characterBounds.maxY - VIEWPORT_PADDING;

  return {
    x: clampToViewportRange(anchor.x, minX, maxX),
    y: clampToViewportRange(anchor.y, minY, maxY)
  };
}

function initialAnchor() {
  const { height, width } = viewportSize();

  return clampAnchor({
    x: width - 118,
    y: Math.min(218, height - 140)
  });
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
  return partStyle(part, {
    x: anchor.x + part.offset.x,
    y: anchor.y + part.offset.y
  });
}

function grabTargetStyle(anchor: Point): CSSProperties {
  return {
    height: 96,
    transform: `translate3d(${anchor.x - 48}px, ${anchor.y - 72}px, 0)`,
    width: 96
  };
}

function bubbleStyle(anchor: Point, viewport = viewportSize()): CSSProperties {
  const x = clampToViewportRange(anchor.x - 88, 12, viewport.width - 192);
  const y = clampToViewportRange(anchor.y - 138, 12, viewport.height - 80);

  return {
    transform: `translate3d(${x}px, ${y}px, 0)`
  };
}

function createWalls(width: number, height: number) {
  return [
    Matter.Bodies.rectangle(
      width / 2,
      -WALL_THICKNESS / 2,
      width + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      width / 2,
      height + WALL_THICKNESS / 2,
      width + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      -WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height + WALL_THICKNESS * 2,
      { isStatic: true }
    ),
    Matter.Bodies.rectangle(
      width + WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height + WALL_THICKNESS * 2,
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

  const bodies = {
    head: Matter.Bodies.circle(anchor.x, anchor.y - 62, 22, options),
    leftArm: Matter.Bodies.rectangle(anchor.x - 42, anchor.y - 4, 18, 58, {
      ...options,
      chamfer: { radius: 8 }
    }),
    leftLeg: Matter.Bodies.rectangle(anchor.x - 18, anchor.y + 62, 20, 62, {
      ...options,
      chamfer: { radius: 8 }
    }),
    rightArm: Matter.Bodies.rectangle(anchor.x + 42, anchor.y - 4, 18, 58, {
      ...options,
      chamfer: { radius: 8 }
    }),
    rightLeg: Matter.Bodies.rectangle(anchor.x + 18, anchor.y + 62, 20, 62, {
      ...options,
      chamfer: { radius: 8 }
    }),
    torso: Matter.Bodies.rectangle(anchor.x, anchor.y, 50, 64, {
      ...options,
      chamfer: { radius: 14 }
    })
  };

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
  const constraints = [
    joint(bodies.torso, { x: 0, y: -32 }, bodies.head, { x: 0, y: 22 }, 12),
    joint(bodies.torso, { x: -26, y: -22 }, bodies.leftArm, { x: 0, y: -24 }, 12),
    joint(bodies.torso, { x: 26, y: -22 }, bodies.rightArm, { x: 0, y: -24 }, 12),
    joint(bodies.torso, { x: -15, y: 32 }, bodies.leftLeg, { x: 0, y: -28 }, 12),
    joint(bodies.torso, { x: 15, y: 32 }, bodies.rightLeg, { x: 0, y: -28 }, 12)
  ];
  const walls = createWalls(width, height);

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

function syncBodyToElement(body: Matter.Body, element: HTMLElement, part: PartConfig) {
  element.style.height = `${part.height}px`;
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

function visualHalfExtents(part: PartConfig, angle: number) {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  return {
    x: (part.width * cos + part.height * sin) / 2,
    y: (part.width * sin + part.height * cos) / 2
  };
}

function containBodyInViewport(
  body: Matter.Body,
  part: PartConfig,
  viewport: { height: number; width: number }
) {
  const halfExtents = visualHalfExtents(part, body.angle);
  const nextPosition = {
    x: clampToViewportRange(
      body.position.x,
      halfExtents.x + VIEWPORT_PADDING,
      viewport.width - halfExtents.x - VIEWPORT_PADDING
    ),
    y: clampToViewportRange(
      body.position.y,
      halfExtents.y + VIEWPORT_PADDING,
      viewport.height - halfExtents.y - VIEWPORT_PADDING
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

function containBodiesInViewport(
  bodies: Record<PartKey, Matter.Body>,
  viewport = viewportSize()
) {
  partConfigs.forEach((part) => {
    containBodyInViewport(bodies[part.key], part, viewport);
  });
}

function clampVelocity(value: number) {
  return clamp(value, -26 * PHYSICS_SPEED_MULTIPLIER, 26 * PHYSICS_SPEED_MULTIPLIER);
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointFromClient(
  input: { clientX?: number; clientY?: number },
  fallback?: Point
) {
  const x = Number(input.clientX);
  const y = Number(input.clientY);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
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

function partContent(part: PartKey) {
  if (part === "head") {
    return (
      <>
        <span className="fp-little-alex-hair" />
        <span className="fp-little-alex-eye fp-little-alex-eye-left" />
        <span className="fp-little-alex-eye fp-little-alex-eye-right" />
        <span className="fp-little-alex-mouth" />
      </>
    );
  }

  if (part === "torso") {
    return (
      <>
        <span className="fp-little-alex-shirt" data-testid="little-alex-shirt" />
        <span className="fp-little-alex-bowtie" />
        <span
          className="fp-little-alex-clipboard"
          data-testid="little-alex-clipboard"
        />
      </>
    );
  }

  if (part === "leftLeg" || part === "rightLeg") {
    return <span className="fp-little-alex-shoe" />;
  }

  return null;
}

function setBodyPose(body: Matter.Body, position: Point, angle: number) {
  Matter.Body.setPosition(body, position);
  Matter.Body.setAngle(body, angle);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(body, 0);
}

function setIdlePose(
  physics: PhysicsWorld,
  state: IdleState,
  direction: number,
  viewport = viewportSize()
) {
  const torso = physics.bodies.torso;
  const step = state === "walking" ? direction * 0.22 : 0;
  const anchor = clampAnchor({
    x: torso.position.x + step,
    y: viewport.height - characterBounds.maxY - VIEWPORT_PADDING
  });
  const sway = state === "walking" ? Math.sin(Date.now() / 420) * 0.18 : 0;

  setBodyPose(physics.bodies.torso, anchor, 0);
  setBodyPose(physics.bodies.head, { x: anchor.x, y: anchor.y - 62 }, 0);
  setBodyPose(
    physics.bodies.leftArm,
    { x: anchor.x - 42, y: anchor.y - 4 },
    -0.18
  );
  setBodyPose(
    physics.bodies.rightArm,
    { x: anchor.x + 42, y: anchor.y - 4 },
    0.18
  );
  setBodyPose(
    physics.bodies.leftLeg,
    { x: anchor.x - 18, y: anchor.y + 62 },
    state === "walking" ? 0.08 + sway : 0.04
  );
  setBodyPose(
    physics.bodies.rightLeg,
    { x: anchor.x + 18, y: anchor.y + 62 },
    state === "walking" ? -0.08 - sway : -0.04
  );
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
  const [activityVersion, setActivityVersion] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [gaze, setGaze] = useState<GazeState>(DEFAULT_GAZE_STATE);
  const bodyRefs = useRef<Partial<Record<PartKey, HTMLDivElement>>>({});
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimeoutRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const grabTargetRef = useRef<HTMLDivElement | null>(null);
  const idleDirectionRef = useRef(1);
  const idleStateRef = useRef<IdleState>("active");
  const physicsRef = useRef<PhysicsWorld | null>(null);

  useEffect(() => {
    idleStateRef.current = idleState;
  }, [idleState]);

  const updateGaze = useCallback(
    (target: Point) => {
      if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        return;
      }

      const focus = physicsRef.current?.bodies.head.position ?? {
        x: reducedAnchor.x,
        y: reducedAnchor.y - 62
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
      setIdlePose(physics, idleStateRef.current, idleDirectionRef.current);
    }
    containBodiesInViewport(physics.bodies);
    partConfigs.forEach((part) => {
      const element = bodyRefs.current[part.key];

      if (element) {
        syncBodyToElement(physics.bodies[part.key], element, part);
      }
    });
    syncGrabTarget(grabTargetRef.current, physics.bodies.torso.position);
    syncChatBubble(bubbleRef.current, physics.bodies.head.position);
  }, []);

  useEffect(() => {
    setReducedAnchor(initialAnchor());
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
      setIdleState("walking");
    }, IDLE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activityVersion, motionPreferenceReady, reducedMotion]);

  useEffect(() => {
    if (!motionPreferenceReady || reducedMotion) {
      return undefined;
    }

    if (idleState === "walking") {
      const pauseTimeout = window.setTimeout(() => {
        setIdleState("paused");
      }, IDLE_DELAY_MS);

      return () => {
        window.clearTimeout(pauseTimeout);
      };
    }

    if (idleState === "paused") {
      const resumeTimeout = window.setTimeout(() => {
        setIdleState("walking");
      }, IDLE_PAUSE_MS);

      return () => {
        window.clearTimeout(resumeTimeout);
      };
    }

    return undefined;
  }, [idleState, motionPreferenceReady, reducedMotion]);

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
      const touch = event.touches[0] ?? event.changedTouches[0];

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

      Matter.Composite.remove(physics.engine.world, physics.walls);
      physics.walls = createWalls(nextSize.width, nextSize.height);
      Matter.Composite.add(physics.engine.world, physics.walls);
      containBodiesInViewport(physics.bodies, nextSize);
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
      setIdleState("active");
      setActivityVersion((current) => current + 1);
      updateGaze(point);

      const center = reducedMotion
        ? reducedAnchor
        : physicsRef.current?.bodies.torso.position ?? reducedAnchor;

      dragRef.current = {
        lastPoint: point,
        lastTime: event.timeStamp,
        maxDistance: 0,
        offset: {
          x: point.x - center.x,
          y: point.y - center.y
        },
        pointerId: event.pointerId,
        startPoint: point,
        velocity: { x: 0, y: 0 }
      };
    },
    [reducedAnchor, reducedMotion, updateGaze]
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
      const elapsed = Math.max(event.timeStamp - drag.lastTime, 16);
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
      drag.lastTime = event.timeStamp;

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
      containBodiesInViewport(physics.bodies);
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
      setActivityVersion((current) => current + 1);

      if (captureTarget?.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
      }

      if (reducedMotion) {
        return;
      }

      const physics = physicsRef.current;
      const shouldShowBubble = releaseShouldShowBubble(drag, point);

      if (!physics) {
        return;
      }

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
      if (shouldShowBubble) {
        setBubbleVisible(true);
        if (bubbleTimeoutRef.current) {
          window.clearTimeout(bubbleTimeoutRef.current);
        }
        bubbleTimeoutRef.current = window.setTimeout(() => {
          setBubbleVisible(false);
        }, 2_800);
      }
    },
    [reducedMotion, updateGaze]
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
    },
    []
  );

  return (
    <div
      aria-hidden="true"
      className={[
        "fp-little-alex-shell",
        `fp-little-alex-presentation-${genderPresentation}`
      ].join(" ")}
      data-chat-phrase={chatPhrase}
      data-gender-presentation={genderPresentation}
      data-gaze-direction={gaze.direction}
      data-idle-state={
        motionPreferenceReady && reducedMotion ? "static" : idleState
      }
      data-motion-mode={
        motionPreferenceReady && reducedMotion ? "reduced" : "physics"
      }
      data-physics-engine="matter-js"
      data-testid="little-alex-horne"
      style={
        {
          "--little-alex-gaze-x": gaze.x.toString(),
          "--little-alex-gaze-y": gaze.y.toString(),
          "--little-alex-skin": skinToneCssValues[skinTone],
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
          {partContent(part.key)}
        </div>
      ))}
      <div
        className="fp-little-alex-grab-target"
        data-testid="little-alex-grab-target"
        onPointerDown={handlePointerDown}
        ref={grabTargetRef}
        style={{
          ...grabTargetStyle(reducedAnchor),
          pointerEvents: "auto"
        }}
      />
    </div>
  );
}
