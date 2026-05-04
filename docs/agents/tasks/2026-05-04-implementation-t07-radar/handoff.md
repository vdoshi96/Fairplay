# Handoff

## Summary

T07 adds the radar board, service, API mutations, and focused coverage. Private drafts are selected-persona filtered; shared/partner/check-in items are visible in the default radar list. Private draft publish requires explicit confirmation and the UI names the target visibility.

## Reviewer Focus

- Confirm `src/server/radar/service.ts` access checks do not expose another persona private draft or another household item.
- Confirm `/api/radar/[id]/publish` rejects private draft publication without `confirmPrivateDraftPublish`.
- Confirm `RadarBoard` copy and labels stay neutral and do not introduce score, proof, failure, complaint, or blame framing.
- Confirm the `targetCheckInId: null` scheduled placeholder is acceptable until T08 provides concrete check-in agenda wiring.

## Verification To Run

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/radar src/components/radar src/app/api/radar`
- `npm run test:e2e -- --grep "radar"`
- `npm run build`
- `git diff --check`
