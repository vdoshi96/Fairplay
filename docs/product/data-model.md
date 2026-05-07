# Fairplay v1 Data Model

This is a product architecture model, not a physical migration. Implementation should translate these entities into Prisma models backed by a Postgres-compatible managed database connected through Vercel Marketplace storage.

## Modeling Principles

- Use UUID strings for entity ids.
- Use ISO 8601 timestamps and store the household timezone.
- Use stable string enums so JSON contracts remain compatible with future iOS clients.
- Keep user-authored content separate from reviewed demo/seed content.
- Treat ownership, visibility, status, review timing, and history as first-class fields.
- Avoid source-derived category systems, source card names, copied prompts, and deck-like catalog assumptions.
- Keep aggregate load signals non-punitive; never model a partner score.

## Stack Decision

- Web/runtime: Next.js App Router on Vercel.
- Language: TypeScript.
- Styling: Tailwind CSS.
- Persistence: Postgres-compatible database through Vercel Marketplace storage.
- ORM: Prisma, chosen for a conservative typed schema workflow, readable migrations, and broad contributor familiarity.
- API style: explicit JSON Route Handlers for durable actions; Server Actions may wrap the same domain services for web-only forms.

## Authentication and Session Entities

### `Household`

- `id`
- `name`
- `usernameNormalized`
- `timezone`
- `createdAt`
- `updatedAt`

### `HouseholdCredential`

- `id`
- `householdId`
- `passwordHash`
- `hashAlgorithm`
- `hashParamsVersion`
- `createdAt`
- `updatedAt`
- `lastRotatedAt`

Password hashes must use Argon2id, bcrypt, or scrypt with production parameters. Argon2id is preferred for v1. Plaintext passwords must never be stored, logged, seeded, or returned by APIs.

### `Persona`

- `id`
- `householdId`
- `key`: `alex` or `max`
- `displayName`
- `avatarKey`
- `createdAt`
- `updatedAt`

V1 creates Alex and Max by default. Future versions may allow additional members or deeper identity, but v1 should not imply per-person secrecy when both personas share household credentials.

### `Session`

- `id`
- `householdId`
- `selectedPersonaId`
- `createdAt`
- `lastSeenAt`
- `expiresAt`
- `revokedAt`
- `userAgentHash`

Sessions should be server-managed or referenced by signed/encrypted opaque cookies. Cookies must be `HttpOnly`, `Secure`, and `SameSite=Lax`. Exact idle and absolute expiration windows are implementation-stage decisions.

## Responsibility Entities

### `Responsibility`

- `id`
- `householdId`
- `createdByPersonaId`
- `templateId` nullable
- `title`
- `summary` nullable
- `areaKeys`: array of original household area keys
- `hiddenEffortKeys`: array of effort dimensions
- `cadence`
- `relevantDays`: nullable array
- `status`
- `visibility`
- `householdStandard` nullable user-authored text
- `notes` nullable
- `lastReviewedAt` nullable
- `nextReviewAt` nullable
- `createdAt`
- `updatedAt`
- `archivedAt` nullable

Responsibilities are durable household accountabilities, not disposable to-dos. They can be created from scratch or from a reviewed demo/template record, but user-authored fields become the household source of truth.

### `ResponsibilityAssignment`

- `id`
- `responsibilityId`
- `personaId`
- `role`
- `scope`
- `startsAt`
- `endsAt` nullable
- `createdByPersonaId`
- `createdAt`

Use dated assignments so the current owner can be derived while preserving handoff history. Shared ownership is allowed, but each role must say whether the persona carries the outcome, a part, backup support, or helper support.

### `ResponsibilityLifecycleNotes`

- `responsibilityId`
- `noticeDecideNotes` nullable
- `planPrepareNotes` nullable
- `executeFollowThroughNotes` nullable
- `dependencies` nullable
- `blockers` nullable
- `supportNeeded` nullable
- `handoffNotes` nullable
- `updatedAt`

These are optional structured notes that make hidden coordination visible without copying source lifecycle wording into the UI.

### `ResponsibilityTemplate`

- `id`
- `slug`
- `title`
- `summary`
- `areaKeys`
- `defaultCadence`
- `hiddenEffortKeys`
- `sourceReviewStatus`
- `contentVersion`
- `createdAt`
- `updatedAt`

V1 should not ship a full starter library. This entity exists to support a tiny reviewed demo seed set and possible future templates. All template content must be original and IP-reviewed before entering code, tests, fixtures, screenshots, or production data.

## Check-In and History Entities

Radar was retired before this version of the active model. Check-ins now stand on responsibility-linked and custom agenda items rather than a separate Radar item model.

### `CheckIn`

- `id`
- `householdId`
- `state`
- `scheduledFor` nullable
- `startedAt` nullable
- `completedAt` nullable
- `facilitatorPersonaId` nullable
- `summary` nullable
- `createdAt`
- `updatedAt`

### `CheckInItem`

- `id`
- `checkInId`
- `responsibilityId` nullable
- `itemType`
- `state`
- `promptKey`
- `response` nullable
- `decisionId` nullable
- `sortOrder`

### `Decision`

- `id`
- `householdId`
- `checkInId` nullable
- `responsibilityId` nullable
- `decisionType`
- `summary`
- `effectiveAt`
- `reviewOn` nullable
- `createdByPersonaId`
- `createdAt`

### `ResponsibilityEvent`

- `id`
- `householdId`
- `responsibilityId` nullable
- `actorPersonaId` nullable
- `eventType`
- `payload`
- `occurredAt`

Events should support auditability and trust. Product views should summarize events neutrally and avoid turning history into a blame ledger.

### `LoadSnapshot`

- `id`
- `householdId`
- `periodStart`
- `periodEnd`
- `computedAt`
- `ownerDistribution`
- `sharedDistribution`
- `areaDistribution`
- `cadenceDistribution`
- `reviewDueCount`
- `pausedOrNotRelevantCount`
- `hiddenEffortMix`

Snapshots are aggregate household summaries. They must not produce a "bad partner" score, winner/loser comparison, morality grade, or diagnosis.

## Enum Candidates

- `PersonaKey`: `alex`, `max`
- `ResponsibilityStatus`: `unassigned`, `active`, `needs_review`, `paused`, `not_relevant`, `archived`
- `AssignmentRole`: `accountable_owner`, `shared_owner`, `helper`, `backup`
- `AssignmentScope`: `outcome`, `part`, `support`, `temporary`
- `Visibility`: `private`, `shared_household`, `partner_visible`, `check_in_only`
- `Cadence`: `daily`, `weekly`, `monthly`, `seasonal`, `event_based`, `as_needed`, `one_time`
- `HiddenEffortKey`: `noticing`, `planning`, `doing`, `follow_through`, `emotional_attention`
- `CheckInState`: `draft`, `scheduled`, `active`, `completed`, `skipped`
- `CheckInItemState`: `queued`, `discussed`, `deferred`, `skipped`
- `DecisionType`: `assign_owner`, `change_role`, `change_standard`, `change_cadence`, `pause`, `mark_not_relevant`, `archive`, `schedule_review`, `custom_note`
- `SourceReviewStatus`: `not_reviewed`, `approved_original`, `blocked`, `needs_review`

## Platform-Neutral JSON Contracts

These contracts define product boundaries for web and future iOS clients. Exact route names may change during implementation, but payloads should remain explicit JSON and should not depend on React state.

### Create Household

Request:

```json
{
  "householdName": "Maple House",
  "username": "maple-house",
  "password": "client-supplied secret",
  "timezone": "America/Chicago"
}
```

Response:

```json
{
  "household": { "id": "uuid", "name": "Maple House", "timezone": "America/Chicago" },
  "personas": [
    { "id": "uuid", "key": "alex", "displayName": "Alex" },
    { "id": "uuid", "key": "max", "displayName": "Max" }
  ],
  "requiresPersonaSelection": true
}
```

The password is accepted only over HTTPS, hashed server-side, and never returned.

### Login

Request:

```json
{
  "username": "maple-house",
  "password": "client-supplied secret"
}
```

Response:

```json
{
  "household": { "id": "uuid", "name": "Maple House" },
  "personas": [
    { "id": "uuid", "key": "alex", "displayName": "Alex" },
    { "id": "uuid", "key": "max", "displayName": "Max" }
  ],
  "requiresPersonaSelection": true
}
```

### Select Persona

Request:

```json
{ "personaId": "uuid" }
```

Response:

```json
{
  "session": {
    "householdId": "uuid",
    "selectedPersonaId": "uuid",
    "expiresAt": "2026-05-05T12:00:00.000Z"
  }
}
```

### Responsibility Summary

```json
{
  "id": "uuid",
  "title": "Evening kitchen reset",
  "areaKeys": ["home_base", "food_flow"],
  "hiddenEffortKeys": ["doing", "follow_through"],
  "cadence": "daily",
  "status": "active",
  "visibility": "shared_household",
  "currentAssignments": [
    { "personaKey": "alex", "role": "accountable_owner", "scope": "outcome" }
  ],
  "nextReviewAt": "2026-06-01T00:00:00.000Z"
}
```

## Original Demo Area Keys

V1 demo data may use this small original set after review:

- `home_base`: recurring upkeep and shared-space reset.
- `food_flow`: meals, groceries, supplies, and kitchen readiness.
- `calendar_lane`: appointments, reminders, plans, and errands.
- `care_circle`: care routines for people or pets in the household.
- `paper_trail`: bills, forms, records, benefits, and household admin.
- `fix_and_fetch`: repairs, maintenance, transport, and things that need replacing.
- `recharge`: rest, personal time, appreciation, and sustainable routines.
- `big_shifts`: moves, illness, job changes, travel, guests, and other temporary seasons.

These keys are product-original working labels. They must not be expanded into a source-like catalog without IP review.
