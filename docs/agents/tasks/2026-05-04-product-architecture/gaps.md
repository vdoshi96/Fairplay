# Gaps

## Product Questions

- Whether v1 should allow custom persona names in addition to the default Alex and Max. Current decision: fixed Alex/Max for v1 simplicity.
- Whether responsibility categories should be editable by users in v1. Current decision: user-authored responsibilities can have tags; default demo areas stay small and original.
- Whether concern drafts should support partner comments in v1. Current decision: shared radar items can carry updates, but private drafts remain private until explicitly shared.
- Whether load snapshots should be visible immediately after one persona uses the app or only after both have participated. Current decision: show household aggregate state but avoid partner-comparison framing.

## Implementation-Stage Questions

- Pick exact Argon2id parameters, session idle timeout, absolute timeout, and failed-login rate-limit thresholds.
- Choose the specific Vercel Marketplace Postgres provider after project setup.
- Decide whether Prisma migrations are generated locally or through a deployment workflow.
- Define final non-clinical onboarding copy and safety disclaimer through a content/safety review.
- Review all demo seed examples before they enter code, tests, screenshots, or fixtures.

## Out of Scope for This Task

- Production code.
- Physical database migrations.
- Generated assets, cartoons, animations, or UI screenshots.
- Detailed implementation plan.
