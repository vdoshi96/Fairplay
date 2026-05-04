# Learned

- The previous `normalizeHouseholdUsername` helper trimmed, lowercased, and collapsed whitespace/hyphens, but did not collapse underscores or reject normalized unsafe values.
- Auth request schemas previously preserved raw usernames. The safest contract for T03 uniqueness and T04 throttling is for parsed output to return the normalized username directly.
- Responsibility visibility mutation tests already cover private-to-visible confirmation. The create contract needed a separate narrower visibility schema because creation and mutation have different safety rules.
- Vitest can safely mirror the TypeScript `@/*` alias with a small Vite `resolve.alias` entry.
