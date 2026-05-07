# AI Card Generation Recovery Branch Summaries

Date: 2026-05-07

## Main Integration Branch

- Branch: `codex/ai-card-generation-recovery`
- Role: integration branch for the final fix in this workspace.
- Scope: persisted failed/canceled draft cleanup, retry recovery, API/repository/service contracts, focused UI reconciliation, QA, and final docs.
- Files changed:
  - `src/components/library/ai-task-manager.tsx`
  - `src/components/library/ai-task-manager.test.tsx`
  - `src/app/api/ai-card-drafts/[id]/route.ts`
  - `src/app/api/ai-card-drafts/[id]/route.test.ts`
  - `src/server/ai-card-drafts/service.ts`
  - `src/server/ai-card-drafts/service.test.ts`
  - `src/server/repositories/ai-card-drafts.ts`
  - `src/server/repositories/ai-card-drafts.test.ts`

## Documentation Audit Branch

- Branch: `codex/ai-card-recovery-doc-audit`
- Worktree: `.worktrees/ai-card-recovery-doc-audit`
- Agent: Dewey
- Scope: documentation-only repository history audit.
- Output: `.worktrees/ai-card-recovery-doc-audit/docs/agents/tasks/2026-05-07-ai-card-generation-recovery/doc-audit.md`
- Findings folded into this integration:
  - The active Library card-generation path is text-only.
  - New Library generation must not revive ASR, OCR, audio uploads, cover-byte requirements, image prompts, or regenerate-image behavior.
  - Prior failures included all-in-one provider configuration and media-stage coupling.
  - Live Qwen/OpenAI provider smoke remains a separate staging validation gap.

## Service Branch

- Branch: `codex/ai-card-recovery-service`
- Worktree: `.worktrees/ai-card-recovery-service`
- Agent: Nash
- Scope: backend/service retry investigation.
- Output: `.worktrees/ai-card-recovery-service/docs/agents/tasks/2026-05-07-ai-card-generation-recovery/service-branch.md`
- Finding folded into this integration:
  - Retry was ineffective when a failed draft already had complete generated text fields because retry called `saveGeneration` while the draft status was `failed`.
  - The integrated fix marks such drafts `ready` directly instead of rewriting generated fields.
- Integration delta beyond the service branch:
  - Added persisted discard/delete support for failed and canceled drafts, because the user-visible stuck state needed a true remove path, not another terminal cancel.

## UI/QA Branch

- Branch: `codex/ai-card-recovery-ui-qa`
- Worktree: `.worktrees/ai-card-recovery-ui-qa`
- Agent: McClintock
- Scope: UI tracker cleanup and stale-detail exploration.
- Status at integration: long-running agent did not return a final report before the main branch moved ahead.
- Partial branch diff inspected:
  - It hid canceled drafts client-side and added tests around stale detail after cancel/retry.
  - The final integration kept canceled drafts visible with an explicit `Remove` action, then added a backend `DELETE` contract.
  - The stale retry-detail idea was preserved: after retry returns a ready draft, local tracker state now reconciles immediately instead of waiting for route refresh.

## Branch Coordination Notes

- Branches were created as separate git worktrees under `.worktrees/`.
- Branch agents worked in isolated worktrees and did not revert one another's edits.
- Final integration was done in the shared workspace after inspecting branch outputs and applying the stronger combined fix.
- No branch-agent changes were merged mechanically; each relevant finding was reviewed before integration.
