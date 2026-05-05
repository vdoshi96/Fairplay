# Task 10: Library Template Activation

## Expectations

- Keep the source deck usable as actual templates, not just a browse-only gallery.
- Make the "Put in play" action create a real household responsibility.
- Ensure database-seeded templates preserve original source card text, CPE fields, minimum standards, local cover paths, labels, and default board lanes.

## Outputs

- Wired `/app/library` to a server action that creates a responsibility from the selected source card and redirects to the new responsibility detail page.
- Updated the template repository so stable source IDs such as `tpl_auto`, Trello source card IDs, and slugs can resolve to a database template.
- Added on-demand source-template upsert as a safety net when production has not already seeded a specific card.
- Updated `prisma/seed.ts` so future seed runs write the complete personal-use source deck payload, including local `coverAssetPath` values and `approved_original` review status.
- Changed from-template requests so omitting `lane` uses the source template's `defaultLane` instead of forcing every new card into Cards of Concern.

## Verification

- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx vitest run src/contracts/responsibilities.test.ts src/app/api/responsibilities/from-template/route.test.ts src/server/repositories/card-templates.test.ts src/components/library/card-library.test.tsx`: passed, 17 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run prisma:seed`: passed.
- Local DB query for `auto` confirmed source card ID, `{Out}` label, local cover asset, `not_in_play` default lane, and real definition text were written.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm test`: passed, 68 files and 260 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build`: passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e`: passed, 10 Playwright tests.

## Challenges

- The page-level library had been using static source cards for display while the create API expected database template IDs. Stable source IDs now work even when existing seeded rows have generated database UUIDs.
- The old seed script normalized labels into area keys, which meant DB-backed template reads lost the original label chips. The seed now stores the original source labels for template display and creation.
