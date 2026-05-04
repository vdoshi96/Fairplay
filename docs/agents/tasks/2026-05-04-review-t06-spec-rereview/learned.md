# Learned

- `ResponsibilityUpdateSchema` is strict and still omits `visibility`; the fixed editor now keeps existing-record visibility out of the generic edit payload.
- Non-private responsibility visibility changes now use `POST /api/responsibilities/[id]/visibility` with the shared visibility mutation contract and explicit confirmation.
- Private responsibility visibility is rejected at create/update boundaries for v1; private draft behavior remains reserved for radar.
- Overview responsibilities now carry linked radar item ids/state, so the load-map radar filter is tied to actual service data instead of a disconnected prop.
- Load snapshot data already had `areaDistribution` and `hiddenEffortMix`; T06 now displays both with neutral summary labels.
