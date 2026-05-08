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
    label: "Cards of Concern",
    shortHelp: "Needs a decision or support.",
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
    label: "Kid Split",
    shortHelp: "Split by child, season, or subtask.",
    tone: "kidSplit"
  },
  {
    key: "not_in_play",
    label: "Not in Play",
    shortHelp: "Not active yet.",
    tone: "reserve"
  },
  {
    key: "trimmed",
    label: "Trimmed",
    shortHelp: "Paused, dropped, or irrelevant.",
    tone: "trimmed"
  }
];

export function getBoardLaneLabel(lane: ResponsibilityBoardLane) {
  return BOARD_LANES.find((metadata) => metadata.key === lane)?.label ?? lane;
}
