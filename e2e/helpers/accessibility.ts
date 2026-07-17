import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

const blockingImpacts = new Set(["critical", "serious"]);

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]
) {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 5)
        .map((node) => `    - ${node.target.join(" ")}`)
        .join("\n");

      return [
        `${violation.impact ?? "unknown"}: ${violation.id} — ${violation.help}`,
        `  ${violation.helpUrl}`,
        targets
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export async function expectNoSeriousAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  surface: string
) {
  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter((violation) =>
    violation.impact ? blockingImpacts.has(violation.impact) : false
  );

  if (blockingViolations.length > 0) {
    await testInfo.attach(
      `axe-${surface.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json"
      }
    );
  }

  expect(
    blockingViolations,
    `${surface} has serious or critical accessibility violations:\n${formatViolations(
      blockingViolations
    )}`
  ).toEqual([]);
}
