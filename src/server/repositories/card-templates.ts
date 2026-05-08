import type { Prisma, ResponsibilityBoardLane } from "@prisma/client";

import {
  CARD_TEMPLATE_LABELS,
  type CardTemplateDetail,
  type CardTemplateLabel,
  type CardTemplateSearchParams,
  type CardTemplateSummary
} from "../../contracts/card-templates";
import type { HouseholdId, PersonaId } from "../../domain/ids";
import { FAIRPLAY_SOURCE_CARDS } from "../../seed/fairplay-source-cards";
import { isUniqueConstraintError, RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";
import {
  createResponsibility,
  getResponsibilityDetail,
  type CreateResponsibilityInput
} from "./responsibilities";

const labelSet = new Set<string>(CARD_TEMPLATE_LABELS);

const templateSelect = {
  id: true,
  sourceCardId: true,
  slug: true,
  title: true,
  summary: true,
  areaKeys: true,
  defaultCadence: true,
  hiddenEffortKeys: true,
  definition: true,
  conception: true,
  planning: true,
  execution: true,
  minimumStandard: true,
  coverAssetPath: true,
  defaultLane: true,
  contentVersion: true,
  sourceVersion: true,
  importedAt: true
} satisfies Prisma.ResponsibilityTemplateSelect;

type TemplateRecord = Prisma.ResponsibilityTemplateGetPayload<{
  select: typeof templateSelect;
}>;
type SourceCardTemplate = (typeof FAIRPLAY_SOURCE_CARDS)[number];
type CatalogResponsibilityRow = Prisma.ResponsibilityGetPayload<{
  include: {
    assignments: {
      select: {
        endsAt: true;
        role: true;
      };
    };
  };
}>;

export type CreateResponsibilityFromTemplateInput = {
  householdId: HouseholdId;
  actorPersonaId: PersonaId;
  templateId: string;
  lane?: ResponsibilityBoardLane;
  titleOverride?: string;
};

function labelsFromAreaKeys(areaKeys: string[]): CardTemplateLabel[] {
  return areaKeys.filter((areaKey): areaKey is CardTemplateLabel =>
    labelSet.has(areaKey)
  );
}

function coverAssetPath(template: Pick<TemplateRecord, "coverAssetPath" | "slug">) {
  return template.coverAssetPath ?? `/assets/fairplay/cards/${template.slug}.png`;
}

function sourceTemplateForIdentifier(identifier: string): SourceCardTemplate | null {
  return (
    FAIRPLAY_SOURCE_CARDS.find(
      (template) =>
        template.id === identifier ||
        template.sourceCardId === identifier ||
        template.slug === identifier
    ) ?? null
  );
}

function sourceTemplateData(template: SourceCardTemplate) {
  return {
    sourceCardId: template.sourceCardId,
    title: template.title,
    summary: template.summary,
    areaKeys: [...template.labels],
    defaultCadence: template.defaultCadence,
    hiddenEffortKeys: [...template.hiddenEffortKeys],
    sourceReviewStatus: "approved_original" as const,
    contentVersion: template.sourceVersion,
    definition: template.definition,
    conception: template.conception,
    planning: template.planning,
    execution: template.execution,
    minimumStandard: template.minimumStandard,
    coverAssetPath: template.coverAssetPath,
    defaultLane: template.defaultLane,
    sourceVersion: template.sourceVersion,
    importedAt: new Date(template.importedAt)
  };
}

async function upsertSourceTemplate(
  template: SourceCardTemplate
): Promise<TemplateRecord> {
  const data = sourceTemplateData(template);

  return prisma.responsibilityTemplate.upsert({
    where: {
      slug: template.slug
    },
    update: data,
    create: {
      id: template.id,
      slug: template.slug,
      ...data
    },
    select: templateSelect
  });
}

async function findTemplateByIdentifier(
  identifier: string
): Promise<TemplateRecord | null> {
  const template = await prisma.responsibilityTemplate.findFirst({
    where: {
      OR: [
        { id: identifier },
        { sourceCardId: identifier },
        { slug: identifier }
      ]
    },
    select: templateSelect
  });

  if (template) {
    return template;
  }

  const sourceTemplate = sourceTemplateForIdentifier(identifier);

  return sourceTemplate ? upsertSourceTemplate(sourceTemplate) : null;
}

function toSummary(template: TemplateRecord): CardTemplateSummary {
  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    labels: labelsFromAreaKeys(template.areaKeys),
    summary: template.summary,
    coverAssetPath: coverAssetPath(template),
    defaultLane: template.defaultLane
  };
}

function toDetail(template: TemplateRecord): CardTemplateDetail {
  return {
    ...toSummary(template),
    sourceCardId: template.sourceCardId ?? template.id,
    definition: template.definition ?? template.summary,
    conception:
      template.conception ??
      "Notice what this responsibility requires before the execution step.",
    planning:
      template.planning ??
      "Plan timing, access, dependencies, and communication before execution.",
    execution:
      template.execution ??
      "Complete the visible work and follow through until the outcome is handled.",
    minimumStandard:
      template.minimumStandard ??
      "Agree on household-specific Fogging Estandards before judging follow-through.",
    defaultCadence: template.defaultCadence,
    hiddenEffortKeys: template.hiddenEffortKeys,
    sourceVersion: template.sourceVersion ?? template.contentVersion,
    importedAt: (template.importedAt ?? new Date(0)).toISOString()
  };
}

function templateToCreateInput(input: {
  actorPersonaId: PersonaId;
  householdId: HouseholdId;
  lane?: ResponsibilityBoardLane;
  template: TemplateRecord;
  titleOverride?: string;
}): CreateResponsibilityInput {
  return {
    householdId: input.householdId,
    createdByPersonaId: input.actorPersonaId,
    templateId: input.template.id,
    title: input.titleOverride ?? input.template.title,
    summary: input.template.summary,
    areaKeys: labelsFromAreaKeys(input.template.areaKeys),
    hiddenEffortKeys: input.template.hiddenEffortKeys,
    cadence: input.template.defaultCadence,
    relevantDays: [],
    status: statusForInitialLane(input.lane),
    visibility: "shared_household",
    householdStandard: input.template.minimumStandard,
    notes: null,
    nextReviewAt: null,
    boardLane: input.lane ?? "cards_of_concern",
    sourceDefinition: input.template.definition ?? input.template.summary,
    sourceConception: input.template.conception,
    sourcePlanning: input.template.planning,
    sourceExecution: input.template.execution,
    sourceMinimumStandard: input.template.minimumStandard,
    sourceCoverAssetPath: coverAssetPath(input.template)
  };
}

function statusForInitialLane(lane?: ResponsibilityBoardLane) {
  if (lane === "trimmed") {
    return "not_relevant" as const;
  }

  if (lane === "not_in_play") {
    return "paused" as const;
  }

  if (lane === "player_1" || lane === "player_2") {
    return "active" as const;
  }

  return "unassigned" as const;
}

function hasActiveOwner(row: CatalogResponsibilityRow) {
  return row.assignments.some(
    (assignment) =>
      assignment.endsAt === null &&
      (assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner")
  );
}

function catalogRowPriority(row: CatalogResponsibilityRow) {
  if (row.archivedAt) {
    return 0;
  }

  if (hasActiveOwner(row)) {
    return 5;
  }

  if (row.boardLane === "player_1" || row.boardLane === "player_2") {
    return 4;
  }

  if (
    row.status === "paused" ||
    row.status === "not_relevant" ||
    row.boardLane === "not_in_play" ||
    row.boardLane === "trimmed"
  ) {
    return 3;
  }

  if (row.status === "active" || row.status === "needs_review") {
    return 2;
  }

  return 1;
}

function compareCatalogRows(
  first: CatalogResponsibilityRow,
  second: CatalogResponsibilityRow
) {
  return (
    catalogRowPriority(second) - catalogRowPriority(first) ||
    second.updatedAt.getTime() - first.updatedAt.getTime() ||
    first.createdAt.getTime() - second.createdAt.getTime() ||
    first.id.localeCompare(second.id)
  );
}

async function normalizeHouseholdCatalogResponsibilities(input: {
  householdId: HouseholdId;
  templateIds: readonly string[];
}) {
  const templateIds = [...new Set(input.templateIds)].filter(Boolean);
  const canonicalIds = new Map<string, string>();

  if (templateIds.length === 0) {
    return canonicalIds;
  }

  const rows = await prisma.responsibility.findMany({
    where: {
      householdId: input.householdId,
      templateId: {
        in: templateIds
      }
    },
    include: {
      assignments: {
        select: {
          endsAt: true,
          role: true
        }
      }
    }
  });
  const rowsByTemplateId = new Map<string, CatalogResponsibilityRow[]>();

  rows.forEach((row) => {
    if (!row.templateId) {
      return;
    }

    rowsByTemplateId.set(row.templateId, [
      ...(rowsByTemplateId.get(row.templateId) ?? []),
      row
    ]);
  });

  const duplicateIds: string[] = [];

  rowsByTemplateId.forEach((templateRows, templateId) => {
    const [canonical, ...duplicates] = [...templateRows].sort(compareCatalogRows);

    if (!canonical || canonical.archivedAt) {
      return;
    }

    canonicalIds.set(templateId, canonical.id);
    duplicates.forEach((duplicate) => {
      if (!duplicate.archivedAt) {
        duplicateIds.push(duplicate.id);
      }
    });
  });

  if (duplicateIds.length > 0) {
    await prisma.responsibility.updateMany({
      where: {
        householdId: input.householdId,
        id: {
          in: duplicateIds
        }
      },
      data: {
        archivedAt: new Date(),
        status: "archived"
      }
    });
  }

  return canonicalIds;
}

function searchWhere(
  params: CardTemplateSearchParams
): Prisma.ResponsibilityTemplateWhereInput {
  return {
    title: params.q
      ? {
          contains: params.q,
          mode: "insensitive"
        }
      : undefined,
    areaKeys: params.labels?.length
      ? {
          hasSome: params.labels
        }
      : undefined,
    defaultLane: params.lane
  };
}

export async function listCardTemplates(
  params: CardTemplateSearchParams = {}
): Promise<CardTemplateSummary[]> {
  const templates = await prisma.responsibilityTemplate.findMany({
    where: searchWhere(params),
    orderBy: {
      title: "asc"
    },
    select: templateSelect
  });

  return templates.map(toSummary);
}

export async function getCardTemplate(
  templateId: string
): Promise<CardTemplateDetail | null> {
  const template = await findTemplateByIdentifier(templateId);

  return template ? toDetail(template) : null;
}

export async function ensureHouseholdCatalogResponsibilities(input: {
  actorPersonaId: PersonaId;
  householdId: HouseholdId;
}) {
  const templates = await Promise.all(
    FAIRPLAY_SOURCE_CARDS.map((template) => upsertSourceTemplate(template))
  );
  const templateIds = templates.map((template) => template.id);
  const canonicalIds = await normalizeHouseholdCatalogResponsibilities({
    householdId: input.householdId,
    templateIds
  });

  for (const template of templates) {
    if (canonicalIds.has(template.id)) {
      continue;
    }

    try {
      await createResponsibility(
        templateToCreateInput({
          actorPersonaId: input.actorPersonaId,
          householdId: input.householdId,
          template,
          lane: "cards_of_concern"
        })
      );
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }
}

export async function createResponsibilityFromTemplate(
  input: CreateResponsibilityFromTemplateInput
) {
  const template = await findTemplateByIdentifier(input.templateId);

  if (!template) {
    throw new RepositoryError("NOT_FOUND", "Card template not found.");
  }

  const canonicalIds = await normalizeHouseholdCatalogResponsibilities({
    householdId: input.householdId,
    templateIds: [template.id]
  });
  const canonicalId = canonicalIds.get(template.id);

  if (canonicalId) {
    const existing = await getResponsibilityDetail({
      householdId: input.householdId,
      responsibilityId: canonicalId
    });

    if (existing) {
      return existing;
    }
  }

  try {
    return await createResponsibility(
      templateToCreateInput({
        actorPersonaId: input.actorPersonaId,
        householdId: input.householdId,
        lane: input.lane,
        template,
        titleOverride: input.titleOverride
      })
    );
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const retryCanonicalIds = await normalizeHouseholdCatalogResponsibilities({
      householdId: input.householdId,
      templateIds: [template.id]
    });
    const retryExistingId = retryCanonicalIds.get(template.id);
    const retryExisting = retryExistingId
      ? await getResponsibilityDetail({
          householdId: input.householdId,
          responsibilityId: retryExistingId
        })
      : null;

    if (retryExisting) {
      return retryExisting;
    }

    throw error;
  }
}
