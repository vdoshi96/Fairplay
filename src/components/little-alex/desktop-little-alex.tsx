"use client";

import {
  useEffect,
  useState,
  type ComponentType
} from "react";

import type { LittleAlexPhysicsProps } from "./little-alex-physics";

export const LITTLE_ALEX_DESKTOP_MEDIA =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

type LittleAlexPhysicsModule = {
  LittleAlexPhysics: ComponentType<LittleAlexPhysicsProps>;
};

export type LittleAlexPhysicsLoader = () => Promise<LittleAlexPhysicsModule>;

const loadLittleAlexPhysics: LittleAlexPhysicsLoader = () =>
  import("./little-alex-physics");

type DesktopLittleAlexProps = LittleAlexPhysicsProps & {
  loader?: LittleAlexPhysicsLoader;
};

/**
 * Keeps the complete physics implementation out of mobile and touch-first
 * sessions. The import begins only after the browser confirms a desktop-sized,
 * hover-capable, fine-pointer environment.
 */
export function DesktopLittleAlex({
  loader = loadLittleAlexPhysics,
  ...physicsProps
}: DesktopLittleAlexProps) {
  const [PhysicsComponent, setPhysicsComponent] =
    useState<ComponentType<LittleAlexPhysicsProps> | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setPhysicsComponent(null);
      return undefined;
    }

    const media = window.matchMedia(LITTLE_ALEX_DESKTOP_MEDIA);
    let active = true;
    let requestVersion = 0;

    const update = () => {
      const currentRequest = ++requestVersion;

      if (!media.matches) {
        setPhysicsComponent(null);
        return;
      }

      void loader()
        .then((module) => {
          if (
            active &&
            media.matches &&
            requestVersion === currentRequest
          ) {
            setPhysicsComponent(() => module.LittleAlexPhysics);
          }
        })
        .catch(() => {
          if (active && requestVersion === currentRequest) {
            setPhysicsComponent(null);
          }
        });
    };

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);

      return () => {
        active = false;
        requestVersion += 1;
        media.removeEventListener("change", update);
      };
    }

    media.addListener(update);

    return () => {
      active = false;
      requestVersion += 1;
      media.removeListener(update);
    };
  }, [loader]);

  return PhysicsComponent ? <PhysicsComponent {...physicsProps} /> : null;
}
