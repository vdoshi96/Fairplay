# Learned

- The direct service path can receive numeric values that bypass route schema validation, so the agenda builder must defend its own cap.
- JavaScript negative `slice` end indexes count from the end of the array, which turned `maxItems: -1` into "all but the last item."
- Normalizing before acknowledgement insertion and slicing keeps both generated and optional agenda items inside the same effective cap.
