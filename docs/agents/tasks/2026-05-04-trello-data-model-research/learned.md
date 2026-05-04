# Learned

## Source Structure Summary

- The board exposes 6 workflow lanes and 100 open responsibility cards.
- At export time, all 100 cards sit in the reserve/library lane. The other lanes appear to represent review/attention, two individual owners, a child-related shared/split state, and a removed/trimmed state, but those lanes contain no active cards in the exported snapshot.
- The board defines 9 labels. 7 labels are used on cards; 2 labels are defined but unused.
- Used label-card counts are 30, 23, 22, 22, 21, 10, and 6. Cards can have multiple labels, so label totals exceed the 100-card deck count.
- The used labels function like broad source categories: recurring routine work, care responsibilities, away-from-home logistics, home work, delight/meaning work, disruption/life-event work, and personal wellbeing.
- All cards have descriptions and PNG attachments. There are 105 image attachments across 100 cards, with most cards having one image and a small number having multiple images.
- No cards have assigned members, due dates, start dates, checklists, comments, votes, custom field items, plugin data, recurrence rules, or Trello template flags.
- Every card description follows the same repeated structure: overview/context, three responsibility-lifecycle sections, and a minimum acceptable standard. The exact headings and text should not be reused.

## Workflow Implications

- The Trello board is closer to a responsibility deck plus manual assignment lanes than a task tracker.
- Lane movement encodes state and ownership, while labels encode coarse categories. A product model should not rely only on visual columns because mobile/API clients need first-class ownership and status fields.
- The empty owner lanes suggest the template starts with all responsibilities unassigned, then households move cards into owner or shared states.
- The attention/review lane implies a "needs discussion" or "on the radar" state separate from owner assignment.
- The removed/trimmed lane implies households need a way to hide, archive, or mark responsibilities as not relevant without deleting the template concept.
- The child-related split lane implies some responsibilities may need special handling for dependents, co-parenting, or child-specific sharing rather than a simple single-owner assignment.
- The lack of due dates/checklists suggests each card represents durable household accountability, not a one-time task.
- The repeated description structure implies users need fields for what the responsibility means, what must be noticed/decided, what must be prepared, what must be done, and what "good enough" means in that household.

## Original V1 Taxonomy Proposal

This taxonomy is transformed for Fairplay and should be treated as a starting point for product architecture, not copied seed content.

- Home care: cleaning, tidying, laundry, dishes, supplies, mail handling, storage, and household reset work.
- Food: groceries, meal planning, recurring meals, packed meals, kitchen readiness, and food-related cleanup.
- Planning and coordination: calendars, weekends, travel prep, social planning, school logistics, appointments, forms, and reminders.
- Family and social life: extended family, hosting, celebrations, gift-giving, thank-you rituals, community involvement, and social commitments.
- Admin and money: bills, budget tracking, insurance, documents, returns, benefits, points/coupons, estate planning, and household records.
- Maintenance and logistics: home repairs, vehicle care, yard/plants, renovations, moving, technology, transport, and physical household infrastructure.
- Health and safety: medical care, dental care, medication/insurance coordination, emergency readiness, personal care, contraception, and wellbeing routines.
- Child routines: morning/evening rhythms, bathing, clothing, childcare coverage, sleep support, diapers/toileting, meals, supervision, and screen boundaries.
- Child school and growth: teacher communication, homework, school supplies, breaks, transitions, extracurriculars, tutoring/coaching, friendships, values, and special support needs.
- Relationship and personal wellbeing: adult friendships, romance, individual renewal, appreciation, play, memory-keeping, and personal growth.
- Life events and disruptions: illness, job changes, aging relatives, new child transitions, death, moves, financial shocks, and unexpected daily disruptions.

Responsibilities should support multiple tags because real work often spans food plus planning, health plus admin, or child care plus routines.

## App Behavior Implications

- Card overview: show title, user-written summary, category tags, hidden effort dimensions, current owner state, cadence, standard, and recent status without source-derived description text.
- Ownership assignment: support unassigned, one accountable owner, shared accountable owners, helper/contributor, paused/not relevant, and needs-review states.
- Radar/status: let users flag a responsibility for discussion without changing owner; include reason, urgency, privacy, and desired check-in timing.
- Check-in prompts: ask what changed, what is unclear, what is blocked, what standard needs adjustment, who will carry the outcome until the next review, and when to revisit.
- Load balance signals: summarize active ownership counts, high-friction responsibilities, overdue reviews, hidden-effort mix, child-related load, recurring load, and life-event load. Avoid a partner score.
- Lifecycle fields: store noticing/decision work, preparation/planning work, execution/follow-through work, standard, cadence, dependencies, handoff notes, last reviewed date, and next review date.
- Library behavior: keep original responsibility templates separate from household-specific instances so users can hide, customize, combine, or split responsibilities.
- Image behavior: do not use Trello PNG assets. If the product needs visuals, create original icons/illustrations after IP review.

## API and Domain Model Sketch

- `Household`: id, name, timezone, createdAt, updatedAt.
- `HouseholdMember`: id, householdId, userId, displayName, role, status, joinedAt.
- `ResponsibilityTemplate`: id, slug, title, summary, categoryIds, suggestedTags, defaultCadence, lifecyclePromptSetId, sourceReviewStatus, version.
- `ResponsibilityInstance`: id, householdId, templateId nullable, title, description, categoryIds, tags, cadence, status, visibility, createdByMemberId, createdAt, updatedAt, archivedAt.
- `OwnershipAssignment`: id, responsibilityId, memberId, role, accountabilityLevel, startsAt, endsAt nullable, createdByMemberId.
- `ResponsibilityLifecycle`: responsibilityId, noticeDecideNotes, planPrepareNotes, executeFollowThroughNotes, standardNotes, dependencies, blockers, supportNeeded.
- `RadarItem`: id, householdId, responsibilityId nullable, createdByMemberId, visibility, state, urgency, topic, notes, targetCheckInId nullable, createdAt, resolvedAt nullable.
- `CheckIn`: id, householdId, scheduledFor, startedAt nullable, completedAt nullable, state, facilitatorMemberId nullable, summary.
- `CheckInItem`: id, checkInId, radarItemId nullable, responsibilityId nullable, type, promptKey, response, decisionId nullable.
- `Decision`: id, householdId, checkInId nullable, responsibilityId nullable, decisionType, summary, effectiveAt, reviewOn nullable, createdByMemberId.
- `LoadSignalSnapshot`: id, householdId, computedAt, periodStart, periodEnd, ownerDistribution, categoryDistribution, recurringLoadCount, reviewDueCount, radarOpenCount, hiddenEffortMix.
- `ResponsibilityEvent`: id, responsibilityId, actorMemberId, eventType, payload, occurredAt. Use for audit/history without exposing a blame ledger by default.

## Enum Candidates

- Responsibility status: `unassigned`, `active`, `needs_review`, `paused`, `not_relevant`, `archived`.
- Ownership role: `accountable_owner`, `shared_owner`, `helper`, `observer`.
- Accountability level: `outcome`, `part`, `backup`.
- Visibility: `private`, `shared_household`, `partner_visible`, `check_in_only`.
- Cadence: `daily`, `weekly`, `monthly`, `seasonal`, `event_based`, `as_needed`, `one_time`.
- Radar state: `open`, `scheduled`, `discussed`, `resolved`, `dismissed`.
- Check-in state: `draft`, `scheduled`, `active`, `completed`, `skipped`.
- Decision type: `assign_owner`, `change_standard`, `change_cadence`, `pause`, `split`, `combine`, `custom_note`.

## iOS-Compatible Contract Notes

- Use stable string enums and UUID strings for client interoperability.
- Send timestamps as ISO 8601 strings and include household timezone for local review/cadence display.
- Keep template text versioned so mobile clients can cache responsibility libraries without mixing source-reviewed and user-authored content.
- Represent lifecycle notes as nullable strings or structured rich-text blocks; avoid server-only markdown assumptions for v1.
- Make ownership history append-only through events or dated assignments so clients can render current state and past handoffs consistently.
- Keep aggregate load signals as snapshots so clients do not need to recompute sensitive metrics offline.
