"use client";

import Matter from "matter-js";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
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
  offset: Point;
  pointerId: number;
  velocity: Point;
};

type PhysicsWorld = {
  bodies: Record<PartKey, Matter.Body>;
  engine: Matter.Engine;
  runner: Matter.Runner;
  walls: Matter.Body[];
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
  engine.gravity.y = 0.82;

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
  return clamp(value, -26, 26);
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
    return <span className="fp-little-alex-bowtie" />;
  }

  if (part === "leftLeg" || part === "rightLeg") {
    return <span className="fp-little-alex-shoe" />;
  }

  return null;
}

export function LittleAlexPhysics() {
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedAnchor, setReducedAnchor] = useState(SERVER_SAFE_ANCHOR);
  const bodyRefs = useRef<Partial<Record<PartKey, HTMLDivElement>>>({});
  const dragRef = useRef<DragState | null>(null);
  const grabTargetRef = useRef<HTMLDivElement | null>(null);
  const physicsRef = useRef<PhysicsWorld | null>(null);

  const syncPhysicsDom = useCallback(() => {
    const physics = physicsRef.current;

    if (!physics) {
      return;
    }

    containBodiesInViewport(physics.bodies);
    partConfigs.forEach((part) => {
      const element = bodyRefs.current[part.key];

      if (element) {
        syncBodyToElement(physics.bodies[part.key], element, part);
      }
    });
    syncGrabTarget(grabTargetRef.current, physics.bodies.torso.position);
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
      event.currentTarget.setPointerCapture(event.pointerId);

      const center = reducedMotion
        ? reducedAnchor
        : physicsRef.current?.bodies.torso.position ?? reducedAnchor;

      dragRef.current = {
        lastPoint: { x: event.clientX, y: event.clientY },
        lastTime: event.timeStamp,
        offset: {
          x: event.clientX - center.x,
          y: event.clientY - center.y
        },
        pointerId: event.pointerId,
        velocity: { x: 0, y: 0 }
      };
    },
    [reducedAnchor, reducedMotion]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nextAnchor = clampAnchor({
        x: event.clientX - drag.offset.x,
        y: event.clientY - drag.offset.y
      });
      const elapsed = Math.max(event.timeStamp - drag.lastTime, 16);
      drag.velocity = {
        x: clampVelocity(((event.clientX - drag.lastPoint.x) / elapsed) * 16),
        y: clampVelocity(((event.clientY - drag.lastPoint.y) / elapsed) * 16)
      };
      drag.lastPoint = { x: event.clientX, y: event.clientY };
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
    [reducedMotion, syncPhysicsDom]
  );

  const releaseDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      dragRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (reducedMotion) {
        return;
      }

      const physics = physicsRef.current;

      if (!physics) {
        return;
      }

      Object.entries(physics.bodies).forEach(([key, body]) => {
        const weight = key === "torso" ? 1 : 0.82;

        Matter.Body.setVelocity(body, {
          x: drag.velocity.x * weight,
          y: drag.velocity.y * weight
        });
        Matter.Body.setAngularVelocity(
          body,
          clampVelocity(drag.velocity.x) * (key === "head" ? 0.006 : 0.004)
        );
      });
    },
    [reducedMotion]
  );

  return (
    <div
      aria-hidden="true"
      className="fp-little-alex-shell"
      data-motion-mode={
        motionPreferenceReady && reducedMotion ? "reduced" : "physics"
      }
      data-physics-engine="matter-js"
      data-testid="little-alex-horne"
      style={{ pointerEvents: "none" }}
    >
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
        onPointerCancel={releaseDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releaseDrag}
        ref={grabTargetRef}
        style={{
          ...grabTargetStyle(reducedAnchor),
          pointerEvents: "auto"
        }}
      />
    </div>
  );
}
