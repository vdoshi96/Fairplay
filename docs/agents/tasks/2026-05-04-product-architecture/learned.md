# Learned

## Product Shape

- V1 should be a mobile-first household planning web app, not a generic task manager and not a therapy product.
- The durable object is a responsibility with ownership, cadence, effort notes, review timing, and household-specific expectations.
- The first app experience should support two fixed personas, Alex and Max, selected after a shared household login.
- The product should make hidden coordination visible through neutral dimensions and aggregate signals, not through partner scores.
- Shared radar items and guided check-ins are the main relationship-support mechanisms for v1.

## Architecture Decisions

- Use Next.js App Router, TypeScript, Tailwind CSS, and Vercel deployment as the web foundation.
- Use Prisma with a Postgres-compatible managed database connected through Vercel Marketplace storage.
- Use explicit JSON route contracts for all durable product actions so future iOS clients are not dependent on React or web form behavior.
- Allow Server Actions only as web form conveniences that call the same domain services/API-shaped logic.
- Store passwords as slow hashes, preferably Argon2id; never store or log plaintext passwords.
- Store sessions server-side or in signed/encrypted opaque references with `HttpOnly`, `Secure`, and `SameSite=Lax` cookies.

## IP/Safety Decisions

- V1 should not ship a large starter deck, worksheet clone, source-derived taxonomy, Better Share-like UI labels, or copied prompts.
- V1 may include a small demo seed set made from original category names and invented examples, clearly separate from user data and reviewed before implementation.
- Private drafts, partner-visible notes, shared household records, and check-in-only items need explicit visibility states.
- Check-ins should be short, skippable, and decision-oriented, with pause/defer options for tense topics.
