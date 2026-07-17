import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

const wcagAAndAaTags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa"
];

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

export async function expectNoWcagAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  surface: string
) {
  const results = await new AxeBuilder({ page })
    .withTags(wcagAAndAaTags)
    .analyze();
  const attachmentName = `axe-${surface
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  await testInfo.attach(attachmentName, {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json"
  });

  expect(
    results.violations,
    `${surface} has WCAG A/AA accessibility violations:\n${formatViolations(
      results.violations
    )}`
  ).toEqual([]);
}
