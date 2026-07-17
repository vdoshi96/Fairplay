import type { HouseholdWorkMap } from "@/contracts/household-work-map";
import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { CardDistributionMove } from "./card-state";

export type CardWorkspaceCard = ResponsibilitySummary & {
  householdStandard?: string | null;
  sourceDefinition?: string | null;
  sourceMinimumStandard?: string | null;
  sourceCoverAssetPath?: string | null;
  summary?: string | null;
};

export type DistributeCard = (
  move: CardDistributionMove
) => Promise<void> | void;

export type DealWorkspaceProps = {
  addedToDeal?: boolean;
  initialSelectedId?: string;
  onDistribute?: DistributeCard;
  responsibilities: CardWorkspaceCard[];
  workMap?: HouseholdWorkMap;
};

export type BoardWorkspaceProps = {
  onDistribute?: DistributeCard;
  responsibilities: CardWorkspaceCard[];
  workMap?: HouseholdWorkMap;
};

export type YourDeckWorkspaceProps = {
  responsibilities: CardWorkspaceCard[];
  selectedPersona: PersonaSummary;
};

export type CardWorkspaceProps = {
  addedToDeal?: boolean;
  initialSelectedId?: string;
  onDistribute?: DistributeCard;
  responsibilities: CardWorkspaceCard[];
  selectedPersona: PersonaSummary;
  view: "board" | "distribute" | "yourCards";
  workMap?: HouseholdWorkMap;
};
