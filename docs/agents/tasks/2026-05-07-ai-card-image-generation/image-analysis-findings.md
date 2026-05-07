# Image Analysis Findings

## Current Library Assets

Observed local assets:

- `public/assets/fairplay/cards/auto.png`
- `public/assets/fairplay/cards/laundry.png`

Findings:

- Both are `500x700` PNGs, a 5:7 portrait ratio.
- The artwork is full-bleed on a pale blush/pink field, without a visible outer card frame.
- The title sits near the top right in compact uppercase black serif/typewriter text.
- Category labels are orange, uppercase, vertical, and placed near card edges.
- The central object drawing is rough, flat, and hand-drawn, with black outlines and limited orange/yellow accents.
- Several cards include a small orange marker near the lower-left area.

## Live Qwen Visual QA

The broad initial prompt generated an image with a framed/card-on-table feel, which did not match the Library assets closely enough.

The current-Library prompt generated a closer 5:7 flat card concept, but the live provider still showed residual drift: it may introduce a rounded card, margin, oversized/multiline title, or extra graphic framing despite negative prompt instructions.

## Visual Risk

Prompt-only image generation can approximate the current Library style but cannot guarantee pixel-level parity. If true 1:1 layout fidelity is required, the next step should be deterministic composition: generate only the central object illustration, then place title/category/marker/background with code using the exact Library card layout.
