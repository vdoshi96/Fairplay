# T05 Spec Compliance Review

## Assignment

Review implementation task T05 for mobile/auth/persona/onboarding UI spec compliance without modifying production code.

## Review Target

- T05 commit: `c93da78`
- Diff range: `f9a5fdffe5373e1114016bc3ed7a30b482bbddac..c93da78`
- Branch: `codex/v1-app`

## Required Reading

- `docs/superpowers/plans/2026-05-04-fairplay-v1-implementation.md` Task T05 and global constraints
- `docs/product/user-flows.md`
- `docs/product/visual-system.md`
- `docs/product/ip-safety-review.md`
- `src/lib/safety-copy.ts`

## Checklist

- Confirm required pages exist: `/create-household`, `/login`, `/choose-persona`, `/app/onboarding`, `/app/home`, `/app/settings`.
- Confirm root `/` routes by session/persona state using safe server helpers.
- Confirm auth forms avoid password echo, use generic login failures, disable pending submit, and preserve only non-password fields.
- Confirm persona selection shows Alex/Max from API/session, active persona is visible, and settings switch requires confirmation.
- Confirm onboarding is practical household planning, includes unsafe relationship caution, has setup and skip paths, and uses original neutral copy.
- Confirm app shell is mobile-first with Home, Load Map, Radar, Check-ins, and Settings nav, no deck/card metaphor, and accessible labels/focus/errors.
- Confirm settings show household name, active persona, logout, and neutral future data controls if present.
- Confirm no sensitive data is stored in `localStorage` or `sessionStorage`.
- Confirm tests/e2e satisfy T05 plan, with mocked e2e clearly represented as mocked coverage.
- Confirm required T05 implementation task artifacts exist.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/components/auth src/components/onboarding`
- `npm run test:e2e -- --grep "auth|onboarding"`
- `npm run build`
