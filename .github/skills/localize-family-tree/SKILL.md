---
name: localize-family-tree
description: Add or update locale resources, narrative and Story translations, localized occupations and places, locale-aware dates, and localized previews.
---

# Localize the family tree

English (`en-US`) is the canonical repository source locale and is always
supported.
Additional active locales are listed in `supported-locales.json`; locale
resources live under `locales/`. Load the manifest for every localization task
rather than assuming a fixed set of languages. The current resources include:

- `locales/en-US.json` using `en-US`
- `locales/es-MX.json` using `es-MX`

For real family data, require `protect-family-archive` to pass before reading
or translating private narratives, correspondence, transcripts, or source
excerpts.

## Translation categories

Keep these operations distinct:

- **Interface localization:** Translate labels, prompts, view names, status
  values, and other application text into locale resource files.
- **Value localization:** Translate known occupations, birthplaces, and death
  places in locale dictionaries.
- **Narrative translation:** Translate canonical `remarks`, `researchNotes`,
  alternate-name evidence, and project research notes into their dedicated
  translation files.
- **Story translation:** Translate approved Story titles, content, image
  alternative text, and captions into the Story structures and separate
  Markdown files required by `add-family-story`.
- **Source review translation:** Translate a document excerpt or transcript so
  the user can evaluate it while preserving the original verbatim text.
- **Correspondence translation:** Draft a recipient-language message and a
  review translation through `draft-family-outreach`.
- **Transliteration:** Represent the sounds or characters of a name in another
  writing system; this is not translation.
- **Name-equivalence research:** Evaluate a translated name equivalent or a
  likely native-language reconstruction; this is not proof that the person
  used that name.

Do not place source-review or correspondence translations in locale resources
or person translation files merely because they use an active locale.

## Rules

- Keep UI strings, occupation translations, and known birthplace translations
  in locale resource files.
- Keep `familyStatus` relationship and children labels in
  `familyRelationships` and `familyChildren`.
- Add localized titles, menu names, and menu descriptions for every registered
  view in `scripts/views.mjs`.
- Keep all interactive CLI prompts and status messages in locale resources.
- Keep dates in person records as ISO `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`;
  formatting is locale-aware.
- Do not translate people's names, initials, IDs, or family IDs as application
  localization.
- Preserve UTF-8 diacritics.
- Add every new occupation, birthplace, and death place to every active locale.
- Use natural, region-appropriate translations rather than literal word swaps.
- Keep placeholders such as `{people}` and `{generations}` unchanged.
- Use canonical BCP 47 locale IDs everywhere.
- Do not add `en-US` to `supported-locales.json`; it is implicit.
- Do not delete translation data or generated files when removing a locale
  from `supported-locales.json`. Inactive translations remain structurally
  valid but do not require fields added later to the English source.

## Preserve original-language content

- Keep a document transcription or supplied narrative verbatim in its original
  language before translating it.
- Never replace source evidence with only its translation.
- Identify illegible, inaudible, abbreviated, or uncertain source wording
  before translation and preserve that uncertainty.
- Do not silently correct names, dates, contradictions, or apparent factual
  errors while translating.
- Keep names, record numbers, archive references, and original-script forms
  exactly as supplied unless the translation explicitly explains a normalized
  form.
- Treat machine transcription and translation as drafts until reviewed.
- For a source excerpt used only during evidence review, return the original
  and translated text together; do not automatically save either one.

## Names, translation, and transliteration

Follow the alternate-name types defined in `add-family-member`:

- `confirmed-original-spelling` requires evidence of actual use.
- `translated-name-equivalent` records a recognized equivalent in another
  language without claiming that the person used it.
- `likely-original-spelling` is an unconfirmed reconstruction
  supported by linguistic, historical, and cultural research.
- `documented-variant` includes phonetic institutional spellings; a documented
  spelling does not by itself prove that the person's legal name changed.

Do not create an alternate name merely to localize a report. Similar meaning,
pronunciation, transliteration, or cultural usage does not prove identity or
actual name use. Preserve the documented display name in every locale.

Only the `evidence` text of an alternate-name entry is translated in
`people/<id>/translations.json`; the name, language, transliteration, and type
remain source data.

## Context-sensitive genealogy terminology

Research meaning and local usage instead of translating these terms literally:

- Family relationships and kinship terms.
- Maiden, married, patronymic, and compound surnames.
- Civil, legal, notarial, immigration, and church offices.
- Military ranks and units from differently organized forces.
- Historical occupations, academic credentials, and institutional roles.
- Record types, archive collections, and jurisdiction names.
- Historical place names and administrative levels.
- Honorifics, nobility titles, religious terminology, and culturally specific
  expressions.

Preserve the source term when no precise equivalent exists and add a concise
localized explanation. Do not imply equivalent rank, legal authority,
relationship, or status when systems differ.

## Where translations belong

| Content | Destination |
| --- | --- |
| Application labels, menus, prompts, and statuses | `locales/<locale>.json` |
| Occupations and display places | Dictionaries in every active locale resource |
| Person `remarks`, `researchNotes`, and alternate-name evidence | `people/<id>/translations.json` |
| Project research notes | `research-notes.translations.json` |
| Story title and content | Story metadata and separate localized Markdown files |
| Story image alternative text and captions | The image's Story translations |
| Source excerpt translated for evidence review | Keep with the temporary review response; do not save automatically |
| Letter, email, or message | Outreach draft; do not add to locale resources |
| Person names, IDs, initials, family IDs, record numbers | Do not translate |

Canonical English narrative fields remain in source records. Every active
non-English locale requires the corresponding complete translation; printable
reports must fail rather than silently fall back to English narrative text.

## Translation review

For every translated value or narrative:

1. Preserve meaning, evidence level, uncertainty, and attribution.
2. Keep dates, names, quantities, and relationships semantically identical.
3. Preserve Markdown structure, links, placeholders, and identifiers.
4. Identify dialect, idiom, humor, historical language, mixed-language text,
   or technical terminology needing fluent-speaker review.
5. Inspect long labels and translated values in generated output for wrapping
   and truncation.
6. Do not call a machine-generated translation final until reviewed by a
   fluent speaker.

## Procedure

1. Load `supported-locales.json` and identify canonical English plus every
   active additional locale.
2. Identify the translation category and correct destination before editing.
3. Preserve and review original-language content.
4. Update the canonical source and every required active-locale translation.
5. If adding a locale, add its canonical BCP 47 ID to
   `supported-locales.json`, copy an existing resource, and use that same ID
   for the filename, `id`, and `languageTag`.
6. Complete translations required by existing active content. Do not activate
   a locale with partial current translations.
7. Add matching npm scripts only when the repository convention requires
   locale-specific convenience commands; standard commands must still process
   every active locale.
8. Run translation checks and generate every active locale.
9. Render every active locale when the change affects visible chart content.
10. Inspect labels, dates, accents, text direction, text wrapping,
    occupations, places, narratives, family summaries, and unknown values.
11. Report wording that still needs fluent-speaker review.

## Validation

```powershell
npm run generate
npm run check
npm run check:translations
```

Run `npm run test:locales` when locale configuration, resources, or translation
validation changes. Run `npm run test:stories` when Story localization changes.
Run `npm run render` and inspect every active locale when visible content or
layout may change.
