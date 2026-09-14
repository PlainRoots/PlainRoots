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
   - `"Unknown"` for unknown occupation, birth date, birthplace, or death place.
   - `null` for an unavailable death date or photo.
   - `"unknown"` for an unconfirmed life status.
   - `"deceased"` as the default for anyone older than 110 unless the user or a
     reliable source explicitly confirms that the person is living. A confirmed
     `"living"` status always wins. For a year-only birth, apply the default
     only when every possible birthday in that year makes the person older than
     110.
   - Optional `remarks` for concise facts and biographical details about the
     person. Store narrative accounts separately in `stories`.
   - Optional `researchNotes` for provenance, evidence analysis, uncertainty,
     and curation guidance that must not render.
8. Put an approved photo in the person's folder and store only its file name.
   Never overwrite or delete an existing portrait. Preserve the original and
   add each replacement using the next numbered name (`photo-2.jpg`,
   `photo-3.jpg`, and so on); generated cards automatically select the highest
   available version. Keep `person.json` pointing to the original base photo.
   If `photo.jpg` already exists, ask whether the user wants to extract another
   card portrait or preserve the entire image as a supplemental photo. Offer a
   third option to replace the existing destination image only when that image
   is uncommitted, meaning it does not exist in `HEAD`. Verify this with Git;
   do not infer it from the working-tree status alone. Never offer replacement
   for an image that exists in `HEAD`. Do not infer the user's choice from the
   source file name or composition. For a portrait, use the next available
   numbered `photo-N.jpg` name. For a supplemental image, preserve the complete
   image without cropping and use the next available
   `photo-supplemental-N.<extension>` name.
   Prefer a centered 400 x 708 pixel portrait image, matching twice the rendered
   200 x 354 pixel photo area. When preparing a card crop, remove approximately
   6% of the image height from the top, preserve the 400:708 aspect ratio, and
   center the remaining horizontal crop. This places faces higher in the card,
   matching the user's preferred composition. Inspect the result and reduce the
   top trim if it would clip hair, hats, or other important details. Use 1 MB
   as the soft maximum file size for each photo. Before ingesting a photo over
   1 MB, report its size and require the user to confirm an exception. For a
   photo over 3 MB, require a second, separate confirmation even if the user
   already approved the exception above 1 MB. Whenever an image is imported,
   measure and report both its actual pixel dimensions and file size. For card
   portraits, compare the dimensions with the 400 x 708 pixel recommendation
   so the user can adjust them immediately. Report these details for both the
   supplied source and the final repository image when they differ.
   Whenever a user provides photos to add to the repository, show this best
   practice: "Include non-AI-edited photos, preferably of people in their 20s
   or 30s." After every photo-ingestion operation, provide clickable local
   `file:///` links to each ingested repository image so the user can review
   the exact results.
9. Add new occupation, birthplace, or death-place values to every file under
   `locales/`.
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
  "deathPlace": "Unknown",
  "lifeStatus": "unknown",
  "familyStatus": {
    "relationship": "unknown",
    "children": "unknown"
  },
  "remarks": null,
  "researchNotes": null,
  "stories": [
    {
      "id": "a-family-story",
      "date": "2026-09-08",
      "original": {
        "title": "Una historia familiar",
        "content": "story-family-es-mx.md",
        "language": "es-MX"
      },
      "translations": {
        "en-US": {
          "title": "A family story",
          "content": "story-family-en-us.md"
        }
      },
      "audio": {
        "file": "story-family.m4a"
      }
    }
  ],
  "photo": null
}
```

`familyStatus` is optional. Use it only to summarize unmodeled relatives, and
remove it when exact partner or child relationships are added to `tree.json`.
`alternateNames` is optional. Use it for likely language-specific equivalents
without replacing the documented name. Keep the tentative
`likely-arabic-equivalent` type until a historical record confirms actual use.
`remarks` is optional and may be a non-empty string or `null`. Reserve it for
concise facts and biographical details about the person; store narrative
accounts in `stories`. `researchNotes` follows the same optional format and stores
source provenance, documentary citations, uncertainty, evidence conflicts,
reasoning, portrait provenance, and curation guidance. It is source-only and
must never be added to cards or tree views.
`stories` is optional. Use the separate `add-family-story` skill to preserve an
approved text or audio story, create its localized Markdown content, and add metadata.
Stories render only in printable reports.

## Privacy

Do not add private addresses, phone numbers, credentials, documents, or
unapproved photographs. Minimize information about living people. Remarks are
repository-visible even though generated views hide them. Research notes are
also repository-visible and must not contain private information.

## Validation

Run all four commands:

```powershell
npm run generate
npm run generate:es-MX
npm run check
npm run check:es-MX
```
