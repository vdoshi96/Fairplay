# Learned

- The schema already has household foreign keys on the sensitive models, so most scoping can be enforced by repository `where` clauses plus relation-count validation before writes.
- `ResponsibilityTemplate.slug` is already unique and is suitable as the stable seed key; the primary key can become a generated UUID without changing seed lookup semantics.
- Prisma `@default(uuid())` is represented in the Prisma datamodel and generated client; the generated PostgreSQL migration does not emit database-side UUID defaults for these `TEXT` ids.
