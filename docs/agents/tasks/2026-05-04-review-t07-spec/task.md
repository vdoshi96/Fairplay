# Task

Spec compliance review for T07 radar concern board UI and API mutations.

## Scope

- Review target commit: `f4783b40639b07130253566fab13f351f4717370`
- Diff range: `9d93cb8af6fda7f730bfb778c4ea046c8062aaa5..f4783b40639b07130253566fab13f351f4717370`
- Worktree: `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`

## Required Reading

- `docs/superpowers/plans/2026-05-04-fairplay-v1-implementation.md` Task T07 and global constraints
- `docs/product/user-flows.md`
- `docs/product/ip-safety-review.md`
- `src/contracts/radar.ts`
- `src/lib/safety-copy.ts`

## Result

Status: `CHANGES_REQUESTED`

T07 meets several visibility and safety-copy requirements, but two blocking spec/user-flow gaps remain:

- Real radar board actions call APIs without refreshing or updating the board state, so the implemented UI does not complete the create, publish, defer, or resolve flow without a manual reload.
- Radar desired timing and defer revisit dates are accepted or required by spec but are not persisted or surfaced by the contract/model/service/UI.
