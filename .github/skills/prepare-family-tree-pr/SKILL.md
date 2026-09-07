---
name: prepare-family-tree-pr
description: Prepare and review a family-tree contribution before commit or pull request. Use when asked to commit, push, open a PR, or check whether changes are ready.
---

# Prepare a family-tree pull request

## Review checklist

1. Confirm all added relationships are supported by explicit evidence.
2. Check that living-person information and photos are appropriate to share.
3. Verify IDs are stable, ASCII, correctly formatted, and referenced.
4. Confirm names preserve preferred spelling and diacritics.
5. Confirm dates use ISO `YYYY-MM-DD`.
6. Ensure every new occupation and birthplace exists in every locale resource.
7. Check that optional `familyStatus` summaries are confirmed, localized, and
   do not contradict exact relationships in `tree.json`.
8. Ensure generated HTML matches source data.
9. Inspect both localized trees after visual changes.
10. Do not include credentials, private documents, logs, or unrelated files.

## Required commands

```powershell
npm run generate
npm run generate:mx-ES
npm run check
npm run check:mx-ES
git diff --check
git status --short
```

Run both render commands when layout, styles, templates, translations, people,
or relationships changed.

## Pull-request description

Summarize:

- People and relationships added or corrected.
- Who or what source confirmed the genealogy.
- Any unresolved questions deliberately excluded from `tree.json`.
- Localization or design changes.
- Validation and previews reviewed.

Keep source and generated files in the same commit. Do not rewrite shared
history or amend commits unless explicitly requested.
