# Gaps

- No blocking T02 gaps.
- The current Vitest config does not resolve the `@/*` alias. T02 worked around this with relative imports and did not modify config because that file is outside T02 ownership.
- Safety copy is intentionally short and original; reviewers should still inspect all strings in `src/lib/safety-copy.ts` and `src/seed/demo-content.ts` for IP and relationship-safety fit.
