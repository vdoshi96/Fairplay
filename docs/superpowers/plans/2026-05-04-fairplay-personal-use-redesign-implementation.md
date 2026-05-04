# Fairplay Personal-Use Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Fairplay MVP into a polished private Fair Play companion with a full source card library, Trello-style board movement, persistent welcome, and a restartable crash course grounded in the EPUB research reports.

**Architecture:** Add source-card templates and board placement to the existing Prisma-backed responsibility model, then layer a premium board-centered UI on top of explicit API contracts. The first implementation branch should land data contracts, schema, and a usable board/card surface before subsequent branches deepen crash-course polish, radar/check-in alignment, and end-to-end verification.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 6, PostgreSQL, Zod, Vitest, Testing Library, Tailwind CSS, `@dnd-kit` for drag/drop, `lucide-react` for icons.

---

## Build Decisions

- Source-derived card content is allowed in this private repository and private deployment.
- The full 100-card source seed should be committed as TypeScript data in `src/seed/fairplay-source-cards.ts` on the implementation branch.
- All source card covers must be downloaded into `public/assets/fairplay/cards/` and committed to GitHub. The app must reference local paths such as `/assets/fairplay/cards/auto.png`; it must not hotlink Trello attachment URLs at runtime.
- Persona display names remain household-configurable. Board lanes use Trello lane names, with `player_1` mapped to the first persona key and `player_2` mapped to the second persona key.
- `kid_split` is a lane in the first release. Structured child/context split ownership can be added after drag/drop and detail sheets are stable.
- `cards_of_concern` remains a board lane and can create Radar items; it is not merged into Radar.

## Required Worker Documentation

Every subagent that changes or reviews code must write a Markdown handoff under `docs/implementation/`.

Use this exact file pattern:

```text
docs/implementation/2026-05-04-task-<number>-<slug>.md
```

Use this exact report structure:

```markdown
# Task <number>: <Title>

## Expectations

- <What the worker was asked to build or verify.>

## Outputs

- <Files changed.>
- <Tests run and their results.>
- <Commits created, if any.>

## Challenges

- <Blockers, tradeoffs, unresolved risks, or "None".>

## Next Handoff

- <What the next worker should know.>
```

Workers must update their report before returning `DONE`, `DONE_WITH_CONCERNS`, or `BLOCKED`.

## File Structure

### Data, Domain, Contracts

- Modify `prisma/schema.prisma`
  - Add `ResponsibilityBoardLane`.
  - Expand `ResponsibilityTemplate` with source card fields.
  - Add placement fields to `Responsibility`.
  - Add persona-scoped onboarding preferences.
  - Keep `ResponsibilityEvent` for lane/owner movement events.
- Create `prisma/migrations/20260504190000_personal_use_redesign/migration.sql`
  - SQL migration matching the schema changes.
- Modify `src/domain/enums.ts`
  - Add board lane constants and Zod schema.
- Modify `src/domain/enums.test.ts`
  - Assert board lane values and validation.
- Create `src/contracts/card-templates.ts`
  - Template summary/detail/import contracts.
- Create `src/contracts/card-templates.test.ts`
  - Contract tests for CPE fields, labels, local cover asset path, and lane.
- Modify `src/contracts/responsibilities.ts`
  - Add lane and sort order to summary/detail.
  - Add board placement mutation schema.
  - Add from-template mutation schema.
- Modify `src/contracts/responsibilities.test.ts`
  - Validate placement and from-template payloads.
- Create `src/contracts/preferences.ts`
  - Persona onboarding/welcome preference contracts.
- Create `src/contracts/preferences.test.ts`
  - Preference mutation tests.
- Create `src/seed/fairplay-source-cards.ts`
  - Full private source-card seed from Trello/workbook.
- Create `src/seed/fairplay-source-cards.test.ts`
  - Assert 100 unique source cards, required CPE fields, lane defaults, label mapping, and local cover assets.
- Create files under `public/assets/fairplay/cards/`
  - One downloaded PNG cover per source card, using the source template slug as the filename.
- Modify `prisma/seed.ts`
  - Seed the full source card library.

### Server, Repositories, Routes

- Create `src/server/repositories/card-templates.ts`
  - List/search/get source templates and instantiate household responsibilities.
- Create `src/server/repositories/card-templates.test.ts`
  - Repository tests for source card listing and from-template instantiation.
- Modify `src/server/repositories/responsibilities.ts`
  - Include board lane/sort/source template fields.
  - Add `updateResponsibilityBoardPlacement`.
- Modify `src/server/repositories/persistence.integration.test.ts`
  - Assert migrated fields persist.
- Create `src/server/repositories/preferences.ts`
  - Get/update persona onboarding preferences.
- Create `src/server/repositories/preferences.test.ts`
  - Server-side persistence tests.
- Create `src/app/api/card-templates/route.ts`
  - `GET /api/card-templates`.
- Create `src/app/api/card-templates/route.test.ts`
  - Route tests for search/filter output.
- Create `src/app/api/responsibilities/from-template/route.ts`
  - `POST /api/responsibilities/from-template`.
- Create `src/app/api/responsibilities/from-template/route.test.ts`
  - Route tests for household scoping.
- Create `src/app/api/responsibilities/[id]/board-placement/route.ts`
  - `PATCH /api/responsibilities/[id]/board-placement`.
- Create `src/app/api/responsibilities/[id]/board-placement/route.test.ts`
  - Route tests for lane movement, sort order, and event creation.
- Create `src/app/api/preferences/onboarding/route.ts`
  - `GET/PATCH /api/preferences/onboarding`.
- Create `src/app/api/preferences/onboarding/route.test.ts`
  - Route tests for crash-course and welcome persistence.
- Create `src/app/api/preferences/welcome/replay/route.ts`
  - `POST /api/preferences/welcome/replay`.
- Create `src/app/api/preferences/welcome/replay/route.test.ts`
  - Route test for resetting welcome dismissal.

### UI and App Experience

- Modify `package.json` and lockfile
  - Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `lucide-react`.
- Modify `src/app/globals.css`
  - Add premium tokens, lane colors, card surfaces, reduced-motion handling.
- Create `src/components/ui/button.tsx`
- Create `src/components/ui/chip.tsx`
- Create `src/components/ui/sheet.tsx`
- Create `src/components/ui/segmented-control.tsx`
- Create `src/components/ui/surface.tsx`
- Create `src/components/ui/icon-button.tsx`
- Create `src/components/ui/ui-primitives.test.tsx`
  - Test keyboard labels, disabled states, and overflow-safe classes.
- Modify `src/components/app-shell/app-shell.tsx`
  - Premium route chrome, sidebar/tab bar, Settings/crash-course entry.
- Modify `src/components/app-shell/app-shell.test.tsx`
  - Route active state and crash-course action.
- Create `src/components/welcome/persistent-welcome.tsx`
  - Server-backed welcome splash.
- Create `src/components/welcome/persistent-welcome.test.tsx`
  - Persists until close and can replay.
- Create `src/components/crash-course/crash-course-content.ts`
  - Ten-lesson curriculum from the two book reports.
- Create `src/components/crash-course/crash-course-flow.tsx`
  - Skippable, restartable, progress-aware guided course.
- Create `src/components/crash-course/crash-course-flow.test.tsx`
  - Lesson navigation, skip, restart, and interactive standards prompt.
- Create `src/app/app/crash-course/page.tsx`
  - Crash-course route.
- Modify `src/components/settings/settings-panel.tsx`
  - Add `Restart crash course` and `Show welcome again`.
- Modify `src/components/settings/settings-panel.test.tsx`
  - Settings replay tests.
- Create `src/components/library/card-library.tsx`
  - Search/filter/browse source templates.
- Create `src/components/library/card-library.test.tsx`
  - Search, label filter, and from-template action tests.
- Create `src/app/app/library/page.tsx`
  - Library route.
- Create `src/components/cards/card-detail-sheet.tsx`
  - Rich card face/detail sheet with CPE, standards, lane, owner, radar actions.
- Create `src/components/cards/card-detail-sheet.test.tsx`
  - CPE tabs/sections and action tests.
- Modify `src/app/app/responsibilities/[id]/page.tsx`
  - Use the card detail sheet/page.
- Modify `src/components/responsibilities/responsibility-load-map.tsx`
  - Replace plain list with Trello-style board using drag/drop and keyboard movement.
- Modify `src/components/responsibilities/responsibility-load-map.test.tsx`
  - Movement fallback, lane counts, filters, keyboard move tests.
- Modify `src/app/app/load-map/page.tsx`
  - Feed board lane data and source-card context.
- Modify `src/app/app/home/page.tsx`
  - Command-center overview and progress summary.
- Modify `src/components/radar/radar-board.tsx`
  - Visual and conceptual alignment with concern lane.
- Modify `src/components/check-ins/check-in-flow.tsx`
  - Visual and conceptual alignment with handoffs and re-deals.

## Task 0: Branch, Dependencies, and Work Journal

**Files:**
- Create: `docs/implementation/2026-05-04-controller-build-log.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Create implementation branch from the approved spec branch**

Run from app worktree:

```bash
cd /Users/vishal/Developer/Fairplay/.worktrees/v1-app
git switch -c codex/personal-use-redesign codex/research-and-spec
```

Expected: branch `codex/personal-use-redesign` checked out and app files present.

- [ ] **Step 2: Write controller build log**

Create `docs/implementation/2026-05-04-controller-build-log.md`:

```markdown
# Controller Build Log: Personal-Use Redesign

## Expectations

- Build from the approved personal-use redesign spec.
- Keep implementation documentation reviewable.
- Dispatch workers with disjoint file ownership where practical.
- Preserve user changes and avoid destructive git operations.

## Outputs

- Implementation plan: `docs/superpowers/plans/2026-05-04-fairplay-personal-use-redesign-implementation.md`.
- Implementation branch: `codex/personal-use-redesign`.

## Challenges

- The full 100-card data import is content-heavy and should be isolated from UI work.
- Schema changes are a dependency for board placement, preferences, and source-card APIs.

## Next Handoff

- Start with source template contracts/schema and UI primitives in parallel only when file ownership is disjoint.
```

- [ ] **Step 3: Install UI dependencies**

Run:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
```

Expected: dependencies added to `package.json` and `package-lock.json`.

- [ ] **Step 4: Verify dependency install**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit setup**

Run:

```bash
git add package.json package-lock.json docs/implementation/2026-05-04-controller-build-log.md
git commit -m "chore: start personal-use redesign branch"
```

Expected: one setup commit on `codex/personal-use-redesign`.

## Task 1: Source Card Template Contracts and Seed

**Files:**
- Modify: `src/domain/enums.ts`
- Modify: `src/domain/enums.test.ts`
- Create: `src/contracts/card-templates.ts`
- Create: `src/contracts/card-templates.test.ts`
- Create: `src/seed/fairplay-source-cards.ts`
- Create: `src/seed/fairplay-source-cards.test.ts`
- Modify: `prisma/seed.ts`
- Create: `docs/implementation/2026-05-04-task-01-source-card-templates.md`

- [ ] **Step 1: Write failing enum test**

Add to `src/domain/enums.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  ResponsibilityBoardLaneSchema,
  RESPONSIBILITY_BOARD_LANES
} from "./enums";

describe("ResponsibilityBoardLaneSchema", () => {
  it("matches the Trello board lane order", () => {
    expect(RESPONSIBILITY_BOARD_LANES).toEqual([
      "cards_of_concern",
      "player_1",
      "player_2",
      "kid_split",
      "not_in_play",
      "trimmed"
    ]);
    expect(ResponsibilityBoardLaneSchema.parse("not_in_play")).toBe("not_in_play");
    expect(() => ResponsibilityBoardLaneSchema.parse("backlog")).toThrow();
  });
});
```

- [ ] **Step 2: Run enum test and verify RED**

Run:

```bash
npm test -- src/domain/enums.test.ts
```

Expected: FAIL because `ResponsibilityBoardLaneSchema` and `RESPONSIBILITY_BOARD_LANES` are not exported yet.

- [ ] **Step 3: Implement board lane enum constants**

Add to `src/domain/enums.ts`:

```ts
export const RESPONSIBILITY_BOARD_LANES = [
  "cards_of_concern",
  "player_1",
  "player_2",
  "kid_split",
  "not_in_play",
  "trimmed"
] as const;

export const ResponsibilityBoardLaneSchema = z.enum(RESPONSIBILITY_BOARD_LANES);
export type ResponsibilityBoardLane = z.infer<typeof ResponsibilityBoardLaneSchema>;
```

- [ ] **Step 4: Verify enum test passes**

Run:

```bash
npm test -- src/domain/enums.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing card-template contract tests**

Create `src/contracts/card-templates.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  CardTemplateDetailSchema,
  CardTemplateLabelSchema,
  CardTemplateSummarySchema
} from "./card-templates";

describe("CardTemplate contracts", () => {
  it("accepts source card detail with CPE and cover metadata", () => {
    const detail = CardTemplateDetailSchema.parse({
      id: "tpl_auto",
      sourceCardId: "trello_auto",
      slug: "auto",
      title: "Auto",
      labels: ["Out", "Daily Grind"],
      summary: "Vehicle responsibility summary.",
      definition: "Keep vehicle needs visible and handled.",
      conception: "Notice repairs, documents, fuel, and timing.",
      planning: "Schedule service, gather records, and arrange transport.",
      execution: "Complete service, registration, refuel, and follow-through.",
      minimumStandard: "The vehicle is available, legal, and safe enough for planned use.",
      coverAssetPath: "/assets/fairplay/cards/auto.png",
      defaultLane: "not_in_play",
      defaultCadence: "as_needed",
      hiddenEffortKeys: ["noticing", "planning", "doing", "follow_through"],
      sourceVersion: "trello-fairplay-copy-2026-05-04",
      importedAt: "2026-05-04T00:00:00.000Z"
    });

    expect(detail.defaultLane).toBe("not_in_play");
    expect(detail.conception).toContain("Notice");
  });

  it("rejects unknown labels and incomplete summaries", () => {
    expect(() => CardTemplateLabelSchema.parse("Kitchen")).toThrow();
    expect(() =>
      CardTemplateSummarySchema.parse({
        id: "tpl_auto",
        slug: "auto",
        title: "Auto",
        labels: ["Out"],
        summary: "Vehicle responsibility summary.",
        defaultLane: "not_in_play"
      })
    ).toThrow();
  });
});
```

- [ ] **Step 6: Run contract test and verify RED**

Run:

```bash
npm test -- src/contracts/card-templates.test.ts
```

Expected: FAIL because `src/contracts/card-templates.ts` does not exist.

- [ ] **Step 7: Implement card-template contracts**

Create `src/contracts/card-templates.ts`:

```ts
import { z } from "zod";

import {
  CadenceSchema,
  HiddenEffortKeySchema,
  ResponsibilityBoardLaneSchema
} from "../domain/enums";
import { IsoDateTimeSchema } from "../domain/time";

export const CARD_TEMPLATE_LABELS = [
  "Daily Grind",
  "Caregiving",
  "Out",
  "Home",
  "Magic",
  "Wild",
  "Happiness Trio",
  "Kids",
  "Kid Split"
] as const;

export const CardTemplateLabelSchema = z.enum(CARD_TEMPLATE_LABELS);

export const CardTemplateSummarySchema = z
  .object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(140),
    labels: z.array(CardTemplateLabelSchema),
    summary: z.string().trim().min(1).max(700),
    coverAssetPath: z
      .string()
      .regex(/^\/assets\/fairplay\/cards\/[a-z0-9-]+\.png$/)
      .nullable()
      .optional(),
    defaultLane: ResponsibilityBoardLaneSchema
  })
  .strict();

export const CardTemplateDetailSchema = CardTemplateSummarySchema.extend({
  sourceCardId: z.string().trim().min(1),
  definition: z.string().trim().min(1).max(3000),
  conception: z.string().trim().min(1).max(3000),
  planning: z.string().trim().min(1).max(3000),
  execution: z.string().trim().min(1).max(3000),
  minimumStandard: z.string().trim().min(1).max(3000),
  defaultCadence: CadenceSchema,
  hiddenEffortKeys: z.array(HiddenEffortKeySchema),
  sourceVersion: z.string().trim().min(1).max(120),
  importedAt: IsoDateTimeSchema
}).strict();

export const CardTemplateSearchParamsSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    labels: z.array(CardTemplateLabelSchema).optional(),
    lane: ResponsibilityBoardLaneSchema.optional()
  })
  .strict();

export type CardTemplateLabel = z.infer<typeof CardTemplateLabelSchema>;
export type CardTemplateSummary = z.infer<typeof CardTemplateSummarySchema>;
export type CardTemplateDetail = z.infer<typeof CardTemplateDetailSchema>;
export type CardTemplateSearchParams = z.infer<typeof CardTemplateSearchParamsSchema>;
```

- [ ] **Step 8: Verify contract tests pass**

Run:

```bash
npm test -- src/contracts/card-templates.test.ts src/domain/enums.test.ts
```

Expected: PASS.

- [ ] **Step 9: Write failing seed tests**

Create `src/seed/fairplay-source-cards.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CardTemplateDetailSchema } from "../contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS, FAIRPLAY_SOURCE_VERSION } from "./fairplay-source-cards";

describe("FAIRPLAY_SOURCE_CARDS", () => {
  it("contains the full personal-use deck with unique slugs", () => {
    expect(FAIRPLAY_SOURCE_VERSION).toBe("trello-fairplay-copy-2026-05-04");
    expect(FAIRPLAY_SOURCE_CARDS).toHaveLength(100);

    const slugs = new Set(FAIRPLAY_SOURCE_CARDS.map((card) => card.slug));
    const sourceIds = new Set(FAIRPLAY_SOURCE_CARDS.map((card) => card.sourceCardId));

    expect(slugs.size).toBe(100);
    expect(sourceIds.size).toBe(100);
  });

  it("has CPE, standard, labels, a default Not in Play lane, and local cover asset for every card", () => {
    for (const card of FAIRPLAY_SOURCE_CARDS) {
      const parsed = CardTemplateDetailSchema.parse(card);

      expect(parsed.defaultLane).toBe("not_in_play");
      expect(parsed.definition.length).toBeGreaterThan(10);
      expect(parsed.conception.length).toBeGreaterThan(10);
      expect(parsed.planning.length).toBeGreaterThan(10);
      expect(parsed.execution.length).toBeGreaterThan(10);
      expect(parsed.minimumStandard.length).toBeGreaterThan(10);
      expect(parsed.labels.length).toBeGreaterThan(0);
      expect(parsed.coverAssetPath).toBe(`/assets/fairplay/cards/${parsed.slug}.png`);
      expect(existsSync(join(process.cwd(), "public", parsed.coverAssetPath))).toBe(true);
    }
  });
});
```

- [ ] **Step 10: Run seed test and verify RED**

Run:

```bash
npm test -- src/seed/fairplay-source-cards.test.ts
```

Expected: FAIL because `src/seed/fairplay-source-cards.ts` does not exist.

- [ ] **Step 11: Implement full source card seed**

Create `src/seed/fairplay-source-cards.ts` with this export shape and 100 real cards from Trello board `69f82d290f1cabd66e0fad29`, list `69f82d290f1cabd66e0fad23`:

```ts
import type { CardTemplateDetail } from "../contracts/card-templates";

export const FAIRPLAY_SOURCE_VERSION = "trello-fairplay-copy-2026-05-04";
export const FAIRPLAY_SOURCE_IMPORTED_AT = "2026-05-04T00:00:00.000Z";

export const FAIRPLAY_SOURCE_CARDS = [] satisfies CardTemplateDetail[];
```

Populate the array with the complete 100-card data before running the seed tests. Preserve original title casing from Trello. Use the Trello labels exactly from the board labels. Set every `defaultLane` to `not_in_play`. Use `as_needed` cadence unless the card label/content clearly indicates `daily`, `weekly`, `monthly`, `seasonal`, `event_based`, or `one_time`. Download each card PNG cover from its Trello attachment into `public/assets/fairplay/cards/<slug>.png`, commit those image files, and set `coverAssetPath` to `/assets/fairplay/cards/<slug>.png`. Keep any remote attachment URL out of runtime contracts and UI props.

- [ ] **Step 12: Verify seed tests pass**

Run:

```bash
npm test -- src/seed/fairplay-source-cards.test.ts
```

Expected: PASS with 100 cards.

- [ ] **Step 13: Update Prisma seed to use full source library**

Modify `prisma/seed.ts` so it imports `FAIRPLAY_SOURCE_CARDS` and upserts every card into `responsibilityTemplate`. The loop should write CPE/source fields added in Task 2 once the schema is available. Until Task 2 lands, keep the import ready and write existing compatible fields only:

```ts
const seedModulePath = "../src/seed/fairplay-source-cards.ts";
const { FAIRPLAY_SOURCE_CARDS } = await import(seedModulePath);
```

- [ ] **Step 14: Write worker report**

Create `docs/implementation/2026-05-04-task-01-source-card-templates.md` with Expectations, Outputs, Challenges, and Next Handoff.

- [ ] **Step 15: Commit Task 1**

Run:

```bash
git add src/domain/enums.ts src/domain/enums.test.ts src/contracts/card-templates.ts src/contracts/card-templates.test.ts src/seed/fairplay-source-cards.ts src/seed/fairplay-source-cards.test.ts prisma/seed.ts docs/implementation/2026-05-04-task-01-source-card-templates.md
git commit -m "feat: add source card template contracts"
```

Expected: one commit with passing targeted tests.

## Task 2: Board Schema, Preferences, and Placement Contracts

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260504190000_personal_use_redesign/migration.sql`
- Modify: `src/contracts/responsibilities.ts`
- Modify: `src/contracts/responsibilities.test.ts`
- Create: `src/contracts/preferences.ts`
- Create: `src/contracts/preferences.test.ts`
- Create: `docs/implementation/2026-05-04-task-02-board-schema-preferences.md`

- [ ] **Step 1: Write failing responsibility placement contract test**

Add to `src/contracts/responsibilities.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  ResponsibilityBoardPlacementMutationSchema,
  ResponsibilityFromTemplateMutationSchema,
  ResponsibilitySummarySchema
} from "./responsibilities";

describe("Responsibility board contracts", () => {
  it("validates board placement mutations", () => {
    expect(
      ResponsibilityBoardPlacementMutationSchema.parse({
        responsibilityId: "resp_123",
        toLane: "player_1",
        sortOrder: 4,
        actorPersonaId: "persona_123"
      })
    ).toMatchObject({
      toLane: "player_1",
      sortOrder: 4
    });

    expect(() =>
      ResponsibilityBoardPlacementMutationSchema.parse({
        responsibilityId: "resp_123",
        toLane: "parking_lot",
        sortOrder: -1
      })
    ).toThrow();
  });

  it("exposes lane and sort order on summaries", () => {
    const summary = ResponsibilitySummarySchema.parse({
      id: "resp_123",
      title: "Auto",
      areaKeys: ["Out"],
      hiddenEffortKeys: ["planning"],
      cadence: "as_needed",
      relevantDays: [],
      status: "unassigned",
      visibility: "shared_household",
      boardLane: "not_in_play",
      boardSortOrder: 12,
      linkedRadarItems: [],
      currentAssignments: [],
      nextReviewAt: null
    });

    expect(summary.boardLane).toBe("not_in_play");
  });

  it("validates from-template creation", () => {
    expect(
      ResponsibilityFromTemplateMutationSchema.parse({
        templateId: "tpl_auto",
        actorPersonaId: "persona_123",
        lane: "cards_of_concern"
      })
    ).toMatchObject({ lane: "cards_of_concern" });
  });
});
```

- [ ] **Step 2: Run responsibility contract test and verify RED**

Run:

```bash
npm test -- src/contracts/responsibilities.test.ts
```

Expected: FAIL because new schemas and fields do not exist.

- [ ] **Step 3: Implement placement contracts**

Modify `src/contracts/responsibilities.ts`:

```ts
import { ResponsibilityBoardLaneSchema } from "../domain/enums";
import { PersonaIdSchema, ResponsibilityIdSchema } from "../domain/ids";

export const ResponsibilityBoardPlacementMutationSchema = z
  .object({
    responsibilityId: ResponsibilityIdSchema,
    toLane: ResponsibilityBoardLaneSchema,
    sortOrder: z.number().int().nonnegative(),
    actorPersonaId: PersonaIdSchema.optional(),
    note: z.string().trim().max(1000).optional()
  })
  .strict();

export const ResponsibilityFromTemplateMutationSchema = z
  .object({
    templateId: z.string().trim().min(1),
    actorPersonaId: PersonaIdSchema,
    lane: ResponsibilityBoardLaneSchema.default("cards_of_concern"),
    titleOverride: z.string().trim().min(1).max(140).optional()
  })
  .strict();
```

Extend `ResponsibilitySummarySchema` with:

```ts
boardLane: ResponsibilityBoardLaneSchema,
boardSortOrder: z.number().int().nonnegative()
```

Export the inferred types.

- [ ] **Step 4: Write failing preferences contract tests**

Create `src/contracts/preferences.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  OnboardingPreferencesMutationSchema,
  OnboardingPreferencesSchema
} from "./preferences";

describe("onboarding preferences contracts", () => {
  it("persists crash course and welcome state by persona", () => {
    const preferences = OnboardingPreferencesSchema.parse({
      personaId: "persona_123",
      welcomeDismissedAt: null,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 3,
      crashCourseReplayRequestedAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-05-04T12:00:00.000Z"
    });

    expect(preferences.crashCourseCurrentStep).toBe(3);
  });

  it("validates preference updates", () => {
    expect(
      OnboardingPreferencesMutationSchema.parse({
        welcomeDismissedAt: "2026-05-04T12:00:00.000Z",
        crashCourseCurrentStep: 1
      })
    ).toMatchObject({ crashCourseCurrentStep: 1 });

    expect(() =>
      OnboardingPreferencesMutationSchema.parse({
        crashCourseCurrentStep: -1
      })
    ).toThrow();
  });
});
```

- [ ] **Step 5: Run preferences contract test and verify RED**

Run:

```bash
npm test -- src/contracts/preferences.test.ts
```

Expected: FAIL because `src/contracts/preferences.ts` does not exist.

- [ ] **Step 6: Implement preference contracts**

Create `src/contracts/preferences.ts`:

```ts
import { z } from "zod";

import { PersonaIdSchema } from "../domain/ids";
import { IsoDateTimeSchema, NullableIsoDateTimeSchema } from "../domain/time";

export const OnboardingPreferencesSchema = z
  .object({
    personaId: PersonaIdSchema,
    welcomeDismissedAt: NullableIsoDateTimeSchema,
    crashCourseSkippedAt: NullableIsoDateTimeSchema,
    crashCourseCompletedAt: NullableIsoDateTimeSchema,
    crashCourseCurrentStep: z.number().int().min(0).max(20),
    crashCourseReplayRequestedAt: NullableIsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const OnboardingPreferencesMutationSchema = z
  .object({
    welcomeDismissedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseSkippedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseCompletedAt: NullableIsoDateTimeSchema.optional(),
    crashCourseCurrentStep: z.number().int().min(0).max(20).optional(),
    crashCourseReplayRequestedAt: NullableIsoDateTimeSchema.optional()
  })
  .strict();

export type OnboardingPreferences = z.infer<typeof OnboardingPreferencesSchema>;
export type OnboardingPreferencesMutation = z.infer<
  typeof OnboardingPreferencesMutationSchema
>;
```

- [ ] **Step 7: Update Prisma schema**

Modify `prisma/schema.prisma`:

```prisma
enum ResponsibilityBoardLane {
  cards_of_concern
  player_1
  player_2
  kid_split
  not_in_play
  trimmed
}

model Persona {
  onboardingPreferences PersonaOnboardingPreferences?
}

model PersonaOnboardingPreferences {
  id                            String    @id @default(uuid())
  personaId                     String    @unique
  welcomeDismissedAt            DateTime?
  crashCourseSkippedAt          DateTime?
  crashCourseCompletedAt        DateTime?
  crashCourseCurrentStep        Int       @default(0)
  crashCourseReplayRequestedAt  DateTime?
  createdAt                     DateTime  @default(now())
  updatedAt                     DateTime  @updatedAt
  persona                       Persona   @relation(fields: [personaId], references: [id], onDelete: Cascade)
}
```

Add to `ResponsibilityTemplate`:

```prisma
sourceCardId       String? @unique
definition         String?
conception         String?
planning           String?
execution          String?
minimumStandard    String?
coverAssetPath     String?
defaultLane        ResponsibilityBoardLane @default(not_in_play)
sourceVersion      String?
importedAt         DateTime?
```

Add to `Responsibility`:

```prisma
boardLane       ResponsibilityBoardLane @default(cards_of_concern)
boardSortOrder  Int                     @default(0)
sourceDefinition       String?
sourceConception       String?
sourcePlanning         String?
sourceExecution        String?
sourceMinimumStandard  String?
sourceCoverAssetPath   String?
```

Add indexes:

```prisma
@@index([householdId, boardLane, boardSortOrder])
@@index([templateId])
```

- [ ] **Step 8: Create SQL migration**

Create `prisma/migrations/20260504190000_personal_use_redesign/migration.sql`:

```sql
CREATE TYPE "ResponsibilityBoardLane" AS ENUM (
  'cards_of_concern',
  'player_1',
  'player_2',
  'kid_split',
  'not_in_play',
  'trimmed'
);

ALTER TABLE "ResponsibilityTemplate"
  ADD COLUMN "sourceCardId" TEXT,
  ADD COLUMN "definition" TEXT,
  ADD COLUMN "conception" TEXT,
  ADD COLUMN "planning" TEXT,
  ADD COLUMN "execution" TEXT,
  ADD COLUMN "minimumStandard" TEXT,
  ADD COLUMN "coverAssetPath" TEXT,
  ADD COLUMN "defaultLane" "ResponsibilityBoardLane" NOT NULL DEFAULT 'not_in_play',
  ADD COLUMN "sourceVersion" TEXT,
  ADD COLUMN "importedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ResponsibilityTemplate_sourceCardId_key"
  ON "ResponsibilityTemplate"("sourceCardId");

ALTER TABLE "Responsibility"
  ADD COLUMN "boardLane" "ResponsibilityBoardLane" NOT NULL DEFAULT 'cards_of_concern',
  ADD COLUMN "boardSortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sourceDefinition" TEXT,
  ADD COLUMN "sourceConception" TEXT,
  ADD COLUMN "sourcePlanning" TEXT,
  ADD COLUMN "sourceExecution" TEXT,
  ADD COLUMN "sourceMinimumStandard" TEXT,
  ADD COLUMN "sourceCoverAssetPath" TEXT;

CREATE INDEX "Responsibility_householdId_boardLane_boardSortOrder_idx"
  ON "Responsibility"("householdId", "boardLane", "boardSortOrder");
CREATE INDEX "Responsibility_templateId_idx"
  ON "Responsibility"("templateId");

CREATE TABLE "PersonaOnboardingPreferences" (
  "id" TEXT NOT NULL,
  "personaId" TEXT NOT NULL,
  "welcomeDismissedAt" TIMESTAMP(3),
  "crashCourseSkippedAt" TIMESTAMP(3),
  "crashCourseCompletedAt" TIMESTAMP(3),
  "crashCourseCurrentStep" INTEGER NOT NULL DEFAULT 0,
  "crashCourseReplayRequestedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonaOnboardingPreferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonaOnboardingPreferences_personaId_key"
  ON "PersonaOnboardingPreferences"("personaId");

ALTER TABLE "PersonaOnboardingPreferences"
  ADD CONSTRAINT "PersonaOnboardingPreferences_personaId_fkey"
  FOREIGN KEY ("personaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 9: Validate Prisma schema**

Run:

```bash
npm run prisma:validate
npm run prisma:generate
```

Expected: both PASS.

- [ ] **Step 10: Verify contracts pass**

Run:

```bash
npm test -- src/contracts/responsibilities.test.ts src/contracts/preferences.test.ts
```

Expected: PASS.

- [ ] **Step 11: Write worker report**

Create `docs/implementation/2026-05-04-task-02-board-schema-preferences.md`.

- [ ] **Step 12: Commit Task 2**

Run:

```bash
git add prisma/schema.prisma prisma/migrations/20260504190000_personal_use_redesign/migration.sql src/contracts/responsibilities.ts src/contracts/responsibilities.test.ts src/contracts/preferences.ts src/contracts/preferences.test.ts docs/implementation/2026-05-04-task-02-board-schema-preferences.md
git commit -m "feat: add board placement and onboarding schema"
```

Expected: one commit with Prisma validation and targeted tests passing.

## Task 3: Template, Placement, and Preference APIs

**Files:**
- Create: `src/server/repositories/card-templates.ts`
- Create: `src/server/repositories/card-templates.test.ts`
- Modify: `src/server/repositories/responsibilities.ts`
- Modify: `src/server/repositories/persistence.integration.test.ts`
- Create: `src/server/repositories/preferences.ts`
- Create: `src/server/repositories/preferences.test.ts`
- Create: `src/app/api/card-templates/route.ts`
- Create: `src/app/api/card-templates/route.test.ts`
- Create: `src/app/api/responsibilities/from-template/route.ts`
- Create: `src/app/api/responsibilities/from-template/route.test.ts`
- Create: `src/app/api/responsibilities/[id]/board-placement/route.ts`
- Create: `src/app/api/responsibilities/[id]/board-placement/route.test.ts`
- Create: `src/app/api/preferences/onboarding/route.ts`
- Create: `src/app/api/preferences/onboarding/route.test.ts`
- Create: `src/app/api/preferences/welcome/replay/route.ts`
- Create: `src/app/api/preferences/welcome/replay/route.test.ts`
- Create: `docs/implementation/2026-05-04-task-03-template-placement-preference-apis.md`

- [ ] **Step 1: Write failing repository test for template listing**

Create `src/server/repositories/card-templates.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { listCardTemplates } from "./card-templates";

describe("card template repository", () => {
  it("returns source templates sorted by title and filtered by label", async () => {
    const templates = await listCardTemplates({ labels: ["Daily Grind"] });

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((template) => template.labels.includes("Daily Grind"))).toBe(true);
    expect([...templates].sort((a, b) => a.title.localeCompare(b.title))).toEqual(templates);
  });
});
```

- [ ] **Step 2: Run repository test and verify RED**

Run:

```bash
npm test -- src/server/repositories/card-templates.test.ts
```

Expected: FAIL because `listCardTemplates` does not exist.

- [ ] **Step 3: Implement template repository**

Create `src/server/repositories/card-templates.ts`:

```ts
import type { Prisma } from "@prisma/client";

import type {
  CardTemplateDetail,
  CardTemplateSearchParams,
  CardTemplateSummary
} from "../../contracts/card-templates";
import { prisma } from "../db/prisma";

const templateSelect = {
  id: true,
  sourceCardId: true,
  slug: true,
  title: true,
  summary: true,
  areaKeys: true,
  defaultCadence: true,
  hiddenEffortKeys: true,
  definition: true,
  conception: true,
  planning: true,
  execution: true,
  minimumStandard: true,
  coverAssetPath: true,
  defaultLane: true,
  contentVersion: true,
  sourceVersion: true,
  importedAt: true
} satisfies Prisma.ResponsibilityTemplateSelect;

function labelsFromAreaKeys(areaKeys: string[]) {
  return areaKeys;
}

function toSummary(template: Prisma.ResponsibilityTemplateGetPayload<{ select: typeof templateSelect }>): CardTemplateSummary {
  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    labels: labelsFromAreaKeys(template.areaKeys),
    summary: template.summary,
    coverAssetPath: template.coverAssetPath,
    defaultLane: template.defaultLane
  };
}

function toDetail(template: Prisma.ResponsibilityTemplateGetPayload<{ select: typeof templateSelect }>): CardTemplateDetail {
  return {
    ...toSummary(template),
    sourceCardId: template.sourceCardId ?? template.id,
    definition: template.definition ?? template.summary,
    conception: template.conception ?? "Notice what this responsibility requires before the execution step.",
    planning: template.planning ?? "Plan timing, access, dependencies, and communication before execution.",
    execution: template.execution ?? "Complete the visible work and follow through until the outcome is handled.",
    minimumStandard: template.minimumStandard ?? "Agree on a household-specific minimum standard before judging follow-through.",
    defaultCadence: template.defaultCadence,
    hiddenEffortKeys: template.hiddenEffortKeys,
    sourceVersion: template.sourceVersion ?? template.contentVersion,
    importedAt: (template.importedAt ?? new Date(0)).toISOString()
  };
}

export async function listCardTemplates(
  params: CardTemplateSearchParams = {}
): Promise<CardTemplateSummary[]> {
  const templates = await prisma.responsibilityTemplate.findMany({
    where: {
      title: params.q
        ? {
            contains: params.q,
            mode: "insensitive"
          }
        : undefined,
      areaKeys: params.labels?.length
        ? {
            hasSome: params.labels
          }
        : undefined,
      defaultLane: params.lane
    },
    orderBy: {
      title: "asc"
    },
    select: templateSelect
  });

  return templates.map(toSummary);
}

export async function getCardTemplate(id: string): Promise<CardTemplateDetail | null> {
  const template = await prisma.responsibilityTemplate.findUnique({
    where: {
      id
    },
    select: templateSelect
  });

  return template ? toDetail(template) : null;
}
```

- [ ] **Step 4: Implement placement repository after failing test**

Add a failing test to `src/server/repositories/persistence.integration.test.ts` that creates a responsibility, moves it to `player_1`, and expects one `ResponsibilityEvent` with `eventType: "board_lane_changed"`. Then implement `updateResponsibilityBoardPlacement` in `src/server/repositories/responsibilities.ts`.

Use this implementation shape:

```ts
export async function updateResponsibilityBoardPlacement(input: {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  toLane: ResponsibilityBoardLane;
  sortOrder: number;
  actorPersonaId?: PersonaId;
  note?: string;
}): Promise<ResponsibilityDetail> {
  const responsibility = await prisma.$transaction(async (tx) => {
    const existing = await tx.responsibility.findFirst({
      where: { id: input.responsibilityId, householdId: input.householdId },
      select: { id: true, boardLane: true, boardSortOrder: true }
    });

    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Responsibility not found for household.");
    }

    await tx.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId ?? null,
        eventType: "board_lane_changed",
        payload: {
          fromLane: existing.boardLane,
          toLane: input.toLane,
          fromSortOrder: existing.boardSortOrder,
          toSortOrder: input.sortOrder,
          note: input.note ?? null
        },
        occurredAt: new Date()
      }
    });

    return tx.responsibility.update({
      where: { id: input.responsibilityId },
      data: { boardLane: input.toLane, boardSortOrder: input.sortOrder },
      include: responsibilityInclude
    });
  });

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}
```

- [ ] **Step 5: Implement preference repository after failing test**

Create `src/server/repositories/preferences.test.ts` first, asserting defaults are created for a persona and replay clears `welcomeDismissedAt`. Then create `src/server/repositories/preferences.ts` with:

```ts
export async function getOnboardingPreferences(personaId: PersonaId): Promise<OnboardingPreferences> {
  const preferences = await prisma.personaOnboardingPreferences.upsert({
    where: { personaId },
    update: {},
    create: { personaId }
  });

  return toOnboardingPreferences(preferences);
}

export async function updateOnboardingPreferences(
  personaId: PersonaId,
  input: OnboardingPreferencesMutation
): Promise<OnboardingPreferences> {
  const preferences = await prisma.personaOnboardingPreferences.upsert({
    where: { personaId },
    update: {
      welcomeDismissedAt: input.welcomeDismissedAt === undefined ? undefined : isoOrNull(input.welcomeDismissedAt),
      crashCourseSkippedAt: input.crashCourseSkippedAt === undefined ? undefined : isoOrNull(input.crashCourseSkippedAt),
      crashCourseCompletedAt: input.crashCourseCompletedAt === undefined ? undefined : isoOrNull(input.crashCourseCompletedAt),
      crashCourseCurrentStep: input.crashCourseCurrentStep,
      crashCourseReplayRequestedAt:
        input.crashCourseReplayRequestedAt === undefined ? undefined : isoOrNull(input.crashCourseReplayRequestedAt)
    },
    create: {
      personaId,
      welcomeDismissedAt: isoOrNull(input.welcomeDismissedAt),
      crashCourseSkippedAt: isoOrNull(input.crashCourseSkippedAt),
      crashCourseCompletedAt: isoOrNull(input.crashCourseCompletedAt),
      crashCourseCurrentStep: input.crashCourseCurrentStep ?? 0,
      crashCourseReplayRequestedAt: isoOrNull(input.crashCourseReplayRequestedAt)
    }
  });

  return toOnboardingPreferences(preferences);
}
```

- [ ] **Step 6: Add API routes with route tests**

For each route, write a failing route test before implementation:

```bash
npm test -- src/app/api/card-templates/route.test.ts
npm test -- src/app/api/responsibilities/from-template/route.test.ts
npm test -- src/app/api/responsibilities/[id]/board-placement/route.test.ts
npm test -- src/app/api/preferences/onboarding/route.test.ts
npm test -- src/app/api/preferences/welcome/replay/route.test.ts
```

Each route should:

- Read current household/persona session with existing `getCurrentSession`.
- Parse request bodies with the new Zod contracts.
- Return `401` without session, `400` for invalid payload, and scoped data for valid requests.

- [ ] **Step 7: Verify API tests pass**

Run:

```bash
npm test -- src/server/repositories/card-templates.test.ts src/server/repositories/preferences.test.ts src/server/repositories/persistence.integration.test.ts src/app/api/card-templates/route.test.ts src/app/api/responsibilities/from-template/route.test.ts src/app/api/responsibilities/[id]/board-placement/route.test.ts src/app/api/preferences/onboarding/route.test.ts src/app/api/preferences/welcome/replay/route.test.ts
```

Expected: PASS.

- [ ] **Step 8: Write worker report**

Create `docs/implementation/2026-05-04-task-03-template-placement-preference-apis.md`.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add src/server/repositories/card-templates.ts src/server/repositories/card-templates.test.ts src/server/repositories/responsibilities.ts src/server/repositories/persistence.integration.test.ts src/server/repositories/preferences.ts src/server/repositories/preferences.test.ts src/app/api/card-templates src/app/api/responsibilities/from-template src/app/api/responsibilities/[id]/board-placement src/app/api/preferences docs/implementation/2026-05-04-task-03-template-placement-preference-apis.md
git commit -m "feat: add template and board placement APIs"
```

Expected: one commit with targeted server and route tests passing.

## Task 4: Premium UI Foundation and App Chrome

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/chip.tsx`
- Create: `src/components/ui/icon-button.tsx`
- Create: `src/components/ui/segmented-control.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/surface.tsx`
- Create: `src/components/ui/ui-primitives.test.tsx`
- Modify: `src/components/app-shell/app-shell.tsx`
- Modify: `src/components/app-shell/app-shell.test.tsx`
- Create: `docs/implementation/2026-05-04-task-04-premium-ui-foundation.md`

- [ ] **Step 1: Write failing UI primitive tests**

Create `src/components/ui/ui-primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { Chip } from "./chip";
import { IconButton } from "./icon-button";
import { SegmentedControl } from "./segmented-control";

describe("UI primitives", () => {
  it("renders accessible icon buttons", async () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="Restart crash course" icon={<span aria-hidden>R</span>} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Restart crash course" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps chips compact and label-aware", () => {
    render(<Chip tone="caregiving">Caregiving</Chip>);

    expect(screen.getByText("Caregiving")).toHaveClass("max-w-full");
  });

  it("supports segmented keyboard-sized choices", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Board view"
        value="board"
        options={[
          { value: "board", label: "Board" },
          { value: "list", label: "List" }
        ]}
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "List" }));

    expect(onChange).toHaveBeenCalledWith("list");
  });

  it("renders button variants without layout-only text wrappers", () => {
    render(<Button variant="primary">Open library</Button>);

    expect(screen.getByRole("button", { name: "Open library" })).toHaveClass("rounded");
  });
});
```

- [ ] **Step 2: Run primitive tests and verify RED**

Run:

```bash
npm test -- src/components/ui/ui-primitives.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement UI primitives**

Create simple typed components that preserve native button semantics. Use CSS classes from `globals.css` and keep class merging local with arrays:

```tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" ? "bg-[var(--fp-ink)] text-white hover:bg-[var(--fp-ink-soft)]" : "",
        variant === "secondary" ? "border border-[var(--fp-line)] bg-[var(--fp-surface)] text-[var(--fp-ink)] hover:bg-[var(--fp-surface-strong)]" : "",
        variant === "ghost" ? "text-[var(--fp-ink)] hover:bg-[var(--fp-surface-strong)]" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
```

Use `Chip`, `IconButton`, `SegmentedControl`, `Sheet`, and `Surface` with the same small, typed pattern.

- [ ] **Step 4: Add visual tokens**

Modify `src/app/globals.css`:

```css
:root {
  --fp-bg: #f7f3ec;
  --fp-ink: #202124;
  --fp-ink-soft: #3b3d42;
  --fp-muted: #6a6761;
  --fp-line: rgba(32, 33, 36, 0.14);
  --fp-surface: rgba(255, 255, 255, 0.78);
  --fp-surface-strong: rgba(255, 255, 255, 0.96);
  --fp-home: #47746c;
  --fp-out: #506fa8;
  --fp-caregiving: #a45b63;
  --fp-magic: #8c6ab4;
  --fp-wild: #4f7f47;
  --fp-daily: #9b6d35;
  --fp-happiness: #c26f59;
  --fp-kids: #4d8195;
  --fp-kid-split: #806a55;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Verify primitive tests pass**

Run:

```bash
npm test -- src/components/ui/ui-primitives.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Write failing app-shell tests**

Modify `src/components/app-shell/app-shell.test.tsx` to assert:

```tsx
expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /Library/i })).toHaveAttribute("href", "/app/library");
expect(screen.getByRole("link", { name: /Crash course/i })).toHaveAttribute("href", "/app/crash-course");
expect(screen.getByRole("link", { name: /Load map/i })).toHaveAttribute("aria-current", "page");
```

- [ ] **Step 7: Run app-shell test and verify RED**

Run:

```bash
npm test -- src/components/app-shell/app-shell.test.tsx
```

Expected: FAIL because navigation has no library/crash-course entries or premium active-state semantics.

- [ ] **Step 8: Implement app shell chrome**

Modify `src/components/app-shell/app-shell.tsx`:

- Use `lucide-react` icons for Home, LayoutDashboard, Library, Radar, CalendarCheck, Settings, Sparkles.
- Add `/app/library` and `/app/crash-course` nav entries.
- Use `aria-current="page"` for active route.
- Add desktop sidebar and mobile bottom tab bar.
- Preserve existing session/persona display and logout behavior.

- [ ] **Step 9: Verify app shell tests pass**

Run:

```bash
npm test -- src/components/app-shell/app-shell.test.tsx src/components/ui/ui-primitives.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Write worker report**

Create `docs/implementation/2026-05-04-task-04-premium-ui-foundation.md`.

- [ ] **Step 11: Commit Task 4**

Run:

```bash
git add src/app/globals.css src/components/ui src/components/app-shell/app-shell.tsx src/components/app-shell/app-shell.test.tsx docs/implementation/2026-05-04-task-04-premium-ui-foundation.md package.json package-lock.json
git commit -m "feat: add premium app chrome"
```

Expected: one commit with targeted UI tests passing.

## Task 5: Card Library and Rich Detail

**Files:**
- Create: `src/components/library/card-library.tsx`
- Create: `src/components/library/card-library.test.tsx`
- Create: `src/app/app/library/page.tsx`
- Create: `src/components/cards/card-detail-sheet.tsx`
- Create: `src/components/cards/card-detail-sheet.test.tsx`
- Modify: `src/app/app/responsibilities/[id]/page.tsx`
- Modify: `src/components/responsibilities/responsibility-editor.tsx`
- Modify: `src/components/responsibilities/responsibility-editor.test.tsx`
- Create: `docs/implementation/2026-05-04-task-05-card-library-detail.md`

- [ ] **Step 1: Write failing library test**

Create `src/components/library/card-library.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardLibrary } from "./card-library";

const templates = [
  {
    id: "tpl_auto",
    slug: "auto",
    title: "Auto",
    labels: ["Out", "Daily Grind"],
    summary: "Vehicle responsibility summary.",
    coverAssetPath: "/assets/fairplay/cards/auto.png",
    defaultLane: "not_in_play"
  },
  {
    id: "tpl_homework",
    slug: "homework",
    title: "Homework",
    labels: ["Kids", "Home"],
    summary: "School follow-through.",
    coverAssetPath: null,
    defaultLane: "not_in_play"
  }
] as const;

describe("CardLibrary", () => {
  it("filters source cards and starts a household card from a template", async () => {
    const onCreateFromTemplate = vi.fn();
    render(<CardLibrary templates={templates} onCreateFromTemplate={onCreateFromTemplate} />);

    await userEvent.type(screen.getByRole("searchbox", { name: /search cards/i }), "auto");

    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /put Auto in play/i }));

    expect(onCreateFromTemplate).toHaveBeenCalledWith("tpl_auto");
  });
});
```

- [ ] **Step 2: Run library test and verify RED**

Run:

```bash
npm test -- src/components/library/card-library.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement card library**

Create `src/components/library/card-library.tsx`:

- Accept `templates: CardTemplateSummary[]`.
- Render a searchbox.
- Render label chips.
- Render cover image when available with fixed aspect ratio.
- Render `Put in play` action that calls `onCreateFromTemplate(template.id)`.
- Keep card dimensions stable with CSS classes.

- [ ] **Step 4: Verify library test passes**

Run:

```bash
npm test -- src/components/library/card-library.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write failing detail sheet test**

Create `src/components/cards/card-detail-sheet.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardDetailSheet } from "./card-detail-sheet";

const card = {
  id: "resp_123",
  title: "Auto",
  labels: ["Out", "Daily Grind"],
  boardLane: "cards_of_concern",
  ownerLabel: "Cards of Concern",
  definition: "Keep vehicle needs visible and handled.",
  conception: "Notice repairs and timing.",
  planning: "Schedule service and arrange transport.",
  execution: "Complete service and follow-through.",
  minimumStandard: "Vehicle is safe, legal, and available.",
  householdStandard: null,
  notes: null,
  coverAssetPath: "/assets/fairplay/cards/auto.png"
};

describe("CardDetailSheet", () => {
  it("shows CPE sections and action hooks", async () => {
    const onMove = vi.fn();
    const onFlagForRadar = vi.fn();
    render(<CardDetailSheet card={card} onMove={onMove} onFlagForRadar={onFlagForRadar} />);

    expect(screen.getByRole("heading", { name: "Auto" })).toBeInTheDocument();
    expect(screen.getByText("Notice repairs and timing.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /move to Player 1/i }));
    await userEvent.click(screen.getByRole("button", { name: /flag for radar/i }));

    expect(onMove).toHaveBeenCalledWith("player_1");
    expect(onFlagForRadar).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Run detail test and verify RED**

Run:

```bash
npm test -- src/components/cards/card-detail-sheet.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 7: Implement detail sheet**

Create `src/components/cards/card-detail-sheet.tsx` with:

- Cover/face area.
- Title, label chips, current lane.
- CPE sections.
- Minimum standard and household standard area.
- Move actions for all lanes.
- Radar action.
- Stable mobile bottom action bar.

- [ ] **Step 8: Add library page**

Create `src/app/app/library/page.tsx` as a server component that fetches `/api/card-templates` through repository/server helper or direct repository import, then renders a client wrapper for `CardLibrary`.

- [ ] **Step 9: Verify targeted tests pass**

Run:

```bash
npm test -- src/components/library/card-library.test.tsx src/components/cards/card-detail-sheet.test.tsx src/components/responsibilities/responsibility-editor.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Write worker report**

Create `docs/implementation/2026-05-04-task-05-card-library-detail.md`.

- [ ] **Step 11: Commit Task 5**

Run:

```bash
git add src/components/library src/app/app/library src/components/cards src/app/app/responsibilities/[id]/page.tsx src/components/responsibilities/responsibility-editor.tsx src/components/responsibilities/responsibility-editor.test.tsx docs/implementation/2026-05-04-task-05-card-library-detail.md
git commit -m "feat: add card library and rich detail"
```

Expected: one commit with targeted UI tests passing.

## Task 6: Trello-Style Load Board

**Files:**
- Modify: `src/components/responsibilities/responsibility-load-map.tsx`
- Modify: `src/components/responsibilities/responsibility-load-map.test.tsx`
- Modify: `src/app/app/load-map/page.tsx`
- Create: `src/components/responsibilities/board-lanes.ts`
- Create: `docs/implementation/2026-05-04-task-06-trello-style-load-board.md`

- [ ] **Step 1: Write failing board tests**

Add tests to `src/components/responsibilities/responsibility-load-map.test.tsx`:

```tsx
it("renders Trello board lanes with counts and explanations", () => {
  render(<ResponsibilityLoadMap responsibilities={responsibilities} />);

  expect(screen.getByRole("heading", { name: /Not in Play/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Cards of Concern/i })).toBeInTheDocument();
  expect(screen.getByText(/reserve cards/i)).toBeInTheDocument();
});

it("moves a card through the keyboard action menu", async () => {
  const onMove = vi.fn();
  render(<ResponsibilityLoadMap responsibilities={responsibilities} onMove={onMove} />);

  await userEvent.click(screen.getByRole("button", { name: /Move Auto/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /Player 1/i }));

  expect(onMove).toHaveBeenCalledWith({
    responsibilityId: "resp_auto",
    toLane: "player_1"
  });
});
```

- [ ] **Step 2: Run board tests and verify RED**

Run:

```bash
npm test -- src/components/responsibilities/responsibility-load-map.test.tsx
```

Expected: FAIL because lanes/actions do not exist.

- [ ] **Step 3: Define lane metadata**

Create `src/components/responsibilities/board-lanes.ts`:

```ts
import type { ResponsibilityBoardLane } from "../../domain/enums";

export const BOARD_LANES: readonly {
  key: ResponsibilityBoardLane;
  label: string;
  shortHelp: string;
  tone: string;
}[] = [
  {
    key: "cards_of_concern",
    label: "Cards of Concern",
    shortHelp: "Needs discussion, standards, support, or review.",
    tone: "concern"
  },
  {
    key: "player_1",
    label: "Player 1",
    shortHelp: "Owned by the first household persona.",
    tone: "playerOne"
  },
  {
    key: "player_2",
    label: "Player 2",
    shortHelp: "Owned by the second household persona.",
    tone: "playerTwo"
  },
  {
    key: "kid_split",
    label: "Kid Split",
    shortHelp: "Split by child, context, season, or sub-responsibility.",
    tone: "kidSplit"
  },
  {
    key: "not_in_play",
    label: "Not in Play",
    shortHelp: "Reserve cards that are not active yet.",
    tone: "reserve"
  },
  {
    key: "trimmed",
    label: "Trimmed",
    shortHelp: "Paused, dropped, or irrelevant for this household.",
    tone: "trimmed"
  }
];
```

- [ ] **Step 4: Implement board rendering and keyboard fallback**

Modify `ResponsibilityLoadMap`:

- Group cards by `boardLane`.
- Render horizontal scroll lanes.
- Use stable lane width and card dimensions.
- Add card action menu for movement.
- Call `onMove({ responsibilityId, toLane })`.
- Preserve existing summary metrics where useful.

- [ ] **Step 5: Add drag/drop**

Use `@dnd-kit/core` and `@dnd-kit/sortable`:

- `DndContext` around lanes.
- `SortableContext` per lane.
- `onDragEnd` calls `onMove` with destination lane and computed `sortOrder`.
- Apply lift transform and destination highlight.
- Respect reduced-motion CSS.

- [ ] **Step 6: Wire route to placement API**

Modify `src/app/app/load-map/page.tsx`:

- Fetch responsibilities including `boardLane` and `boardSortOrder`.
- Pass a client action that calls `PATCH /api/responsibilities/[id]/board-placement`.
- Refresh route data after move.

- [ ] **Step 7: Verify board tests pass**

Run:

```bash
npm test -- src/components/responsibilities/responsibility-load-map.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Write worker report**

Create `docs/implementation/2026-05-04-task-06-trello-style-load-board.md`.

- [ ] **Step 9: Commit Task 6**

Run:

```bash
git add src/components/responsibilities/responsibility-load-map.tsx src/components/responsibilities/responsibility-load-map.test.tsx src/components/responsibilities/board-lanes.ts src/app/app/load-map/page.tsx docs/implementation/2026-05-04-task-06-trello-style-load-board.md
git commit -m "feat: add Trello-style load board"
```

Expected: one commit with board tests passing.

## Task 7: Persistent Welcome and Crash Course

**Files:**
- Create: `src/components/crash-course/crash-course-content.ts`
- Create: `src/components/crash-course/crash-course-flow.tsx`
- Create: `src/components/crash-course/crash-course-flow.test.tsx`
- Create: `src/app/app/crash-course/page.tsx`
- Create: `src/components/welcome/persistent-welcome.tsx`
- Create: `src/components/welcome/persistent-welcome.test.tsx`
- Modify: `src/app/app/layout.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: `src/components/settings/settings-panel.test.tsx`
- Create: `docs/implementation/2026-05-04-task-07-welcome-crash-course.md`

- [ ] **Step 1: Write failing crash-course content test**

Create `src/components/crash-course/crash-course-flow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseFlow } from "./crash-course-flow";

describe("CrashCourseFlow", () => {
  it("contains the ten approved course lessons", () => {
    expect(CRASH_COURSE_LESSONS.map((lesson) => lesson.title)).toEqual([
      "Why this is not a chore app",
      "Owner vs. helper",
      "CPE: Conception, Planning, Execution",
      "Minimum standards and done well enough",
      "The board lanes",
      "Build your active deck",
      "Handoffs and re-deals",
      "Radar and check-ins",
      "Fair is dynamic",
      "Repair and resistance"
    ]);
  });

  it("skips, advances, and records progress", async () => {
    const onProgress = vi.fn();
    const onSkip = vi.fn();
    render(<CrashCourseFlow currentStep={0} onProgress={onProgress} onSkip={onSkip} />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /skip crash course/i }));

    expect(onProgress).toHaveBeenCalledWith(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run crash-course test and verify RED**

Run:

```bash
npm test -- src/components/crash-course/crash-course-flow.test.tsx
```

Expected: FAIL because crash-course files do not exist.

- [ ] **Step 3: Implement crash-course content**

Create `src/components/crash-course/crash-course-content.ts` with ten lessons. Each lesson should include:

```ts
export type CrashCourseLesson = {
  id: string;
  title: string;
  concept: string;
  action: string;
  exampleCardTitle?: string;
};
```

Use concepts from `docs/research/fair-play-book-report.md` and `docs/research/a-better-share-book-report.md` without copying long source passages.

- [ ] **Step 4: Implement crash-course flow**

Create `src/components/crash-course/crash-course-flow.tsx`:

- Render current lesson.
- Provide Previous, Next, Skip, and Finish buttons.
- Include one interactive minimum-standard text area in lesson 4.
- Call `onProgress(step)`, `onSkip()`, and `onComplete()`.

- [ ] **Step 5: Write failing welcome test**

Create `src/components/welcome/persistent-welcome.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PersistentWelcome } from "./persistent-welcome";

describe("PersistentWelcome", () => {
  it("stays visible until the user closes it", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<PersistentWelcome dismissed={false} onDismiss={onDismiss} />);

    expect(screen.getByRole("dialog", { name: /welcome to fairplay/i })).toBeInTheDocument();

    rerender(<PersistentWelcome dismissed={false} onDismiss={onDismiss} />);
    expect(screen.getByRole("dialog", { name: /welcome to fairplay/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /close welcome/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Implement persistent welcome**

Create `src/components/welcome/persistent-welcome.tsx`:

- Non-blocking dialog/banner shown when `dismissed` is false.
- Close icon button is the only dismissal path.
- Buttons link to `/app/crash-course`, `/app/library`, and `/app/load-map`.

- [ ] **Step 7: Wire welcome into protected layout**

Modify `src/app/app/layout.tsx`:

- Load current session/persona.
- Fetch onboarding preferences.
- Render `PersistentWelcome` on every protected route while `welcomeDismissedAt` is null.
- Closing calls `PATCH /api/preferences/onboarding` with `welcomeDismissedAt`.

- [ ] **Step 8: Add settings replay**

Modify `src/components/settings/settings-panel.tsx` and test:

- Add `Restart crash course` action.
- Add `Show welcome again` action.
- Wire to `PATCH /api/preferences/onboarding` and `POST /api/preferences/welcome/replay`.

- [ ] **Step 9: Verify targeted tests pass**

Run:

```bash
npm test -- src/components/crash-course/crash-course-flow.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Write worker report**

Create `docs/implementation/2026-05-04-task-07-welcome-crash-course.md`.

- [ ] **Step 11: Commit Task 7**

Run:

```bash
git add src/components/crash-course src/app/app/crash-course src/components/welcome src/app/app/layout.tsx src/components/settings/settings-panel.tsx src/components/settings/settings-panel.test.tsx docs/implementation/2026-05-04-task-07-welcome-crash-course.md
git commit -m "feat: add persistent welcome and crash course"
```

Expected: one commit with targeted onboarding tests passing.

## Task 8: Home, Radar, Check-In Polish

**Files:**
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/components/radar/radar-board.tsx`
- Modify: `src/components/radar/radar-board.test.tsx`
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/check-ins/check-in-flow.test.tsx`
- Create: `docs/implementation/2026-05-04-task-08-home-radar-checkin-polish.md`

- [ ] **Step 1: Write failing radar/check-in alignment tests**

Update `src/components/radar/radar-board.test.tsx` to assert concern-lane language:

```tsx
expect(screen.getByText(/Cards of Concern/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /send to check-in/i })).toBeInTheDocument();
```

Update `src/components/check-ins/check-in-flow.test.tsx` to assert handoff/re-deal language:

```tsx
expect(screen.getByText(/handoff/i)).toBeInTheDocument();
expect(screen.getByText(/review date/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx
```

Expected: FAIL because current copy/controls do not expose the new concept model.

- [ ] **Step 3: Implement home command center**

Modify `src/app/app/home/page.tsx`:

- Show deck progress: active, not in play, concern, trimmed.
- Show owner counts without scorekeeping language.
- Show open radar and next check-in.
- Add quick links to crash course, library, and load map.

- [ ] **Step 4: Polish radar and check-ins**

Modify `src/components/radar/radar-board.tsx` and `src/components/check-ins/check-in-flow.tsx`:

- Use new UI primitives.
- Align headings and actions with Cards of Concern, standards, handoffs, review dates, and re-deals.
- Keep existing service/API behavior.

- [ ] **Step 5: Verify targeted tests pass**

Run:

```bash
npm test -- src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Write worker report**

Create `docs/implementation/2026-05-04-task-08-home-radar-checkin-polish.md`.

- [ ] **Step 7: Commit Task 8**

Run:

```bash
git add src/app/app/home/page.tsx src/components/radar/radar-board.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.tsx src/components/check-ins/check-in-flow.test.tsx docs/implementation/2026-05-04-task-08-home-radar-checkin-polish.md
git commit -m "feat: polish home radar and check-ins"
```

Expected: one commit with targeted tests passing.

## Task 9: Full Verification, PR, and Ordered Merge Discipline

**Files:**
- Create: `docs/implementation/2026-05-04-task-09-verification-pr-merge.md`

- [ ] **Step 1: Run static verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Run database verification**

Run:

```bash
npm run db:up
npm run db:wait
npm run prisma:validate
npm run prisma:generate
npm run prisma:seed
```

Expected: database starts, Prisma validates/generates, seed writes 100 source templates.

- [ ] **Step 3: Run browser verification**

Start the dev server:

```bash
npm run dev
```

Verify in browser:

- `/app/home` loads command center.
- `/app/library` shows source card library.
- `/app/load-map` shows the Trello-style lanes.
- Welcome persists across route navigation until close.
- Crash course can be skipped and restarted from Settings.
- A card can be moved from `Not in Play` to `Cards of Concern` and then to `Player 1`.

- [ ] **Step 4: Write verification report**

Create `docs/implementation/2026-05-04-task-09-verification-pr-merge.md`:

```markdown
# Task 9: Verification, PR, and Merge

## Expectations

- Verify the personal-use redesign branch end to end.
- Push the implementation branch.
- Open a PR.
- Merge only after checks pass and dependency order is satisfied.

## Outputs

- Static verification results.
- Database verification results.
- Browser verification notes.
- PR URL.
- Merge/sync status.

## Challenges

- <Record any failures and fixes, or "None".>

## Next Handoff

- After final merge, update local main and confirm local main equals origin/main.
```

- [ ] **Step 5: Commit verification docs**

Run:

```bash
git add docs/implementation/2026-05-04-task-09-verification-pr-merge.md
git commit -m "docs: add redesign verification report"
```

Expected: final documentation commit.

- [ ] **Step 6: Push branch and open PR**

Run:

```bash
git push -u origin codex/personal-use-redesign
gh pr create --title "Personal-use Fairplay redesign foundation" --body-file docs/implementation/2026-05-04-task-09-verification-pr-merge.md
```

Expected: GitHub PR URL returned.

- [ ] **Step 7: Merge and sync only when checks pass**

Run after checks pass:

```bash
gh pr merge --squash --delete-branch
git switch main
git pull --ff-only origin main
git rev-parse main
git rev-parse origin/main
```

Expected: the final two SHAs are identical.

## Self-Review Checklist

- Spec coverage:
  - Full source card library: Task 1.
  - Board lane/sort/event model: Tasks 2 and 3.
  - Premium app chrome and visual system: Task 4.
  - Library and rich card detail: Task 5.
  - Trello-style drag/drop board: Task 6.
  - Persistent welcome and crash course: Task 7.
  - Radar/check-in polish: Task 8.
  - GitHub PR, merge, local/GitHub main sync: Task 9.
- Placeholder scan:
  - No unassigned implementation placeholders remain. The source-card seed step intentionally requires live Trello/workbook data because the worker must transcribe the complete private source dataset.
- Type consistency:
  - `ResponsibilityBoardLane` values match the spec enum and Trello list structure.
  - `CardTemplateDetail` CPE fields match Prisma template fields.
  - Preference names match API route and Prisma model names.
