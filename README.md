# PlainRoots

[Español (México)](README-es-MX.md)

**PlainRoots is a Git-native, human-readable family-history format.**

New to GitHub and command-line tools? Follow the
[Getting started guide](GETTING-STARTED.md).

Family records are stored in clear JSON, while HTML, images, printable reports,
and text reports are generated views. The source remains understandable without
the generator and is organized to produce meaningful diffs and reviewable pull
requests.

> Every person, date, relationship, story, and source in this repository is
> fictional. The repository is a public reference implementation and contains
> no data or photographs from the private family tree that inspired it.

## Why PlainRoots

- Preserve family history in UTF-8 text files that do not depend on a
  proprietary application.
- Review corrections as focused Git diffs instead of replacing an opaque
  database export.
- Use branches and pull requests to discuss evidence before publishing it.
- Generate trees, cards, reports, and prompts in canonical English and every
  additional locale configured in `supported-locales.json`.
- Keep research notes and provenance alongside the facts they explain.
- Produce full-tree, ancestry, descendant, blood-relative, printable, and
  terminal-friendly views.
- Highlight missing information without modifying the normal published views.

## Reference family

The fictional García-Smith family demonstrates:

- Connected relatives in Mexico, the United States, and Spain.
- English source records and Mexican Spanish narrative translations.
- Names and places with Unicode accents.
- A same-sex married couple.
- A single-parent branch.
- Siblings whose parents are unknown, without inventing parents.
- A raised-by relationship kept separate from biological ancestry.
- Remarks, research notes, project guidance, and explicit provenance.
- Unknown values that remain visible research prompts.

The examples are intentionally ordinary and must not be interpreted as claims
about real people.

## Language support

English (`en-US`) is the canonical locale and is always supported. The root
`supported-locales.json` lists every additional locale whose translations are
required and whose outputs are generated. Locale IDs, resource filenames, and
translation keys use canonical BCP 47 casing. Add a locale to the manifest and
provide its locale resource and complete translations; the standard generate,
report, render, and check commands discover it automatically.

## Source structure

```text
PlainRoots/
|-- tree.json
|-- research-notes.json
|-- research-notes.translations.json
|-- supported-locales.json
|-- locales/
|   |-- en-US.json
|   `-- es-MX.json
|-- people/
|   `-- person-id/
|       |-- person.json
|       |-- translations.json
|       |-- story-*.md
|       |-- story-*.jpg
|       |-- story-*.m4a
|       `-- card*.html
|-- scripts/
|-- templates/
|-- styles.css
`-- tree.js
```

`tree.json`, `research-notes.json`, locale files, person records, narrative
translations, and optional media are source data. Generated HTML files should
not be edited manually.

## Person records and photos

Person records may include `deathPlace` alongside `deathDate`. Use `"Unknown"`
when a death place is unknown, and add every known value to the `deathPlaces`
dictionary in each locale. Tree cards combine each birth or death date with its
place in a single localized life-event row.

Store person dates as `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, preserving the
precision supported by the evidence.

Every person record includes `sex`, using `"male"`, `"female"`, `"intersex"`,
`"unknown"`, or `"not-recorded"`. This value exists for genealogical data
exchange and maps directly to GEDCOM 5.5.5 `INDI.SEX`; family relationship
labels must not be inferred from it.

Set `lifeStatus` to `"living"`, `"deceased"`, or `"unknown"`. When adding or
reviewing source data, presume anyone older than 110 is deceased unless a
reliable source explicitly confirms that the person is living. For a
month-only or year-only birth, apply this default only when every possible
birthday in that period makes the person older than 110. Generated reports
render the stored status without overriding it.

Person records may include `alternateNames`. Each entry needs a name, BCP 47
language tag, type, and evidence; transliteration is optional. Use:

| Type | Meaning |
| --- | --- |
| `documented-variant` | A different form or spelling actually found in a source, including an institutional phonetic spelling |
| `married-name` | A documented name used after marriage |
| `nickname` | A confirmed familiar name |
| `confirmed-original-spelling` | The confirmed spelling in the original language or writing system |
| `likely-original-spelling` | An unconfirmed original-language reconstruction supported by linguistic and historical research |
| `translated-name-equivalent` | A recognized equivalent in another language, without claiming the person used it |

Use `maidenName` for a confirmed maiden name. Equivalent or reconstructed names
must never replace the person's display name, and their evidence must explain
the uncertainty.

Person records may also include a `stories` array for narrative accounts
authored by that person. Each entry needs a stable lowercase ASCII `id` and an
`original` object with a title, a non-empty Markdown `content` file, and a BCP
47 language tag. An optional `date` accepts `YYYY`, `YYYY-MM`, or
`YYYY-MM-DD`.
Language-keyed `translations` may supply localized titles and content files.
Optional `audio` and `images` attach original media; every image needs
non-empty alternative text and may include a caption and localized image text.
Keep all story files in the author's directory and use lowercase ASCII,
hyphenated filenames.

Audio files are stored with Git LFS. Supported formats are AAC, FLAC, M4A, MP3,
OGG, WAV, and WebM. Keep story audio at or below 5 MiB when practical; files
larger than 10 MiB fail validation. Never overwrite an existing story file.
Printable reports render localized story content and images with optional
audio and story-text links. Missing files are recoverable archive gaps, while
content files that exist must not be empty.

When no portrait is available, tree cards show at most four initials: the first
two from `givenNames`, followed by the first two from `surnames`. Never overwrite
or delete an existing portrait when adding a better one; preserve it and use the
next numbered name, such as `photo-2.jpg`. Include non-AI-edited photos,
preferably showing people in their 20s or 30s.

Families with two partners default to `married`; set
`"relationship": "divorced"` when the connector should communicate a divorce.
Sibling-group labels are derived from the siblings' recorded surnames rather
than internal family IDs. A lone visible sibling group is flattened into its
generation row. Person-focused PNG previews use
`<person-id>.<view>.<locale>.png`, which prevents previews for different people
from overwriting one another.

## GEDCOM export

Export the complete canonical tree as UTF-8 GEDCOM 5.5.5:

```powershell
npm run export:gedcom
npm run export:gedcom -- --output exports\family-tree.ged
```

The default output is the ignored `family-tree.ged` file. Existing files are
not replaced unless `--force` is supplied. The export includes full details for
living people and prints a prominent sensitive-information notice before the
file is shared.

Individuals, names, sex, births, deaths, occupations, families, children,
unknown-parent sibling groups, and raised-by guardianships are exported.
Guardianships use a separate family link with `PEDI foster`, preserving them
without changing biological parentage. Their starting age and evidence do not
have direct GEDCOM 5.5.5 representations and are reported as omitted. Stories,
research notes, photos, and non-nickname alternate names without independently
structured name pieces are also reported as warnings and omitted from the
first exporter version.

GEDCOM 5.5.5 treats `FAM.HUSB` and `FAM.WIFE` as historical partner labels and
normally permits at most one of each. For compatibility with applications that
represent same-sex couples using repeated partner tags, PlainRoots deliberately
exports two `HUSB` records for two male partners or two `WIFE` records for two
female partners and reports that extension as a warning.

See [GEDCOM export limitations](GEDCOM-EXPORT-LIMITATIONS.md) for the complete
inventory of omitted, reduced, non-standard, and repository-only functionality.

## GEDCOM import review

Analyze a GEDCOM 5.5, 5.5.1, or 5.5.5 file without changing PlainRoots source
records:

```powershell
npm run import:gedcom -- --input path\family.ged
```

The command creates an ignored `.plainroots-import/<file-name>/` review package
containing proposed people and relationships, diagnostics, unresolved source
records, and `IMPORT-REPORT.md`. It accepts UTF-8, UTF-16, and ASCII input;
ANSEL is rejected rather than decoded incorrectly. There is no automatic apply
or merge mode.

See [Importing GEDCOM for review](GEDCOM-IMPORT.md) for mappings, safeguards,
known loss, and the approval workflow.

## Contribution model

1. Create a descriptive branch.
2. Change the smallest possible source files.
3. Explain the evidence and any remaining uncertainty.
4. Generate and inspect every configured locale.
5. Run all checks.
6. Open a pull request whose diff tells the story of the proposed correction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete checklist.

## Format direction

This repository is a working reference implementation, not yet a finalized
standard. Planned format work includes versioned JSON Schemas, independently
typed relationships, first-class source assertions, privacy controls, and
loss-aware GEDCOM 7 import and export.

## License

PlainRoots is available under the [MIT License](LICENSE).
