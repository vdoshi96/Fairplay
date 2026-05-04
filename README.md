# Fairplay

Fairplay is a planned v1 product for helping households make shared work visible, negotiable, and easier to maintain over time.

## v1 Goal

The first version should support a small, practical household workflow:

- Define household responsibilities and expectations.
- Assign ownership with explicit handoffs and review points.
- Track current load and surface imbalances without blame-oriented language.
- Preserve enough history to support recurring check-ins.

## Architecture Direction

The intended implementation direction is a Next.js application deployable on Vercel, with a typed application layer and a durable data store selected during implementation planning. This setup commit intentionally does not scaffold production app code; it establishes the repository, documentation structure, and planning artifacts needed before application work begins.

## Setup Notes

- Target repository: `https://github.com/vdoshi96/Fairplay.git`
- Default branch: `main`
- Package manager and runtime will be selected when the application scaffold is created.
- Local environment files must stay out of git.

## Reference Material Policy

Private reference materials in `References/` are excluded from git. These files may inform future product thinking only after an IP-safety review, and no source text, cards, exports, PDFs, EPUBs, or spreadsheets should be copied into the repository unless they are already intentionally tracked and cleared for use.
