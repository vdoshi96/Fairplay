# Learned

- The visibility fix brought responsibilities in line with the safer radar pattern: generic updates omit `visibility`, and private-to-visible changes go through a dedicated mutation with transition context and confirmation.
- The enum modules are simple and stable: literal arrays, Zod enum schemas, and exported inferred types all live together without React or browser dependencies.
- Zod contracts are generally strict and platform-neutral, but route-handler boundaries need to do more than accept documented happy-path examples. Username and responsibility-visibility creation are the two places where permissive contracts can leak product risk into T03/T04/T06.
- `normalizeHouseholdUsername` is deterministic for ordinary whitespace, case, and hyphen differences, but it is not yet a safe identity boundary because some accepted inputs normalize to empty or preserve unsafe punctuation.
- Load signals remain aggregate-only and avoid score, winner, loser, grade, or diagnosis fields. The helper is easy to reason about, though future persistence code should feed it already-validated ISO timestamps.
- The tiny demo seed set and safety-copy snippets are short, original, and maintainable; they are unlikely to become product debt if future template expansion keeps the same reviewed-content gate.
- The `@/*` alias resolves for TypeScript/Next, but Vitest alias resolution is not configured. That is a tooling gap for T03 if repository tests start using aliased imports.
