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
4. Generate every configured locale:

   ```powershell
   npm run generate
   ```

5. Run:

   ```powershell
   npm run check
   npm run check:es-MX
   npm run check:translations
   npm run check:notes
   npm run check:lfs
   npm run test
   git diff --check
   ```

6. Review the complete diff and generated trees.
7. Open a pull request describing the change, evidence, uncertainty, and
   affected outputs.

## Data conventions

- Use permanent lowercase ASCII IDs with hyphens.
- Preserve preferred spelling and UTF-8 diacritics in names.
- Store complete dates as ISO `YYYY-MM-DD`; use `YYYY` for year-only dates.
- Use `Unknown` for unknown occupation, birth date, birthplace, or death place.
- Presume people older than 110 are deceased unless a reliable source
  explicitly confirms they are living; handle year-only births conservatively.
- Keep canonical English narratives in `person.json`.
- Put localized narratives in `translations.json`.
- Update every locale when adding an occupation, birthplace, death place, or
  interface string.
- Keep research provenance in `researchNotes`, not in visual cards.
- Preserve existing photos and add improved versions with numbered filenames.
- Prefer non-AI-edited photos showing people in their 20s or 30s.
- Preserve approved story content and optional media. Keep story Markdown
  non-empty, store supported audio formats with Git LFS, keep audio at or below
  5 MiB where practical, and never exceed 10 MiB.

## Pull-request description

Explain:

- What changed.
- Which source or contributor supports it.
- What remains uncertain.
- Whether translations or generated views changed.
- Which checks and previews were reviewed.
