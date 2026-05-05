import type { Prisma, ResponsibilityBoardLane } from "@prisma/client";

import {
  CARD_TEMPLATE_LABELS,
  type CardTemplateDetail,
  type CardTemplateLabel,
  type CardTemplateSearchParams,
  type CardTemplateSummary
} from "../../contracts/card-templates";
import type { HouseholdId, PersonaId } from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";
import {
  createResponsibility,
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
      "Agree on a household-specific minimum standard before judging follow-through.",
    defaultCadence: template.defaultCadence,
    hiddenEffortKeys: template.hiddenEffortKeys,
    sourceVersion: template.sourceVersion ?? template.contentVersion,
    importedAt: (template.importedAt ?? new Date(0)).toISOString()
  };
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
  const template = await prisma.responsibilityTemplate.findUnique({
    where: {
      id: templateId
    },
    select: templateSelect
  });

  return template ? toDetail(template) : null;
}

export async function createResponsibilityFromTemplate(
  input: CreateResponsibilityFromTemplateInput
) {
  const template = await prisma.responsibilityTemplate.findUnique({
    where: {
      id: input.templateId
    },
    select: templateSelect
  });

  if (!template) {
    throw new RepositoryError("NOT_FOUND", "Card template not found.");
  }

  const createInput: CreateResponsibilityInput = {
    householdId: input.householdId,
    createdByPersonaId: input.actorPersonaId,
    templateId: template.id,
    title: input.titleOverride ?? template.title,
    summary: template.summary,
    areaKeys: labelsFromAreaKeys(template.areaKeys),
    hiddenEffortKeys: template.hiddenEffortKeys,
    cadence: template.defaultCadence,
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    householdStandard: template.minimumStandard,
    notes: null,
    nextReviewAt: null,
    boardLane: input.lane ?? template.defaultLane,
    sourceDefinition: template.definition ?? template.summary,
    sourceConception: template.conception,
    sourcePlanning: template.planning,
    sourceExecution: template.execution,
    sourceMinimumStandard: template.minimumStandard,
    sourceCoverAssetPath: coverAssetPath(template)
  };

  return createResponsibility(createInput);
}
