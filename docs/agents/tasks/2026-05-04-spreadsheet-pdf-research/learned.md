# Learned

## Workbook Structure Summary

- The workbook contains 2 visible sheets and no native Excel tables or charts.
- The main worksheet is an assignment matrix with 101 responsibility rows. It combines a template/library column, a category-like column, seven weekday-style assignment columns, a separate owner/status column, and a household-standard note column.
- The main worksheet has 8 formulas. They summarize counts for two participants, shared items, excluded/removed items, and a recurring/high-frequency subset. Shared items are counted both independently and as part of participant-inclusive totals.
- The assignment worksheet has 2 dropdown validation systems: one for broad responsibility groupings and one for assignment/status choices across the weekday/owner grid. The assignment ranges are sparse and intentionally shaped, suggesting only relevant days/cells are editable for each responsibility.
- The assignment worksheet freezes the first 5 rows and applies an autofilter across a broad working range. This points to a worksheet meant for sorting, filtering, and live household review rather than only static reference.
- The reference sheet has 101 rows. Each row maps a responsibility concept to a grouping, a short overview, several lifecycle-like responsibility dimensions, and a household standard.
- The reference sheet has full coverage for overview and standard fields, with two lifecycle dimensions present on roughly 90% of rows. Some concepts appear as variants after removing participant/variant suffixes, so a product model should allow multiple template instances or variants from one base responsibility.
- The workbook stores a large amount of formatted blank grid space, but the active content is compact: about 100 responsibility rows, a few summary formulas, dropdowns, and long reference text cells.

## PDF Structure Summary

- The PDF is a 5-page, letter-size, tagged document produced from a page-layout tool.
- The PDF has a text layer on all 5 pages, totaling about 1,270 words. This suggests compact card faces rather than long instruction pages.
- The PDF contains 101 primary image rows plus matching soft masks. Most images are small, similarly sized card-face graphics at roughly print resolution.
- Image distribution is approximately 20 card-like assets per page, with one page containing an additional card-like or decorative asset. This reinforces the private source as a printable deck, not a flexible digital workflow.
- The PDF's visual card designs, typography, layout density, iconography, and card wording should be treated as protected source material. They should inspire only the abstract idea of compact responsibility objects.

## Original V1 Structural Ideas

- Onboarding worksheet shape: start with a guided inventory where users decide which responsibilities apply, who currently carries them, which ones are shared, which should be paused, and which need a conversation.
- Card/deck representation: model responsibilities as compact objects with metadata and household-specific notes, but do not mimic a physical deck, printable sheet, source card art, or source card wording.
- Assignment matrix: support recurring day/cadence signals separately from accountable ownership. A responsibility can have a current owner, backup/helper roles, relevant days, cadence, status, and review date.
- Review states: include `unassigned`, `active`, `shared`, `needs_review`, `paused`, `not_relevant`, and `archived` as original product states. Do not rely on visual columns or source deck piles as the canonical state model.
- Measurement options: track aggregate owner distribution, shared load, high-frequency load, category mix, excluded items, review-due items, and unresolved concerns. Avoid partner scores or source-specific scoring language.
- Progress pattern: record periodic equity snapshots that summarize assignments, unresolved concerns, recent changes, review dates, and standards updated during check-ins.
- Check-in pattern: let users review responsibilities by category, status, due-for-review, or flagged concern. The product should produce a calm summary of decisions instead of forcing users through source-like worksheet prompts.
- Household standard pattern: store each household's agreed "good enough" outcome as user-authored text, versioned over time, separate from any starter template summary.

## Model Implications

- `ResponsibilityTemplate`: id, sourceReviewStatus, titlePlaceholder, categoryIds, defaultCadence, hiddenEffortTags, variantGroupId nullable, contentVersion, createdBy.
- `ResponsibilityInstance`: id, householdId, templateId nullable, title, categoryIds, cadence, relevantDays, status, householdStandard, notes, createdAt, updatedAt, archivedAt.
- `Assignment`: id, responsibilityId, memberId, role, scope, relevantDays, startsAt, endsAt nullable, createdByMemberId.
- `ReviewConcern`: id, householdId, responsibilityId nullable, createdByMemberId, state, reasonCode, urgency, targetCheckInId nullable, createdAt, resolvedAt nullable.
- `ResponsibilityLifecycleNotes`: responsibilityId, noticingNotes, planningNotes, executionNotes, standardNotes, supportNeeded, blockers, lastReviewedAt, nextReviewAt.
- `EquitySnapshot`: id, householdId, periodStart, periodEnd, computedAt, ownerCounts, sharedCounts, highFrequencyCounts, categoryCounts, pausedCounts, needsReviewCounts, notes.
- `CheckInSummary`: id, householdId, startedAt, completedAt, reviewedResponsibilityIds, decisions, unresolvedConcernIds, nextReviewAt, summaryText.
- `TemplateVariantGroup`: id, purpose, allowedVariantTypes, reviewStatus. This avoids duplicating near-identical concepts as unrelated templates.

## IP-Safe Seed/Demo Guidance

- Demo data can include generic, original household responsibility titles after IP review, but should not mirror the private 100-card catalog, card names, category names, worksheet phrasing, or printable-card organization.
- Seed metadata can safely demonstrate category tags, cadence, owner role, review status, and household-standard fields using invented examples.
- Starter templates should be fewer, broader, and written from scratch for the product's voice. A "blank custom responsibility" flow is lower risk for MVP than a full starter library.
- Visual assets should be original icons or neutral UI components. Do not trace card shapes, colors, typography, icons, or print-sheet layouts from the PDF.
