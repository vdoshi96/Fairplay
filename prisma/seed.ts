import { PrismaClient } from "@prisma/client";

import type { CardTemplateDetail } from "../src/contracts/card-templates";

const prisma = new PrismaClient();

async function main() {
  const seedModulePath = "../src/seed/fairplay-source-cards.ts";
  const { FAIRPLAY_SOURCE_CARDS } = (await import(seedModulePath)) as {
    FAIRPLAY_SOURCE_CARDS: readonly CardTemplateDetail[];
  };

  for (const template of FAIRPLAY_SOURCE_CARDS) {
    const areaKeys = template.labels.map((label) =>
      label
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    );

    await prisma.responsibilityTemplate.upsert({
      where: {
        slug: template.slug
      },
      update: {
        title: template.title,
        summary: template.summary,
        areaKeys,
        defaultCadence: template.defaultCadence,
        hiddenEffortKeys: [...template.hiddenEffortKeys],
        sourceReviewStatus: "needs_review",
        contentVersion: template.sourceVersion
      },
      create: {
        slug: template.slug,
        title: template.title,
        summary: template.summary,
        areaKeys,
        defaultCadence: template.defaultCadence,
        hiddenEffortKeys: [...template.hiddenEffortKeys],
        sourceReviewStatus: "needs_review",
        contentVersion: template.sourceVersion
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
