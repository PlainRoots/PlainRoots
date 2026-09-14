---
name: localize-family-tree
description: Add or update translations, localized occupations and places, locale-aware dates, and localized previews. Use for any language or wording change.
---

# Localize the family tree

English (`en-US`) is the repository lingua franca and is always supported.
Additional active locales are listed in `supported-locales.json`; locale
resources live under `locales/`. The current resources are:

- `locales/en-US.json` using `en-US`
- `locales/es-MX.json` using `es-MX`

## Rules

- Keep UI strings, occupation translations, and known birthplace translations
  in locale resource files.
- Keep `familyStatus` relationship and children labels in
  `familyRelationships` and `familyChildren`.
- Add localized titles, menu names, and menu descriptions for every registered
  view in `scripts/views.mjs`.
- Keep all interactive CLI prompts and status messages in locale resources.
- Keep dates in person records as ISO `YYYY-MM-DD`; formatting is locale-aware.
- Do not translate people's names, initials, IDs, or family IDs.
- Preserve UTF-8 diacritics.
- Add every new occupation and birthplace to every locale.
- Use natural, region-appropriate translations rather than literal word swaps.
- Keep placeholders such as `{people}` and `{generations}` unchanged.
- Use canonical BCP 47 locale IDs everywhere.
- Do not add `en-US` to `supported-locales.json`; it is implicit.
- Do not delete translation data or generated files when removing a locale
  from `supported-locales.json`. Inactive translations remain structurally
  valid but do not require fields added later to the English source.

## Procedure

1. Update the source resource and every translated resource.
2. If adding a locale, add its canonical BCP 47 ID to
   `supported-locales.json`, copy an existing resource, and use that same ID
   for the filename, `id`, and `languageTag`.
3. Add matching npm scripts when the locale should be maintained routinely.
4. Generate localized HTML and cards.
5. Render a localized PNG and inspect labels, dates, accents, text wrapping,
   occupations, places, family summaries, and unknown values.

## Current validation

```powershell
npm run generate
npm run check
npm run render:es-MX
npm run check:es-MX
```
