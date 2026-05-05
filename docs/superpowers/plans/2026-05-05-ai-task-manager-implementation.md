# AI Task Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Library-first AI Task Manager that turns text or uploaded voice into tracked, reviewable AI-created cards and puts accepted cards in play.

**Architecture:** Add a household-scoped `AiCardDraft` model that stores generation status, structured card fields, cover image bytes, and temporary audio bytes. Add a server-side AI service for Qwen ASR, Qwen card structuring, and Qwen image generation, then expose draft lifecycle APIs and Library UI for capture, tracker, review, retry, and put-in-play.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/Postgres, Zod contracts, Vitest, Testing Library, Qwen OpenAI-compatible chat, Qwen DashScope image generation.

---

## File Structure

- Modify `prisma/schema.prisma`: add AI draft enums/model and relations.
- Create `prisma/migrations/20260505010000_add_ai_card_drafts/migration.sql`: schema migration.
- Modify `.env.example`: Qwen/ASR env vars.
- Create `src/contracts/ai-card-drafts.ts`: Zod schemas and exported draft types.
- Create `src/contracts/ai-card-drafts.test.ts`: contract tests.
- Create `src/server/ai/qwen-config.ts`: server env resolution.
- Create `src/server/ai/qwen-card-generator.ts`: Qwen ASR, structuring, image generation client.
- Create `src/server/ai/qwen-card-generator.test.ts`: fetch-mocked unit tests.
- Create `src/server/repositories/ai-card-drafts.ts`: persistence and cover/audio deletion helpers.
- Create `src/server/repositories/ai-card-drafts.test.ts`: repository integration tests.
- Create `src/server/ai-card-drafts/service.ts`: lifecycle orchestration and put-in-play behavior.
- Create `src/server/ai-card-drafts/service.test.ts`: service tests.
- Create `src/app/api/ai-card-drafts/route.ts`: list/create route.
- Create `src/app/api/ai-card-drafts/route.test.ts`: route tests.
- Create `src/app/api/ai-card-drafts/[id]/route.ts`: detail/update route.
- Create `src/app/api/ai-card-drafts/[id]/route.test.ts`: route tests.
- Create `src/app/api/ai-card-drafts/[id]/cover/route.ts`: cover streaming route.
- Create `src/app/api/ai-card-drafts/[id]/cover/route.test.ts`: route tests.
- Create `src/app/api/ai-card-drafts/[id]/retry/route.ts`: retry route.
- Create `src/app/api/ai-card-drafts/[id]/regenerate-image/route.ts`: image regeneration route.
- Create `src/app/api/ai-card-drafts/[id]/put-in-play/route.ts`: accept route.
- Create `src/app/api/ai-card-drafts/[id]/cancel/route.ts`: cancel route.
- Create `src/components/library/ai-task-manager.tsx`: capture sheet, audio recorder, tracker, review controls.
- Create `src/components/library/ai-task-manager.test.tsx`: component tests.
- Modify `src/components/library/card-library.tsx`: render AI section and open capture sheet.
- Modify `src/components/library/card-library.test.tsx`: Library integration tests.
- Modify `src/app/app/library/page.tsx`: load AI drafts and refresh after server actions.
- Create `docs/implementation/2026-05-05-ai-task-manager.md`: implementation note with API/env/audio retention details.

---

### Task 1: Contracts, Prisma Model, And Environment

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260505010000_add_ai_card_drafts/migration.sql`
- Modify: `.env.example`
- Create: `src/contracts/ai-card-drafts.ts`
- Create: `src/contracts/ai-card-drafts.test.ts`

- [ ] **Step 1: Write failing contract tests**

Create `src/contracts/ai-card-drafts.test.ts` with tests that verify:

```ts
import { describe, expect, it } from "vitest";

import {
  AiCardDraftCreateSchema,
  AiCardDraftSummarySchema,
  AiCardDraftUpdateSchema
} from "./ai-card-drafts";

describe("AI card draft contracts", () => {
  it("accepts text capture input and rejects missing text/audio", () => {
    expect(
      AiCardDraftCreateSchema.parse({
        inputText: "Remember the dog's heartworm meds."
      })
    ).toMatchObject({ inputText: "Remember the dog's heartworm meds." });

    expect(() => AiCardDraftCreateSchema.parse({})).toThrow();
  });

  it("accepts tracker-ready summaries with generated cover API paths", () => {
    expect(
      AiCardDraftSummarySchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440090",
        title: "Pet medication rhythm",
        promptPreview: "Remember the dog's heartworm meds.",
        status: "ready",
        generationStage: "ready",
        sourceInputType: "text",
        summary: "Keep pet medication refills and monthly doses handled.",
        areaKeys: ["Home"],
        hiddenEffortKeys: ["noticing", "planning", "follow_through"],
        cadence: "monthly",
        coverUrl: "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440090/cover",
        failureMessage: null,
        acceptedResponsibilityId: null,
        createdAt: "2026-05-05T12:00:00.000Z",
        updatedAt: "2026-05-05T12:00:00.000Z"
      })
    ).toMatchObject({ status: "ready", coverUrl: expect.stringContaining("/cover") });
  });

  it("accepts generated field updates before put-in-play", () => {
    expect(
      AiCardDraftUpdateSchema.parse({
        title: "Pet meds",
        hiddenEffortKeys: ["follow_through"],
        cadence: "monthly"
      })
    ).toMatchObject({ title: "Pet meds" });
  });
});
```

- [ ] **Step 2: Run contract test to verify it fails**

Run: `npm test -- --run src/contracts/ai-card-drafts.test.ts`

Expected: FAIL because `src/contracts/ai-card-drafts.ts` does not exist.

- [ ] **Step 3: Add Prisma model and migration**

Add enums to `prisma/schema.prisma`:

```prisma
enum AiCardDraftStatus {
  processing
  ready
  failed
  accepted
  canceled
}

enum AiCardGenerationStage {
  queued
  transcribing
  structuring
  generating_image
  saving_image
  ready
  failed
}

enum AiCardSourceInputType {
  text
  audio
}
```

Add relations:

```prisma
model Household {
  // existing fields
  aiCardDrafts AiCardDraft[]
}

model Persona {
  // existing fields
  createdAiCardDrafts AiCardDraft[] @relation("CreatedAiCardDrafts")
}

model Responsibility {
  // existing fields
  acceptedAiCardDraft AiCardDraft? @relation("AcceptedAiCardDraft")
}
```

Add model:

```prisma
model AiCardDraft {
  id                        String                @id @default(uuid())
  householdId               String
  createdByPersonaId        String
  sourceInputType           AiCardSourceInputType
  inputText                 String?
  audioBytes                Bytes?
  audioMimeType             String?
  audioTranscript           String?
  status                    AiCardDraftStatus     @default(processing)
  generationStage           AiCardGenerationStage @default(queued)
  failureCode               String?
  failureMessage            String?
  title                     String?
  summary                   String?
  areaKeys                  String[]
  hiddenEffortKeys          HiddenEffortKey[]
  cadence                   Cadence?
  definition                String?
  conception                String?
  planning                  String?
  execution                 String?
  minimumStandard           String?
  imagePrompt               String?
  imageNegativePrompt       String?
  coverImageBytes           Bytes?
  coverImageMimeType        String?
  acceptedResponsibilityId  String?               @unique
  readyAt                   DateTime?
  acceptedAt                DateTime?
  canceledAt                DateTime?
  audioDeletedAt            DateTime?
  createdAt                 DateTime              @default(now())
  updatedAt                 DateTime              @updatedAt
  household                 Household             @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdByPersona          Persona               @relation("CreatedAiCardDrafts", fields: [createdByPersonaId], references: [id], onDelete: Cascade)
  acceptedResponsibility    Responsibility?       @relation("AcceptedAiCardDraft", fields: [acceptedResponsibilityId], references: [id], onDelete: SetNull)

  @@index([householdId, status, createdAt])
  @@index([createdByPersonaId])
}
```

Create SQL migration mirroring the Prisma changes with enum creation, `AiCardDraft` table, indexes, and foreign keys.

- [ ] **Step 4: Add contracts**

Create `src/contracts/ai-card-drafts.ts` with:

```ts
import { z } from "zod";

import { CadenceSchema, HiddenEffortKeySchema } from "@/domain/enums";
import { IsoDateTimeSchema } from "@/domain/time";
import { ResponsibilityIdSchema } from "@/domain/ids";

export const AI_CARD_DRAFT_STATUSES = [
  "processing",
  "ready",
  "failed",
  "accepted",
  "canceled"
] as const;

export const AI_CARD_GENERATION_STAGES = [
  "queued",
  "transcribing",
  "structuring",
  "generating_image",
  "saving_image",
  "ready",
  "failed"
] as const;

export const AI_CARD_SOURCE_INPUT_TYPES = ["text", "audio"] as const;

export const AiCardDraftStatusSchema = z.enum(AI_CARD_DRAFT_STATUSES);
export const AiCardGenerationStageSchema = z.enum(AI_CARD_GENERATION_STAGES);
export const AiCardSourceInputTypeSchema = z.enum(AI_CARD_SOURCE_INPUT_TYPES);

export const AiCardDraftCreateSchema = z
  .object({
    inputText: z.string().trim().min(1).max(4000).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.inputText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inputText"],
        message: "Text input or an audio upload is required."
      });
    }
  });

export const AiCardDraftSummarySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(140).nullable(),
    promptPreview: z.string().trim().min(1).max(180),
    status: AiCardDraftStatusSchema,
    generationStage: AiCardGenerationStageSchema,
    sourceInputType: AiCardSourceInputTypeSchema,
    summary: z.string().trim().max(700).nullable(),
    areaKeys: z.array(z.string().trim().min(1).max(80)),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema),
    cadence: CadenceSchema.nullable(),
    coverUrl: z.string().startsWith("/api/ai-card-drafts/").nullable(),
    failureMessage: z.string().trim().max(1000).nullable(),
    acceptedResponsibilityId: ResponsibilityIdSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .strict();

export const AiCardDraftDetailSchema = AiCardDraftSummarySchema.extend({
  inputText: z.string().trim().max(4000).nullable(),
  audioTranscript: z.string().trim().max(4000).nullable(),
  definition: z.string().trim().max(3000).nullable(),
  conception: z.string().trim().max(3000).nullable(),
  planning: z.string().trim().max(3000).nullable(),
  execution: z.string().trim().max(3000).nullable(),
  minimumStandard: z.string().trim().max(3000).nullable(),
  imagePrompt: z.string().trim().max(3000).nullable(),
  imageNegativePrompt: z.string().trim().max(3000).nullable()
}).strict();

export const AiCardDraftUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    summary: z.string().trim().max(700).nullable().optional(),
    areaKeys: z.array(z.string().trim().min(1).max(80)).optional(),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema).optional(),
    cadence: CadenceSchema.optional(),
    definition: z.string().trim().max(3000).nullable().optional(),
    conception: z.string().trim().max(3000).nullable().optional(),
    planning: z.string().trim().max(3000).nullable().optional(),
    execution: z.string().trim().max(3000).nullable().optional(),
    minimumStandard: z.string().trim().max(3000).nullable().optional()
  })
  .strict();

export type AiCardDraftSummary = z.infer<typeof AiCardDraftSummarySchema>;
export type AiCardDraftDetail = z.infer<typeof AiCardDraftDetailSchema>;
export type AiCardDraftUpdate = z.infer<typeof AiCardDraftUpdateSchema>;
export type AiCardDraftCreate = z.infer<typeof AiCardDraftCreateSchema>;
```

- [ ] **Step 5: Update `.env.example`**

Ensure it contains:

```env
QWEN_CARD_MODEL="qwen3.6-max-preview"
QWEN_ASR_MODEL="qwen3-asr-flash"
QWEN_OPENAI_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
QWEN_CARD_API_KEY="replace-with-qwen-key-for-card-structuring-and-asr"
QWEN_IMAGE_MODEL="qwen-image-2.0-pro"
QWEN_IMAGE_BASE_URL="https://dashscope-intl.aliyuncs.com/api/v1"
QWEN_IMAGE_API_KEY="replace-with-qwen-key-for-card-front-generation"
```

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- --run src/contracts/ai-card-drafts.test.ts
npm run prisma:validate
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add .env.example prisma/schema.prisma prisma/migrations/20260505010000_add_ai_card_drafts/migration.sql src/contracts/ai-card-drafts.ts src/contracts/ai-card-drafts.test.ts
git commit -m "feat: add AI card draft contracts"
```

---

### Task 2: Qwen AI Client

**Files:**
- Create: `src/server/ai/qwen-config.ts`
- Create: `src/server/ai/qwen-card-generator.ts`
- Create: `src/server/ai/qwen-card-generator.test.ts`

- [ ] **Step 1: Write failing tests**

Create tests that mock `fetch` and verify:

- Missing env throws `QwenConfigError`.
- `structureTaskAsCard` calls `/chat/completions` with `qwen3.6-max-preview` and parses strict JSON.
- `transcribeAudio` calls `/chat/completions` with `qwen3-asr-flash` and `input_audio`.
- `generateCardCover` calls DashScope image generation and returns downloaded bytes.
- Image response without an image URL throws `QwenGenerationError`.

Run: `npm test -- --run src/server/ai/qwen-card-generator.test.ts`

Expected: FAIL because files do not exist.

- [ ] **Step 2: Implement config**

`qwen-config.ts` must export:

```ts
export type QwenConfig = {
  cardApiKey: string;
  cardModel: string;
  asrModel: string;
  openAiBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
  imageBaseUrl: string;
};

export class QwenConfigError extends Error {
  readonly code = "QWEN_CONFIG_MISSING";
}

export function getQwenConfig(env = process.env): QwenConfig {
  // read required env vars and throw QwenConfigError listing only missing names
}
```

- [ ] **Step 3: Implement generator**

`qwen-card-generator.ts` must export:

```ts
export type StructuredAiCard = {
  title: string;
  summary: string;
  areaKeys: string[];
  hiddenEffortKeys: Array<"noticing" | "planning" | "doing" | "follow_through" | "emotional_attention">;
  cadence: "daily" | "weekly" | "monthly" | "seasonal" | "event_based" | "as_needed" | "one_time";
  definition: string;
  conception: string;
  planning: string;
  execution: string;
  minimumStandard: string;
  imagePrompt: string;
  imageNegativePrompt: string;
};

export type GeneratedCoverImage = {
  bytes: Uint8Array;
  mimeType: string;
};
```

Implement:

- `transcribeAudio(input: { bytes: Uint8Array; mimeType: string; contextText?: string }, deps?)`
- `structureTaskAsCard(input: { taskText: string; existingDraft?: Partial<StructuredAiCard> }, deps?)`
- `generateCardCover(input: { title: string; imagePrompt: string; negativePrompt: string }, deps?)`

Use dependency injection for `fetch` and config so tests do not hit network.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- --run src/server/ai/qwen-card-generator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/ai/qwen-config.ts src/server/ai/qwen-card-generator.ts src/server/ai/qwen-card-generator.test.ts
git commit -m "feat: add Qwen card generator"
```

---

### Task 3: AI Card Draft Repository And Service

**Files:**
- Create: `src/server/repositories/ai-card-drafts.ts`
- Create: `src/server/repositories/ai-card-drafts.test.ts`
- Create: `src/server/ai-card-drafts/service.ts`
- Create: `src/server/ai-card-drafts/service.test.ts`

- [ ] **Step 1: Write failing repository and service tests**

Tests must cover:

- Creating a text draft scoped to household/persona.
- Creating an audio draft stores `audioBytes` and metadata.
- Listing summaries maps cover bytes to `/api/ai-card-drafts/:id/cover`.
- Updating generation status/stage and failure message.
- Saving structured fields and cover bytes.
- Deleting audio on accept and cancel.
- `putInPlay` creates a responsibility with generated source fields and accepted responsibility id.

Run:

```bash
npm test -- --run src/server/repositories/ai-card-drafts.test.ts src/server/ai-card-drafts/service.test.ts
```

Expected: FAIL because files do not exist.

- [ ] **Step 2: Implement repository**

Repository functions:

- `createAiCardDraft(input)`
- `listAiCardDrafts(householdId)`
- `getAiCardDraft(input)`
- `updateAiCardDraft(input)`
- `markAiCardDraftStage(input)`
- `saveAiCardDraftGeneration(input)`
- `saveAiCardDraftFailure(input)`
- `saveAiCardDraftCover(input)`
- `deleteAiCardDraftAudio(input)`
- `cancelAiCardDraft(input)`
- `markAiCardDraftAccepted(input)`
- `getAiCardDraftCover(input)`

Mapping rules:

- Summary `promptPreview` uses `title`, then `inputText`, then `audioTranscript`, then `"Audio card draft"`.
- `coverUrl` is non-null only when cover bytes exist.
- Never return `audioBytes`.

- [ ] **Step 3: Implement service**

Service responsibilities:

- Require selected persona.
- Validate household ownership for every draft.
- Cap audio upload at 10 MB.
- For text input, structure and generate image.
- For audio input, transcribe then structure and generate image.
- Persist intermediate stages in the order transcribing/structuring/generating_image/saving_image/ready.
- On image failure, keep structured fields and mark failed.
- `retry` restarts from failed stage.
- `regenerateImage` only reruns image generation.
- `putInPlay` creates a responsibility using `createResponsibility`, copies source fields, sets `sourceCoverAssetPath` to `/api/ai-card-drafts/:id/cover`, marks accepted, and deletes audio.
- `cancel` marks canceled and deletes audio.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- --run src/server/repositories/ai-card-drafts.test.ts src/server/ai-card-drafts/service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/repositories/ai-card-drafts.ts src/server/repositories/ai-card-drafts.test.ts src/server/ai-card-drafts/service.ts src/server/ai-card-drafts/service.test.ts
git commit -m "feat: persist AI card drafts"
```

---

### Task 4: AI Card Draft API Routes

**Files:**
- Create: `src/app/api/ai-card-drafts/route.ts`
- Create: `src/app/api/ai-card-drafts/route.test.ts`
- Create: `src/app/api/ai-card-drafts/[id]/route.ts`
- Create: `src/app/api/ai-card-drafts/[id]/route.test.ts`
- Create: `src/app/api/ai-card-drafts/[id]/cover/route.ts`
- Create: `src/app/api/ai-card-drafts/[id]/cover/route.test.ts`
- Create: `src/app/api/ai-card-drafts/[id]/retry/route.ts`
- Create: `src/app/api/ai-card-drafts/[id]/regenerate-image/route.ts`
- Create: `src/app/api/ai-card-drafts/[id]/put-in-play/route.ts`
- Create: `src/app/api/ai-card-drafts/[id]/cancel/route.ts`

- [ ] **Step 1: Write failing route tests**

Tests must mock auth and service. Cover:

- `GET /api/ai-card-drafts` requires auth and lists drafts.
- `POST /api/ai-card-drafts` accepts JSON text.
- `POST /api/ai-card-drafts` accepts multipart `audio`.
- `GET /api/ai-card-drafts/[id]/cover` streams image bytes and content type.
- Mutation routes return 401 for unauthenticated sessions, 400 for validation or invalid-input service errors, 404 for not-found service errors, 201 for put-in-play success, and 200 for retry/regenerate/cancel success.

Run:

```bash
npm test -- --run 'src/app/api/ai-card-drafts/**/*.test.ts' src/app/api/ai-card-drafts/route.test.ts
```

Expected: FAIL because routes do not exist.

- [ ] **Step 2: Implement routes**

All routes:

- Use `runtime = "nodejs"`.
- Use `getCurrentSession`.
- Return `{ error: "Authentication required." }` for missing session.
- Return `{ error: "Invalid request." }` for validation failures.
- Convert service `AUTH_REQUIRED`, `INVALID_INPUT`, and `NOT_FOUND` errors like existing route patterns.

- [ ] **Step 3: Verify**

Run:

```bash
npm test -- --run 'src/app/api/ai-card-drafts/**/*.test.ts' src/app/api/ai-card-drafts/route.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai-card-drafts
git commit -m "feat: add AI card draft APIs"
```

---

### Task 5: Library AI Task Manager UI

**Files:**
- Create: `src/components/library/ai-task-manager.tsx`
- Create: `src/components/library/ai-task-manager.test.tsx`
- Modify: `src/components/library/card-library.tsx`
- Modify: `src/components/library/card-library.test.tsx`
- Modify: `src/app/app/library/page.tsx`

- [ ] **Step 1: Write failing component tests**

Tests must verify:

- Library renders an `AI Task Manager` button.
- Clicking opens capture sheet with text input and audio recording controls.
- Generated draft tracker shows processing, failed, ready, and accepted cards.
- Failed draft shows retry and cancel actions.
- Ready draft shows review and put-in-play actions.
- Capture submits text to `/api/ai-card-drafts`.
- Audio capture stores a `Blob` and submits multipart form data.

Run:

```bash
npm test -- --run src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx
```

Expected: FAIL because UI does not exist.

- [ ] **Step 2: Implement UI**

Create focused components in `ai-task-manager.tsx`:

- `AiTaskManager`
- `AiCardTracker`
- `AiCardCaptureSheet`
- `AiCardReviewPanel`

Use existing UI primitives and lucide icons. Use `MediaRecorder` when available and show a disabled voice control with explanatory label when unavailable. Do not store audio in browser storage.

Modify `CardLibrary` props:

```ts
type CardLibraryProps = {
  templates: CardTemplateSummary[];
  aiDrafts?: AiCardDraftSummary[];
  onCreateFromTemplate?: (templateId: string) => void;
};
```

Render AI-created cards above source labels. Keep source label filtering scoped to source cards.

Modify `LibraryPage` to fetch drafts server-side through repository/service and pass them to `CardLibrary`.

- [ ] **Step 3: Verify**

Run:

```bash
npm test -- --run src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/library src/app/app/library/page.tsx
git commit -m "feat: add AI task manager library UI"
```

---

### Task 6: Documentation, Integration Checks, And PR Readiness

**Files:**
- Create: `docs/implementation/2026-05-05-ai-task-manager.md`
- Modify: `README.md` if needed for env references.

- [ ] **Step 1: Write implementation documentation**

Create `docs/implementation/2026-05-05-ai-task-manager.md` documenting:

- User flow.
- API routes.
- Qwen env vars.
- Audio retention and deletion rules.
- Image persistence and temporary provider URL handling.
- Known v1 limitations.
- Manual smoke test steps.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run prisma:validate
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add docs/implementation/2026-05-05-ai-task-manager.md README.md
git commit -m "docs: document AI task manager"
```

- [ ] **Step 4: Final review**

Dispatch final code review against the full branch before creating a PR.

- [ ] **Step 5: PR**

Push branch `codex/ai-task-manager`, create a PR to `main`, include verification results and implementation docs in the PR body.
