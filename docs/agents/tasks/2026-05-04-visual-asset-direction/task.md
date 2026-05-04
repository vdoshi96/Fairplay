# Task

## Assignment

Define Fairplay's visual direction and original placeholder assets for future implementation, without adding app code or calling image generation APIs.

## Scope

- Update `docs/product/visual-system.md`.
- Create task tracking files in `docs/agents/tasks/2026-05-04-visual-asset-direction/`.
- Create original SVG placeholder assets under `docs/assets/visuals/`.
- Update `docs/agents/manifest.md` and `docs/agents/controller-log.md`.
- Commit and push on `codex/research-and-spec`.

## Inputs Read

- `docs/product/v1-scope.md`
- `docs/product/user-flows.md`
- `docs/product/data-model.md`
- `docs/product/ip-safety-review.md`
- `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`
- `docs/superpowers/plans/2026-05-04-fairplay-v1-implementation.md`
- `docs/agents/tasks/2026-05-04-gap-review/handoff.md`

## Hard Constraints

- Do not create app code, Next.js components, or implementation files.
- Do not call any image generation API.
- Do not copy Fair Play, Better Share, Trello, PDF, workbook, deck, or source visual styles.
- Keep relationship-safety tone warm, cute, practical, and non-blaming.
- Treat placeholder SVGs as original direction assets only.

## Completion Criteria

- Visual system includes mobile-first palette, type, spacing, shape language, component direction, motion, contrast, characters, PWA icon direction, prompts, and guardrails.
- At least three original SVG assets exist under `docs/assets/visuals/`.
- T09 implementation handoff identifies approved assets, tokens, animation names, and what not to do.
- Git diff contains only docs/assets edits.
