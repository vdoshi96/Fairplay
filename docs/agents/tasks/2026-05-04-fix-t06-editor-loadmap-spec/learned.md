# Learned

- `ResponsibilityUpdateSchema` intentionally omits `visibility`; existing edit saves must keep visibility out of the general `PATCH` payload.
- `ResponsibilityVisibilityMutationSchema` already exists and is the right contract for a dedicated visibility path.
- Responsibility records already persist `relevantDays`; the missing piece was summary/detail exposure plus editor controls.
- Load snapshot summaries already include `areaDistribution` and `hiddenEffortMix`; the load map only needed to surface those values.
- Radar items already carry `responsibilityId`, so the overview can attach linked item ids and state without touching T07 radar pages.
