# Learned

## Product Contract

The draft was not truly ready when only structured text existed. For this flow, ready means the draft has generated text fields and a retrievable cover image.

## Architecture

The cover repository and route survived the text-only pass, so the least risky fix was to reconnect the service, contract, and UI layers instead of introducing new storage.

## Visual Direction

The current in-app Library assets are the source of truth for generated-card style. The older reference PDF is not the target for AI-generated covers in this flow.

## Provider Behavior

Qwen can be steered toward the Library style, but prompt-only control is not enough to guarantee exact composition. Deterministic shell composition would be stronger for exact visual parity.
