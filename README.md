# Fairplay

Fairplay is a planned v1 product for helping households make shared work visible, negotiable, and easier to maintain over time.

## v1 Goal

The first version should support a small, practical household workflow:

- Define household responsibilities and expectations.
- Assign ownership with explicit handoffs and review points.
- Track current load and surface imbalances without blame-oriented language.
- Preserve enough history to support recurring check-ins.

## Architecture Direction

The intended implementation direction is a mobile-first Next.js App Router application deployable on Vercel, with TypeScript, Tailwind CSS, shared domain types, explicit JSON API contracts, Prisma, and a Postgres-compatible managed database connected through Vercel Marketplace storage. This repository state intentionally does not scaffold production app code; it establishes the documentation structure and product architecture needed before application work begins.

## Setup Notes

- Target repository: `https://github.com/vdoshi96/Fairplay.git`
- Default branch: `main`
- Future implementation should use Node.js 20.9 or newer, matching current Next.js App Router requirements.
- Future implementation should start from the current `create-next-app@latest` App Router defaults with TypeScript, ESLint, and Tailwind CSS.
- Database credentials, password/session secrets, and provider connection strings must be configured outside source through environment variables.
- Local environment files must stay out of git.

## Planned Deployment Notes

When production app implementation begins, deployment documentation should cover:

- Vercel project setup and environment variables.
- Vercel Marketplace Postgres-compatible storage connection.
- Prisma schema, migration, and deploy commands.
- Secure password hashing configuration.
- Server-managed session secret configuration.
- Local development commands and Vercel deployment flow.

Do not add real secrets, private reference materials, generated source assets, or plaintext passwords to this repository.

## Reference Material Policy

Private reference materials in `References/` are excluded from git. These files may inform future product thinking only after an IP-safety review, and no source text, cards, exports, PDFs, EPUBs, or spreadsheets should be copied into the repository unless they are already intentionally tracked and cleared for use.
