---
name: add-family-member
description: Add or update a person in this family-tree repository. Use when asked to add a relative, correct biographical details, add a photo, or complete a person record.
---

# Add a family member

Treat `people/<person-id>/person.json` as source data. Never hand-edit generated
HTML.

## Procedure

1. Read `README.md`, `tree.json`, and one comparable existing person record.
2. Ask for missing facts rather than inventing genealogical data.
3. Create a permanent lowercase ASCII ID with hyphens, such as
   `maria-garcia-lopez`.
4. Create or update `people/<person-id>/person.json`.
5. Preserve the person's preferred spelling and UTF-8 diacritics in names.
6. Store complete dates as ISO `YYYY-MM-DD`; use `YYYY` when only the year is
   known.
7. Use:
   - `"Unknown"` for unknown occupation, birth date, or birthplace.
   - `null` for an unavailable death date or photo.
   - `"unknown"` for an unconfirmed life status.
   - Optional `remarks` for non-private stories, lore, and general comments
     suitable for future display.
   - Optional `researchNotes` for provenance, evidence analysis, uncertainty,
     and curation guidance that must not render.
8. Put an approved photo in the person's folder and store only its file name.
   Never overwrite or delete an existing portrait. Preserve the original and
   add each replacement using the next numbered name (`photo-2.jpg`,
   `photo-3.jpg`, and so on); generated cards automatically select the highest
   available version. Keep `person.json` pointing to the original base photo.
   Prefer a centered 400 x 708 pixel portrait image, matching twice the rendered
   200 x 354 pixel photo area. When preparing a card crop, remove approximately
   6% of the image height from the top, preserve the 400:708 aspect ratio, and
   center the remaining horizontal crop. This places faces higher in the card,
   matching the user's preferred composition. Inspect the result and reduce the
   top trim if it would clip hair, hats, or other important details. Whenever
   the user says they added a photo, measure its actual pixel dimensions and
   report how they compare with the 400 x 708 pixel recommendation so the user
   can adjust it immediately.
9. Add new occupation or birthplace values to every file under `locales/`.
10. Add the person to `tree.json` only when they belong in the published tree.

## Person schema

```json
{
  "id": "person-id",
  "name": "Complete searchable name",
  "givenNames": "Given names",
  "surnames": "Surname or surnames",
  "maidenName": null,
  "alternateNames": [
    {
      "name": "Name in original script",
      "language": "ar",
      "transliteration": "Latin transliteration",
      "type": "likely-arabic-equivalent",
      "evidence": "Explain the source and limitations supporting this alternate name."
    }
  ],
  "initials": "PI",
  "occupation": "Unknown",
  "birthDate": "Unknown",
  "birthPlace": "Unknown",
  "deathDate": null,
  "lifeStatus": "unknown",
  "familyStatus": {
    "relationship": "unknown",
    "children": "unknown"
  },
  "remarks": null,
  "researchNotes": null,
  "photo": null
}
```

`familyStatus` is optional. Use it only to summarize unmodeled relatives, and
remove it when exact partner or child relationships are added to `tree.json`.
`alternateNames` is optional. Use it for likely language-specific equivalents
without replacing the documented name. Keep the tentative
`likely-arabic-equivalent` type until a historical record confirms actual use.
`remarks` is optional and may be a non-empty string or `null`. Reserve it for
family stories, lore, biographical narrative, and general comments suitable for
future display. `researchNotes` follows the same optional format and stores
source provenance, documentary citations, uncertainty, evidence conflicts,
reasoning, portrait provenance, and curation guidance. It is source-only and
must never be added to cards or tree views.

## Privacy

Do not add private addresses, phone numbers, credentials, documents, or
unapproved photographs. Minimize information about living people. Remarks are
repository-visible even though generated views hide them. Research notes are
also repository-visible and must not contain private information.

## Validation

Run all four commands:

```powershell
npm run generate
npm run generate:mx-ES
npm run check
npm run check:mx-ES
```
