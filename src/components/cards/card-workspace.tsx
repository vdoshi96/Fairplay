"use client";

import { BoardWorkspace } from "./board-workspace";
import { DealWorkspace } from "./deal-workspace";
import type { CardWorkspaceProps } from "./card-workspace-types";
import { YourDeckWorkspace } from "./your-deck-workspace";

/**
 * Compatibility entry point for callers that still choose a workspace at
 * runtime. App routes import their dedicated workspace directly so their
 * client bundles do not include the other views.
 */
export function CardWorkspace({
  addedToDeal = false,
  initialSelectedId,
  onDistribute,
  responsibilities,
  selectedPersona,
  view,
  workMap
}: CardWorkspaceProps) {
  if (view === "yourCards") {
    return (
      <YourDeckWorkspace
        responsibilities={responsibilities}
        selectedPersona={selectedPersona}
      />
    );
  }

  if (view === "board") {
    return (
      <BoardWorkspace
        onDistribute={onDistribute}
        responsibilities={responsibilities}
        workMap={workMap}
      />
    );
  }

  return (
    <DealWorkspace
      addedToDeal={addedToDeal}
      initialSelectedId={initialSelectedId}
      onDistribute={onDistribute}
      responsibilities={responsibilities}
      workMap={workMap}
    />
  );
}

export type {
  BoardWorkspaceProps,
  CardWorkspaceCard,
  CardWorkspaceProps,
  DealWorkspaceProps,
  YourDeckWorkspaceProps
} from "./card-workspace-types";
