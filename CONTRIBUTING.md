# Contributing to PlainRoots

PlainRoots is designed so a pull request can explain a family-history change in
plain text. Keep contributions focused, evidence-aware, and safe to publish.

## Before changing data

- Remember that all bundled records are fictional examples.
- Do not submit private details or unapproved media about living people.
- Never invent a relationship to complete a visual branch.
- Distinguish direct evidence, family accounts, and inference.
- Validate place names and administrative geography before publishing them.

## Workflow

1. Pull the latest default branch.
2. Create a descriptive branch.
3. Edit source JSON, locale resources, templates, styles, or scripts.
4. Generate both languages:

   ```powershell
   npm run generate
   npm run generate:mx-ES
   ```

5. Run:

   ```powershell
   npm run check
   npm run check:mx-ES
   npm run check:translations
   npm run check:notes
   git diff --check
   ```

6. Review the complete diff and generated trees.
7. Open a pull request describing the change, evidence, uncertainty, and
   affected outputs.

## Data conventions

- Use permanent lowercase ASCII IDs with hyphens.
- Preserve preferred spelling and UTF-8 diacritics in names.
- Store complete dates as ISO `YYYY-MM-DD`; use `YYYY` for year-only dates.
- Use `Unknown` for unknown occupation, birth date, or birthplace.
- Keep canonical English narratives in `person.json`.
- Put localized narratives in `translations.json`.
- Update every locale when adding an occupation, birthplace, or interface
  string.
- Keep research provenance in `researchNotes`, not in visual cards.
- Preserve existing photos and add improved versions with numbered filenames.

## Pull-request description

Explain:

- What changed.
- Which source or contributor supports it.
- What remains uncertain.
- Whether translations or generated views changed.
- Which checks and previews were reviewed.
