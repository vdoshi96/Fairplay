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
    shortHelp: "Needs discussion, standards, support, or review.",
    tone: "concern"
  },
  {
    key: "player_1",
    label: "Player 1",
    shortHelp: "Owned by the first household persona.",
    tone: "playerOne"
  },
  {
    key: "player_2",
    label: "Player 2",
    shortHelp: "Owned by the second household persona.",
    tone: "playerTwo"
  },
  {
    key: "kid_split",
    label: "Kid Split",
    shortHelp: "Split by child, context, season, or sub-responsibility.",
    tone: "kidSplit"
  },
  {
    key: "not_in_play",
    label: "Not in Play",
    shortHelp: "Reserve cards that are not active yet.",
    tone: "reserve"
  },
  {
    key: "trimmed",
    label: "Trimmed",
    shortHelp: "Paused, dropped, or irrelevant for this household.",
    tone: "trimmed"
  }
];

export function getBoardLaneLabel(lane: ResponsibilityBoardLane) {
  return BOARD_LANES.find((metadata) => metadata.key === lane)?.label ?? lane;
}
