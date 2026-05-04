import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedModulePath = "../src/seed/demo-content.ts";
  const { DEMO_RESPONSIBILITY_TEMPLATES } = await import(seedModulePath);

  for (const template of DEMO_RESPONSIBILITY_TEMPLATES) {
    await prisma.responsibilityTemplate.upsert({
      where: {
        slug: template.slug
      },
      update: {
        title: template.title,
        summary: template.summary,
        areaKeys: [...template.areaKeys],
        defaultCadence: template.defaultCadence,
        hiddenEffortKeys: [...template.hiddenEffortKeys],
        sourceReviewStatus: template.sourceReviewStatus,
        contentVersion: template.contentVersion
      },
      create: {
        slug: template.slug,
        title: template.title,
        summary: template.summary,
        areaKeys: [...template.areaKeys],
        defaultCadence: template.defaultCadence,
        hiddenEffortKeys: [...template.hiddenEffortKeys],
        sourceReviewStatus: template.sourceReviewStatus,
        contentVersion: template.contentVersion
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
