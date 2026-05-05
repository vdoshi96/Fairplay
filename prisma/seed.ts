import { PrismaClient } from "@prisma/client";

import type { CardTemplateDetail } from "../src/contracts/card-templates";

const prisma = new PrismaClient();

async function main() {
  const seedModulePath = "../src/seed/fairplay-source-cards.ts";
  const { FAIRPLAY_SOURCE_CARDS } = (await import(seedModulePath)) as {
    FAIRPLAY_SOURCE_CARDS: readonly CardTemplateDetail[];
  };

  for (const template of FAIRPLAY_SOURCE_CARDS) {
    const sourceData = {
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

    await prisma.responsibilityTemplate.upsert({
      where: {
        slug: template.slug
      },
      update: sourceData,
      create: {
        id: template.id,
        slug: template.slug,
        ...sourceData
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
