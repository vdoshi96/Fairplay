# AI Card Provider Schema Fix Debugging Log

Date: 2026-05-07
Branch: `codex/ai-card-generation-provider-fix`

## Symptom

After the failed/canceled tracker UX was fixed, new AI-created card requests still persisted as failed drafts. The UI showed safe failures such as:

```text
AI card draft generation failed. Reference fp_ai_9021c461bdb64071b83f16c5f9f57f34.
```

Prompts seen in the failing UI:

- `take the recycling out`
- `deliver milk to the neighbors`

## Evidence

The exact Qwen-compatible text request with the existing prompt returned HTTP 200, so this was not a missing env variable or provider outage.

Live provider probe before the fix:

- `take the recycling out`
  - HTTP status: 200
  - elapsed: about 52s
  - provider request id: `9caa47e4-a693-95f2-a3cd-403c4868a749`
  - returned `hiddenEffortKeys` as descriptive phrases
  - returned `cadence` as `Weekly or bi-weekly, aligned with local collection schedule`
- `deliver milk to the neighbors`
  - HTTP status: 200
  - elapsed: about 38s
  - provider request id: `7359bcb4-5b27-9936-806c-8b56d6bdb110`
  - returned `hiddenEffortKeys` as display labels
  - returned `cadence` as `As needed or pre-arranged`

The app rejected those responses in `StructuredAiCardSchema`, because `hiddenEffortKeys` and `cadence` are strict enum fields.

## Root Cause

The Qwen system prompt told the model to return fields named `hiddenEffortKeys` and `cadence`, but did not enumerate the allowed app tokens. Qwen produced semantically reasonable human labels and sentences instead of enum values. The provider request succeeded, then local schema parsing failed and the service correctly marked the draft `GENERATION_FAILED`.

## Hypothesis Test

I manually added explicit enum instructions to the provider request, without changing production code first.

Live provider probe with explicit enum instructions:

- `take the recycling out`
  - HTTP status: 200
  - elapsed: about 46s
  - `hiddenEffortKeys`: `noticing`, `planning`, `doing`, `follow_through`
  - `cadence`: `weekly`
  - no invalid enum fields
- `deliver milk to the neighbors`
  - HTTP status: 200
  - elapsed: about 50s
  - `hiddenEffortKeys`: `noticing`, `planning`, `doing`, `follow_through`
  - `cadence`: `as_needed`
  - no invalid enum fields

This confirmed the fix should be at the prompt/schema boundary.

## Fix

- Updated `cardSystemPrompt` to enumerate the exact allowed `hiddenEffortKeys` and `cadence` tokens from the domain constants.
- Added an instruction that enum fields must return enum tokens only, not display labels or explanations.
- Added guidance for `areaKeys` to be short lowercase category tags. `areaKeys` is intentionally not a strict enum, but this keeps generated card metadata cleaner.

## Live Smoke After Production Prompt Change

Using the production prompt shape after the code change:

- `take the recycling out`
  - HTTP status: 200
  - elapsed: about 55s
  - provider request id: `d34a86fc-52da-9e20-bbc9-4a1461264317`
  - returned `hiddenEffortKeys`: `noticing`, `planning`, `doing`, `follow_through`
  - returned `cadence`: `weekly`
- `deliver milk to the neighbors`
  - HTTP status: 200
  - elapsed: about 49s
  - provider request id: `cebd7892-ca62-9231-b137-716c624696d9`
  - returned `hiddenEffortKeys`: `noticing`, `planning`, `doing`, `follow_through`
  - returned `cadence`: `as_needed`

No prompt text, API keys, or raw provider response bodies were logged into app diagnostics.

## Remaining Risk

Qwen text structuring is slow in local live probes, about 38-55 seconds for these simple prompts. Current evidence points to schema rejection as the failure cause, not timeout, because the app returned safe `GENERATION_FAILED` JSON and live HTTP requests completed successfully. If generation remains slow enough to hurt UX, the next architectural step should be async/background draft processing rather than more synchronous route patches.
