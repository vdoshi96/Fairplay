import type { RadarState, ResponsibilityStatus, Visibility } from "@/domain/enums";
import type { RadarItemId, ResponsibilityId } from "@/domain/ids";

export type RadarAgendaSource = {
  id: RadarItemId;
  topic: string;
  reasonKey: string;
  visibility: Visibility;
  state: RadarState;
  responsibilityId: ResponsibilityId | null;
};

export type ResponsibilityAgendaSource = {
  id: ResponsibilityId;
  title: string;
  status: ResponsibilityStatus;
  cadence: string;
  nextReviewAt: string | null;
};

export type AgendaSources = {
  radarItems: RadarAgendaSource[];
  responsibilities: ResponsibilityAgendaSource[];
};

export type AgendaDraftItem = {
  itemType: "radar" | "responsibility" | "custom";
  promptKey: string;
  radarItemId: RadarItemId | null;
  responsibilityId: ResponsibilityId | null;
  title: string;
  description: string;
  visibility: Visibility | null;
};

export const MAX_AGENDA_ITEMS = 5;

function dueReviewDescription(source: ResponsibilityAgendaSource) {
  return source.nextReviewAt ? "Review due" : "Recent responsibility";
}

export function buildSuggestedAgenda(
  sources: AgendaSources,
  options: {
    maxItems?: number;
    radarItemIds?: RadarItemId[];
    responsibilityIds?: ResponsibilityId[];
    includeAcknowledgement?: boolean;
  } = {}
): AgendaDraftItem[] {
  const maxItems = Math.min(options.maxItems ?? MAX_AGENDA_ITEMS, MAX_AGENDA_ITEMS);
  const selectedRadarIds = options.radarItemIds
    ? new Set(options.radarItemIds)
    : null;
  const selectedResponsibilityIds = options.responsibilityIds
    ? new Set(options.responsibilityIds)
    : null;
  const items: AgendaDraftItem[] = [];

  for (const source of sources.radarItems) {
    if (selectedRadarIds && !selectedRadarIds.has(source.id)) {
      continue;
    }

    items.push({
      itemType: "radar",
      promptKey: "radar_discussion",
      radarItemId: source.id,
      responsibilityId: source.responsibilityId,
      title: source.topic,
      description: source.visibility.replaceAll("_", " "),
      visibility: source.visibility
    });
  }

  for (const source of sources.responsibilities) {
    if (selectedResponsibilityIds && !selectedResponsibilityIds.has(source.id)) {
      continue;
    }

    items.push({
      itemType: "responsibility",
      promptKey: "responsibility_review",
      radarItemId: null,
      responsibilityId: source.id,
      title: source.title,
      description: dueReviewDescription(source),
      visibility: "shared_household"
    });
  }

  if (options.includeAcknowledgement && items.length < maxItems) {
    items.push({
      itemType: "custom",
      promptKey: "acknowledgement",
      radarItemId: null,
      responsibilityId: null,
      title: "Name one thing that helped this week",
      description: "Optional acknowledgement",
      visibility: null
    });
  }

  return items.slice(0, maxItems);
}
