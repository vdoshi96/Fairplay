import type { ResponsibilityBoardLane } from "@/domain/enums";

export type BoardLaneTone =
  | "concern"
  | "playerOne"
  | "playerTwo"
  | "kidSplit"
  | "reserve"
  | "trimmed";

export const BOARD_LANES: readonly {
  key: ResponsibilityBoardLane;
  label: string;
  shortHelp: string;
  tone: BoardLaneTone;
}[] = [
  {
    key: "cards_of_concern",
    label: "Unassigned",
    shortHelp: "Ready for a deal decision.",
    tone: "concern"
  },
  {
    key: "player_1",
    label: "Alex",
    shortHelp: "Owned by Alex.",
    tone: "playerOne"
  },
  {
    key: "player_2",
    label: "Max",
    shortHelp: "Owned by Max.",
    tone: "playerTwo"
  },
  {
    key: "kid_split",
    label: "Unassigned",
    shortHelp: "Legacy split cards that need review.",
    tone: "kidSplit"
  },
  {
    key: "not_in_play",
    label: "Saved for Later",
    shortHelp: "Useful, but not ready to assign.",
    tone: "reserve"
  },
  {
    key: "trimmed",
    label: "Not Applicable",
    shortHelp: "Not part of this household right now.",
    tone: "trimmed"
  }
];

export function getBoardLaneLabel(lane: ResponsibilityBoardLane) {
  return BOARD_LANES.find((metadata) => metadata.key === lane)?.label ?? lane;
}
