import type { ResponsibilityStatus, Visibility } from "@/domain/enums";
import type { ResponsibilityId } from "@/domain/ids";

export type ResponsibilityAgendaSource = {
  id: ResponsibilityId;
  title: string;
  status: ResponsibilityStatus;
  cadence: string;
  nextReviewAt: string | null;
};

export type AgendaSources = {
  responsibilities: ResponsibilityAgendaSource[];
};

export type AgendaDraftItem = {
  itemType: "responsibility" | "custom";
  promptKey: string;
  responsibilityId: ResponsibilityId | null;
  title: string;
  description: string;
  visibility: Visibility | null;
};

export const MAX_AGENDA_ITEMS = 5;

function dueReviewDescription(source: ResponsibilityAgendaSource) {
  return source.nextReviewAt ? "Review due" : "Recent responsibility";
}

function normalizeMaxItems(maxItems: number | undefined) {
  if (maxItems === undefined || Number.isNaN(maxItems)) {
    return MAX_AGENDA_ITEMS;
  }

  if (maxItems === Infinity) {
    return MAX_AGENDA_ITEMS;
  }

  if (maxItems === -Infinity) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(maxItems), 1), MAX_AGENDA_ITEMS);
}

export function buildSuggestedAgenda(
  sources: AgendaSources,
  options: {
    maxItems?: number;
    responsibilityIds?: ResponsibilityId[];
    includeAcknowledgement?: boolean;
  } = {}
): AgendaDraftItem[] {
  const maxItems = normalizeMaxItems(options.maxItems);
  const selectedResponsibilityIds = options.responsibilityIds
    ? new Set(options.responsibilityIds)
    : null;
  const items: AgendaDraftItem[] = [];

  for (const source of sources.responsibilities) {
    if (selectedResponsibilityIds && !selectedResponsibilityIds.has(source.id)) {
      continue;
    }

    items.push({
      itemType: "responsibility",
      promptKey: "responsibility_review",
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
      responsibilityId: null,
      title: "Name one thing that helped this week",
      description: "Optional acknowledgement",
      visibility: null
    });
  }

  return items.slice(0, maxItems);
}
