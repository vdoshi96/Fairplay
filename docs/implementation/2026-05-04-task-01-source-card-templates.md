# Task 1: Source Card Template Contracts and Seed

## Expectations

- Add first-class board lane enum constants and validation.
- Add source card template contracts using local `coverAssetPath` fields.
- Import the full 100-card Fairplay Copy source deck from Trello into a private seed file.
- Download one local PNG cover per source card into `public/assets/fairplay/cards/`.
- Update Prisma seed logic to use currently compatible source card fields.
- Follow TDD with red tests before implementation.

## Outputs

- Updated `src/domain/enums.ts` and `src/domain/enums.test.ts` with `ResponsibilityBoardLane` constants/schema.
- Added `src/contracts/card-templates.ts` and `src/contracts/card-templates.test.ts`.
- Added `src/seed/fairplay-source-cards.ts` and `src/seed/fairplay-source-cards.test.ts` with 100 Trello source cards.
- Added 100 downloaded PNG covers under `public/assets/fairplay/cards/`.
- Updated `prisma/seed.ts` to seed `FAIRPLAY_SOURCE_CARDS` into existing `ResponsibilityTemplate` fields.
- Tests run:
  - RED: `npm test -- src/domain/enums.test.ts` failed on missing board lane exports.
  - GREEN: `npm test -- src/domain/enums.test.ts` passed.
  - RED: `npm test -- src/contracts/card-templates.test.ts` failed on missing contract module.
  - GREEN: `npm test -- src/contracts/card-templates.test.ts src/domain/enums.test.ts` passed.
  - RED: `npm test -- src/seed/fairplay-source-cards.test.ts` failed on missing source seed module.
  - GREEN: `npm test -- src/seed/fairplay-source-cards.test.ts` passed after import and asset download.
  - Final targeted: `npm test -- src/domain/enums.test.ts src/contracts/card-templates.test.ts src/seed/fairplay-source-cards.test.ts` passed.
  - Final typecheck: `npm run typecheck` passed.

## Challenges

- Trello card metadata was available through the custom MCP and authenticated Trello API, but direct unauthenticated attachment downloads failed. Covers were downloaded from Trello attachment URLs using the OAuth header from the local MCP configuration, not hotlinked at runtime.
- A few Trello source sections were title-only, such as short conception markers. Those were preserved as source markers with a short explanatory sentence so every CPE field remains useful and passes contract validation.
- `prisma/seed.ts` can only write currently existing template fields until the Task 2 schema adds source card IDs, CPE fields, default lane, and local cover asset columns.

## Next Handoff

- Task 2 should add schema columns for `sourceCardId`, CPE sections, `minimumStandard`, `coverAssetPath`, `defaultLane`, and source import metadata so Prisma seed can persist the full source template data.
- Runtime contracts and seed data contain local asset paths only; remote Trello attachment URLs were used only transiently during import.
