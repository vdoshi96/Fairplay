import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../db/prisma";
import { FAIRPLAY_SOURCE_CARDS } from "../../seed/fairplay-source-cards";
import { createHouseholdWithPersonas } from "./households";
import {
  createResponsibilityFromTemplate,
  getCardTemplate,
  listCardTemplates
} from "./card-templates";

const createdHouseholdIds = new Set<string>();
const createdTemplateIds = new Set<string>();

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

async function createTemplate(input: {
  slug: string;
  title: string;
  labels: string[];
  coverAssetPath: string;
  defaultLane?: "cards_of_concern" | "not_in_play" | "player_1";
}) {
  const template = await prisma.responsibilityTemplate.create({
    data: {
      slug: `${input.slug}-${randomUUID()}`,
      title: input.title,
      summary: `${input.title} summary`,
      areaKeys: input.labels,
      defaultCadence: "weekly",
      hiddenEffortKeys: ["noticing", "planning", "doing"],
      sourceReviewStatus: "approved_original",
      contentVersion: "test",
      sourceCardId: `source-${randomUUID()}`,
      definition: `${input.title} definition`,
      conception: `${input.title} conception`,
      planning: `${input.title} planning`,
      execution: `${input.title} execution`,
      minimumStandard: `${input.title} standard`,
      coverAssetPath: input.coverAssetPath,
      defaultLane: input.defaultLane ?? "not_in_play",
      sourceVersion: "test-source",
      importedAt: new Date("2026-05-04T00:00:00.000Z")
    }
  });
  createdTemplateIds.add(template.id);

  return template;
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for repository integration tests.");
  }
});

afterEach(async () => {
  if (createdHouseholdIds.size > 0) {
    await prisma.household.deleteMany({
      where: { id: { in: [...createdHouseholdIds] } }
    });
    createdHouseholdIds.clear();
  }

  if (createdTemplateIds.size > 0) {
    await prisma.responsibilityTemplate.deleteMany({
      where: { id: { in: [...createdTemplateIds] } }
    });
    createdTemplateIds.clear();
  }
});

describe("card template repository", () => {
  it("returns source templates sorted by title and filtered by label", async () => {
    const marker = `Worker 6 ${randomUUID()}`;
    await createTemplate({
      slug: "z-dishes",
      title: `${marker} Z Dishes`,
      labels: ["Daily Grind", "Home"],
      coverAssetPath: "/assets/fairplay/cards/dishes.png"
    });
    await createTemplate({
      slug: "a-auto",
      title: `${marker} A Auto`,
      labels: ["Out"],
      coverAssetPath: "/assets/fairplay/cards/auto.png"
    });
    await createTemplate({
      slug: "b-laundry",
      title: `${marker} B Laundry`,
      labels: ["Daily Grind", "Home"],
      coverAssetPath: "/assets/fairplay/cards/laundry.png"
    });

    const templates = await listCardTemplates({
      q: marker,
      labels: ["Daily Grind"]
    });

    expect(templates.map((template) => template.title)).toEqual([
      `${marker} B Laundry`,
      `${marker} Z Dishes`
    ]);
    expect(
      templates.every((template) => template.labels.includes("Daily Grind"))
    ).toBe(true);
    expect(templates[0]).toMatchObject({
      coverAssetPath: "/assets/fairplay/cards/laundry.png",
      defaultLane: "not_in_play"
    });
  });

  it("searches templates by title and returns source detail fields", async () => {
    const template = await createTemplate({
      slug: "auto",
      title: "Auto",
      labels: ["Out"],
      coverAssetPath: "/assets/fairplay/cards/auto.png",
      defaultLane: "cards_of_concern"
    });

    const searchResults = await listCardTemplates({ q: "aut" });
    const detail = await getCardTemplate(template.id);

    expect(searchResults.map((result) => result.id)).toContain(template.id);
    expect(detail).toMatchObject({
      id: template.id,
      sourceCardId: template.sourceCardId,
      labels: ["Out"],
      definition: "Auto definition",
      conception: "Auto conception",
      planning: "Auto planning",
      execution: "Auto execution",
      minimumStandard: "Auto standard",
      coverAssetPath: "/assets/fairplay/cards/auto.png",
      defaultLane: "cards_of_concern",
      defaultCadence: "weekly",
      hiddenEffortKeys: ["noticing", "planning", "doing"],
      sourceVersion: "test-source",
      importedAt: "2026-05-04T00:00:00.000Z"
    });
  });

  it("creates a household responsibility from a source template", async () => {
    const template = await createTemplate({
      slug: "groceries",
      title: "Groceries",
      labels: ["Daily Grind", "Out"],
      coverAssetPath: "/assets/fairplay/cards/groceries.png"
    });
    const { household, personas } = await createHouseholdWithPersonas({
      householdName: "Template Home",
      usernameNormalized: uniqueUsername("template-home"),
      timezone: "America/Chicago",
      passwordHash: `argon2id-test-hash-${randomUUID()}`,
      hashAlgorithm: "argon2id",
      hashParamsVersion: "test"
    });
    createdHouseholdIds.add(household.id);

    const created = await createResponsibilityFromTemplate({
      householdId: household.id,
      actorPersonaId: personas[0].id,
      templateId: template.id,
      lane: "player_1",
      titleOverride: "Our grocery flow"
    });

    expect(created).toMatchObject({
      title: "Our grocery flow",
      summary: "Groceries summary",
      areaKeys: ["Daily Grind", "Out"],
      hiddenEffortKeys: ["noticing", "planning", "doing"],
      cadence: "weekly",
      visibility: "shared_household",
      boardLane: "player_1",
      householdStandard: "Groceries standard"
    });
    await expect(
      prisma.responsibility.findUniqueOrThrow({
        where: { id: created.id },
        select: {
          templateId: true,
          sourceDefinition: true,
          sourceCoverAssetPath: true
        }
      })
    ).resolves.toEqual({
      templateId: template.id,
      sourceDefinition: "Groceries definition",
      sourceCoverAssetPath: "/assets/fairplay/cards/groceries.png"
    });
  });

  it("creates from a stable source card id and uses the source template default lane", async () => {
    const sourceCard = FAIRPLAY_SOURCE_CARDS.find(
      (template) => template.slug === "auto"
    );
    expect(sourceCard).toBeDefined();

    const { household, personas } = await createHouseholdWithPersonas({
      householdName: "Static Source Home",
      usernameNormalized: uniqueUsername("static-source-home"),
      timezone: "America/Chicago",
      passwordHash: `argon2id-test-hash-${randomUUID()}`,
      hashAlgorithm: "argon2id",
      hashParamsVersion: "test"
    });
    createdHouseholdIds.add(household.id);

    const created = await createResponsibilityFromTemplate({
      householdId: household.id,
      actorPersonaId: personas[0].id,
      templateId: sourceCard!.id
    });

    expect(created).toMatchObject({
      title: sourceCard!.title,
      areaKeys: sourceCard!.labels,
      boardLane: sourceCard!.defaultLane,
      householdStandard: sourceCard!.minimumStandard
    });
    await expect(
      prisma.responsibility.findUniqueOrThrow({
        where: { id: created.id },
        select: {
          sourceDefinition: true,
          sourceCoverAssetPath: true
        }
      })
    ).resolves.toEqual({
      sourceDefinition: sourceCard!.definition,
      sourceCoverAssetPath: sourceCard!.coverAssetPath
    });
  });
});
