# Gaps

## Source and Parsing Gaps

- The preferred Python libraries named in the task were unavailable locally, so workbook inspection used XLSX XML parsing and PDF inspection used Poppler command-line utilities.
- The workbook was inspected structurally, not visually rendered. Column widths, frozen panes, filters, validations, formulas, and field density were captured, but detailed style/color analysis was intentionally not copied.
- The PDF was not OCR-transcribed or rendered into repo artifacts. Card text and visual design were intentionally left out of the notes.
- The workbook appears to contain unused formatted grid space. The exact intended print/export behavior of that blank space was not investigated because it is not needed for v1 architecture.

## Product Architecture Questions

- Should v1 ship with any starter responsibility templates, or should it begin with user-authored responsibilities plus a few reviewed demo examples?
- If starter templates ship, how many are safe and useful without recreating a source-like deck experience?
- Should relevant days be first-class fields in MVP, or should cadence plus notes be enough for the first release?
- How should shared ownership be represented: equal accountability, backup support, split sub-responsibilities, or temporary handoff?
- Should equity snapshots include only current active items, or also paused/not-relevant items to show scope reduction over time?
- How much lifecycle structure should be required versus optional user notes?
- Should the product support variant groups, such as responsibility concepts that appear once per person, once per child, or once per location?
- What language should replace source-like "fairness" and "standard" terminology in the product voice?

## IP and Safety Risks

- Do not copy worksheet headings, assessment/dropdown labels, formulas as user-facing mechanics, card names, card descriptions, card text, or printable-card artwork.
- Avoid a literal 100-card or 101-card starter deck. Even if individual wording is rewritten, matching the catalog size and organization creates copycat risk.
- Avoid recreating the PDF's print-sheet layout, card dimensions, visual density, color system, icons, typography, or cut-card metaphor in the app.
- Avoid source-like category names and category distribution. Use an independently designed taxonomy reviewed against all private references.
- Do not expose source-like scoring or participant comparison language. Product metrics should be aggregate, opt-in, and non-punitive.
- Relationship-support flows should be safety-reviewed, especially concern flags, check-ins, imbalance summaries, and partner-visible notes.
