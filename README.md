# PlainRoots

[Español (México)](README-es-MX.md)

**PlainRoots is a Git-native, human-readable family-history format.**

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
- Generate English and Mexican Spanish trees, cards, reports, and prompts from
  the same canonical records.
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

## Prerequisites

- Git
- Node.js 20 or later
- Microsoft Edge or Google Chrome to capture PNG previews

No third-party npm packages are required.

## Get started

```powershell
git clone <repository-url>
cd PlainRoots
npm run check
npm run check:mx-ES
npm run check:translations
```

Open `index.html` for the English tree or `index.mx-ES.html` for Mexican
Spanish.

## Source structure

```text
PlainRoots/
|-- tree.json
|-- research-notes.json
|-- research-notes.translations.json
|-- locales/
|   |-- us-EN.json
|   `-- mx-ES.json
|-- people/
|   `-- person-id/
|       |-- person.json
|       |-- translations.json
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

Set `lifeStatus` to `"living"`, `"deceased"`, or `"unknown"`. When adding or
reviewing source data, presume anyone older than 110 is deceased unless a
reliable source explicitly confirms that the person is living. For a year-only
birth, apply this default only when every possible birthday in that year makes
the person older than 110. Generated reports render the stored status without
overriding it.

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

## Useful commands

```powershell
npm start
npm run generate
npm run generate:mx-ES
npm run check
npm run check:mx-ES
npm run check:translations
npm run report
npm run report:mx-ES
npm run view:ascii -- --view ancestry --person sofia-garcia-smith
npm run render
npm run render:mx-ES
```

Person-focused views accept stable IDs such as `sofia-garcia-smith`,
`daniel-garcia-smith`, and `diego-garcia`.

Add `--highlight-missing` to generation, check, report, or render commands to
create a separate research-gap view.

## Contribution model

1. Create a descriptive branch.
2. Change the smallest possible source files.
3. Explain the evidence and any remaining uncertainty.
4. Generate and inspect both languages.
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
