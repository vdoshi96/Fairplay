import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const cardModuleRoot = resolve(repositoryRoot, "src/components/cards");
const importPattern =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

function resolveCardModule(importer: string, specifier: string) {
  let unresolved: string;

  if (specifier.startsWith("@/components/cards/")) {
    unresolved = resolve(
      cardModuleRoot,
      specifier.slice("@/components/cards/".length)
    );
  } else if (specifier.startsWith(".")) {
    unresolved = resolve(dirname(importer), specifier);
  } else {
    return null;
  }

  if (!unresolved.startsWith(cardModuleRoot)) {
    return null;
  }

  return [unresolved, `${unresolved}.ts`, `${unresolved}.tsx`].find((candidate) =>
    existsSync(candidate)
  ) ?? null;
}

function cardImportGraph(entry: string) {
  const visited = new Set<string>();
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) {
      continue;
    }

    visited.add(file);
    const source = readFileSync(file, "utf8");
    importPattern.lastIndex = 0;

    for (const match of source.matchAll(importPattern)) {
      const dependency = resolveCardModule(file, match[1] ?? "");
      if (dependency && !visited.has(dependency)) {
        pending.push(dependency);
      }
    }
  }

  return [...visited].map((file) => relative(repositoryRoot, file));
}

describe("card route client boundaries", () => {
  const cases = [
    {
      entry: "src/app/app/distribute/page.tsx",
      expected: "src/components/cards/deal-workspace.tsx",
      forbidden: [
        "src/components/cards/board-workspace.tsx",
        "src/components/cards/your-deck-workspace.tsx"
      ]
    },
    {
      entry: "src/app/app/board/page.tsx",
      expected: "src/components/cards/board-workspace.tsx",
      forbidden: [
        "src/components/cards/deal-workspace.tsx",
        "src/components/cards/your-deck-workspace.tsx"
      ]
    },
    {
      entry: "src/app/app/your-cards/page.tsx",
      expected: "src/components/cards/your-deck-workspace.tsx",
      forbidden: [
        "src/components/cards/board-workspace.tsx",
        "src/components/cards/deal-workspace.tsx"
      ]
    }
  ];

  for (const routeCase of cases) {
    it(`${routeCase.entry} imports only its route-specific workspace`, () => {
      const graph = cardImportGraph(resolve(repositoryRoot, routeCase.entry));

      expect(graph).toContain(routeCase.expected);
      expect(graph).not.toContain("src/components/cards/card-workspace.tsx");
      routeCase.forbidden.forEach((forbidden) => {
        expect(graph).not.toContain(forbidden);
      });
    });
  }
});
