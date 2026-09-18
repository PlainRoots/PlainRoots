---
name: add-family-member
description: Add or update a person in this family-tree repository. Use when asked to add a relative, correct biographical details, add a photo, or complete a person record.
---

# Add a family member

Treat `people/<person-id>/person.json` as source data. Never hand-edit generated
HTML.

For real family data, require `protect-family-archive` to pass first. Evaluate
documentary evidence, family replies, conflicts, estimates, and identity
questions through `verify-genealogy-data`.

## Before editing

1. Confirm whether the person already exists or may duplicate another record.
2. Separate supplied facts from inference and identify the source of each fact.
3. Validate locations and preserve the precision of dates and estimates.
4. Show the proposed person ID, fields, provenance, files, translations, and
   tree membership.
5. Ask for approval before creating or updating source files.

Apply only approved facts. Permission to add one person does not approve
unconfirmed relatives, inferred relationships, sensitive source files, or
media.

## Procedure

1. Read `README.md`, `tree.json`, and one comparable existing person record.
2. Ask for missing facts rather than inventing genealogical data.
3. Record `sex` only when supplied or supported by approved evidence; otherwise
   use `unknown`.
4. Create a permanent lowercase ASCII ID with hyphens, such as
   `maria-garcia-lopez`.
5. Create or update `people/<person-id>/person.json`.
6. Preserve the person's preferred spelling and UTF-8 diacritics in names.
7. Store dates as ISO `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, matching the
   precision supported by the evidence.
8. Use:
   - `"Unknown"` for unknown occupation, birth date, birthplace, or death place.
   - `null` for an unavailable death date or photo.
   - `"unknown"` for an unconfirmed life status.
   - `"deceased"` as the default for anyone older than 110 unless the user or a
     reliable source explicitly confirms that the person is living. A confirmed
     `"living"` status always wins. For a month- or year-only birth, apply the
     default only when every possible birthday in that period makes the person
     older than 110.
   - Optional `remarks` for concise facts and biographical details about the
     person. Store narrative accounts separately in `stories`.
   - Optional `researchNotes` for provenance, evidence analysis, uncertainty,
     and curation guidance that must not render.
9. Put an approved photo in the person's folder and store only its file name.
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
10. Add new occupation, birthplace, or death-place values to every file under
   `locales/`.
11. Add the person to `tree.json` only when they belong in the published tree.
    Use `manage-family-relationships` before adding or changing family links.

## Person schema

```json
{
  "id": "person-id",
  "name": "Complete searchable name",
  "givenNames": "Given names",
  "surnames": "Surname or surnames",
  "sex": "unknown",
  "maidenName": null,
  "alternateNames": [
    {
      "name": "Lola",
      "language": "es",
      "type": "nickname",
      "evidence": "The person's daughter confirmed this nickname in 2026."
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
`sex` is required and accepts `male`, `female`, `intersex`, `unknown`, or
`not-recorded`. Preserve the supplied value and do not infer it from a person's
name, pronouns, partner, or family role.
`alternateNames` is optional. Every entry requires a non-empty `name`,
BCP 47 `language`, supported `type`, and descriptive `evidence`.
`transliteration` is optional and must be non-empty when present.

Supported alternate-name types are:

- `documented-variant`
- `married-name`
- `nickname`
- `confirmed-original-spelling`
- `likely-original-spelling`
- `translated-name-equivalent`

Use `maidenName` rather than an alternate-name entry for a confirmed maiden
name.

Use each type according to this table:

| Type | Use when |
| --- | --- |
| `documented-variant` | A source actually records a different form or spelling of the person's name, including a phonetic institutional spelling. This does not by itself establish a legal name change. |
| `married-name` | The person is documented as using this name after marriage. |
| `nickname` | A source or informed family member confirms this familiar name. |
| `confirmed-original-spelling` | Evidence confirms the person's name as spelled in its original language or writing system. |
| `likely-original-spelling` | Linguistic, historical, and cultural evidence suggests this unconfirmed reconstruction of the person's name in its original language or writing system. |
| `translated-name-equivalent` | This is a recognized equivalent in another language, but there is no claim that the person used it. |

`translated-name-equivalent` and
`likely-original-spelling` are research context, not documented
aliases. They must never replace the display name and their `evidence` must
explain that the person is not known to have used the proposed name.
`confirmed-original-spelling` requires evidence of actual use and must not be
used merely because a script conversion is plausible.

`remarks` is optional and may be a non-empty string or `null`. Reserve it for
concise facts and biographical details about the person; store narrative
accounts in `stories`. `researchNotes` follows the same optional format and
stores source provenance, documentary citations, uncertainty, evidence
conflicts, reasoning, portrait provenance, and curation guidance. It is
source-only and must never be added to cards or tree views.

`stories` is optional. Use the separate `add-family-story` skill to preserve an
approved text or audio story, create its localized Markdown content, and add
metadata. Stories render only in printable reports.

## Other life details

Store stable facts only in fields supported by the current person schema.
Birth and death places, dates, occupation, life status, names, and family
status have dedicated fields.

For burial, cemetery, migration, naturalization, last-known location,
languages, education, military service, religion, institutional affiliation,
or another unsupported detail:

1. Confirm that the detail is appropriate to retain, especially for a living
   person.
2. Preserve its source and uncertainty.
3. Use `remarks` only for concise biographical context suitable for family
   reports.
4. Use `researchNotes` for provenance, evidence analysis, hypotheses, or
   details that should not render.
5. Use a Story for a substantial attributed narrative.
6. Do not invent a new schema field solely to retain extracted information.

Ask before omitting a relevant detail that has no supported destination.
Never move private addresses, identity numbers, or unrelated sensitive
information into `remarks` or `researchNotes`.

## Group photographs

When extracting portraits from a group photograph:

1. Preserve the supplied group original unchanged and outside Git unless the
   user separately approves it as a supplemental repository image.
2. Ask the user to identify people and describe their order or position. Do
   not infer identities from facial resemblance.
3. Report the group image's pixel dimensions and file size.
4. Check each identified person's existing portraits. Skip a person with a
   preferred portrait unless the user requests a new candidate.
5. Create separate review crops using the normal 400 x 708 pixel portrait
   guidance and next available `photo-N.jpg` names.
6. Report each source crop and final image's dimensions and file size.
7. Provide clickable links to the group source and every candidate crop.
8. Wait for the user to confirm both identity and crop before updating person
   records or generated outputs.

If an identification is later corrected, remove the incorrect association
without deleting the preserved source or concealing the correction. Never
perform or claim facial-recognition identification.

## Privacy

Do not add private addresses, phone numbers, credentials, documents, or
unapproved photographs. Minimize information about living people. Remarks are
repository-visible even though generated views hide them. Research notes are
also repository-visible and must not contain private information.

## Validation

Generate and check canonical English plus every active locale through the
standard locale runner:

```powershell
npm run generate
npm run check
npm run check:translations
```

Run `npm run render` and inspect every active locale when a person, photo,
localized value, or relationship changes visual output. Confirm every
generated and rendered file exists before providing a clickable link.
