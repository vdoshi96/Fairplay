# Gaps

## Remaining Risks

- Provider output may drift from the exact current Library card composition.
- Generated dimensions are validated as portrait raster images, but not normalized to the exact 500x700 Library asset dimensions.
- Live authenticated browser e2e was not run in this pass.

## Recommended Follow-Ups

- Add deterministic card composition for exact 1:1 layout: fixed 500x700 background, title, vertical labels, lower-left marker, and a provider-generated central icon.
- Add visual snapshot checks around the generated cover preview using fixture images.
- Add an optional provider telemetry field to make image-generation failures easier to trace from support logs.
