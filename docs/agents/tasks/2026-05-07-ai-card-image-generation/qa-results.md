# QA Results

## Automated Verification

- Focused AI draft contracts/service/repository/provider/UI/route suite: 9 files, 112 tests passed.
- OpenAI fallback image prompt suite: 1 file, 12 tests passed after aligning the fallback prompt expectation with the new Library-card style.
- Full Vitest suite: 96 files, 540 tests passed.
- Typecheck passed with `tsc --noEmit`.
- Lint passed with `eslint .`.
- Production build passed with `next build`.
- Prisma schema validation passed.

## Visual QA

- Inspected current Library card assets at `public/assets/fairplay/cards/auto.png` and `public/assets/fairplay/cards/laundry.png`.
- Confirmed both reference assets are 500x700 portrait PNGs.
- Ran live Qwen image smoke tests with real environment variables from `.env.local`.
- Stored smoke-test outputs under ignored `test-results/ai-card-image-generation/` for local inspection.

## Flow Coverage

- Creating a text prompt now requires text generation and cover generation before ready.
- Failed drafts with generated text but missing cover can retry cover generation.
- Ready drafts expose cover paths in contract parsing.
- Tracker cards and review panels show generated cover images when available.
- Put-in-play carries the cover path into the accepted responsibility.

## Not Covered

- Browser e2e against a live authenticated session was not run.
- Pixel-diff comparison against the current Library assets was not added because generated-provider output is nondeterministic.
