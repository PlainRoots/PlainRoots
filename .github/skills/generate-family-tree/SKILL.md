---
name: generate-family-tree
description: Generate, validate, render, or prepare privacy-reviewed family-tree charts, text views, printable reports, and localized review packages.
---

# Generate the family tree

Source data consists of `tree.json`, `people/*/person.json`, per-person
`translations.json` files for populated narratives, `research-notes.json`,
`research-notes.translations.json`, optional photos, optional family stories
with localized Markdown content, locale resources, templates, styles, and
scripts.

Generated files must not be edited manually.

For real family data, require `protect-family-archive` to pass before
generating or opening outputs. Generated files can expose the same private
information as their source records even when Git ignores them.

## Commands

```powershell
npm start
npm run generate
npm run export:gedcom
npm run import:gedcom -- --input path\family.ged
npm run check
npm run check:lfs
npm run check:translations
npm run render
npm run report
npm run view:ascii -- --view descendants --person <person-id> --locale <locale-id>
```

The standard `generate`, `check`, `render`, and `report` commands process
canonical English and every active locale from `supported-locales.json`. To
produce only one locale for a specific review, call the underlying script with
`--locale <locale-id>` after confirming that the locale is active.

Add `--highlight-missing` to any generate, check, or render command to create a
separate `.highlight-missing` HTML or PNG research preview. This opt-in mode
uses yellow to identify displayed unknown facts without replacing normal
reports; missing portraits retain their standard placeholder styling. It also
displays an unknown death date for deceased people whose date is missing. Do
not treat intentionally omitted redundant fields as missing.

Use `node scripts/print-report.mjs --view <view-id>` to generate a
print-optimized HTML report for any registered view. Person-centered views also
require `--person <person-id>`. Add `--locale <locale-id>` for one active
locale and `--highlight-missing` for yellow unknown-fact markers. The report
includes the ASCII relationship outline, complete facts, modeled
relationships, remarks, research notes, family stories, and project-level
provenance guidance.
Person records use the complete graph for direct relationships, even when a
related person is outside the selected view. Story-text and optional audio
links include visible repository-relative paths. Missing content, audio, or
image files produce warnings and localized unavailable labels without stopping
generation.

ASCII outlines merge sibling-group members into an overlapping parental branch
for display instead of printing a separate sibling-group heading. Keep
guardianships in their own section.

Add `--minimal` to `scripts/cli-view.mjs` to omit birth years, death years, and
birthplaces from the ASCII entries. Printable reports always use this minimal
outline while retaining complete facts in their detailed person records.

English `remarks` and `researchNotes` in `people/<id>/person.json` are
canonical. When either field is populated, add
`people/<id>/translations.json`, indexed by locale, and include exactly the
translated fields corresponding to populated source fields. Do not put
canonical `en-US` text in translation files, omit required translations, add
empty translations, or add a narrative field absent from `person.json`.
Project-note translations are indexed by locale and stable note ID in
`research-notes.translations.json`; localized status labels belong in each
locale resource's `researchNoteStatuses`. Printable reports must fail instead
of falling back to English narrative text.

For a direct-ancestry view with aunts and uncles:

```powershell
npm run render:ancestry -- <person-id>
npm run check:ancestry -- <person-id>
```

For direct ancestors only:

```powershell
npm run render:ancestry-strict -- <person-id>
npm run check:ancestry-strict -- <person-id>
```

For descendants with the selected person's spouse(s), plus every descendant's
spouse:

```powershell
npm run render:descendants -- <person-id>
npm run check:descendants -- <person-id>
```

For all modeled blood descendants of the direct ancestors, plus every included
blood relative's spouse:

```powershell
npm run render:blood-relatives -- <person-id>
npm run check:blood-relatives -- <person-id>
```

For a single active locale, use the corresponding underlying script:

```powershell
node scripts/render.mjs --view ancestry --person <person-id> --locale <locale-id>
node scripts/generate.mjs --check --view ancestry --person <person-id> --locale <locale-id>
```

## Outputs

- `index.html`: canonical English tree.
- `index.<locale>.html`: additional-locale tree.
- `people/*/card.html`: canonical English standalone cards.
- `people/*/card.<locale>.html`: additional-locale standalone cards.
- `family-tree.png`: canonical English preview.
- `family-tree.<locale>.png`: additional-locale preview.
- `index.highlight-missing*.html`, `people/*/card.highlight-missing*.html`,
  and `family-tree.highlight-missing*.png`: ignored research-gap previews.
- `print-report*.html`: ignored image-free printable full-tree reports.
- `family-tree.ged`: ignored UTF-8 GEDCOM 5.5.5 export containing everyone in
  the tree, including full details for living people.
- `.plainroots-import/<source>/`: ignored review-only GEDCOM import package;
  it never modifies the family archive.
- `<person-id>.print-report.<view-id>.<locale>.html`: ignored image-free
  printable reports for person-focused views.
- `index.ancestry.html`: local ancestry view with the selected person's
  siblings and spouse(s), plus direct ancestors and their siblings.
- `index.ancestry.<locale>.html`: additional-locale ancestry view.
- `<person-id>.ancestry.<locale>.png`: localized ancestry preview.
- `index.ancestry-maternal*.html` and
  `<person-id>.ancestry-maternal.<locale>.png`:
  maternal-only ancestry using the second parent recorded in the family.
- `index.ancestry-paternal*.html` and
  `<person-id>.ancestry-paternal.<locale>.png`:
  paternal-only ancestry using the first parent recorded in the family.
- `index.ancestry-strict*.html` and
  `<person-id>.ancestry-strict.<locale>.png`:
  direct-ancestor-only outputs.
- `index.descendants*.html` and `<person-id>.descendants.<locale>.png`:
  descendant outputs with spouse context and descendant spouses.
- `index.blood-relatives*.html` and
  `<person-id>.blood-relatives.<locale>.png`:
  extended blood-relative outputs.

## Rendered chart links

After rendering any chart, include a direct clickable link to every generated
PNG in the final response. Use an absolute `file:///` URI so the chart opens
from the local filesystem, and label each link with its locale. Resolve the
repository root dynamically rather than assuming a fixed checkout location.

On Windows, convert path separators to `/` and format links like:

```markdown
[Open en-US chart](file:///C:/absolute/path/to/chart.en-US.png)
[Open locale chart](file:///C:/absolute/path/to/chart.LOCALE.png)
```

URL-encode spaces and other characters that are not safe in a URI. Confirm
each output exists before presenting its link. If rendering fails or an output
is missing, report that explicitly instead of emitting a broken link.

## Printable report links

After generating any printable report, include a direct clickable link to every
generated HTML report in the final response. Use an absolute `file:///` URI,
resolve the repository root dynamically, clearly label each locale, URL-encode
unsafe characters, and confirm each file exists before presenting its link.
On Windows, convert path separators to `/`, following the same URI conventions
as rendered chart links. If report generation fails or an output is missing,
report that explicitly instead of emitting a broken link.

## Prepare a family review package

Use a review package when a relative or informed family member will inspect a
focused branch for errors, missing people, or missing facts.

### Define the review

Before generating:

1. Confirm the reviewer or reviewer type and what they are being asked to
   verify.
2. Confirm the focus person, branch, relationship, or disputed facts.
3. Confirm the reviewer's requested language. Generate every active locale
   when no reviewer language is specified; otherwise generate only the
   requested active locale for the package.
4. Choose the smallest view that contains the needed context:
   - `person` for one person's complete record and direct relationships.
   - `ancestry-strict` for direct ancestors only.
   - `ancestry` for direct ancestors plus immediate sibling and spouse context.
   - `ancestry-maternal` or `ancestry-paternal` for one parental line.
   - `descendants` for a person's descendants and their spouses.
   - `blood-relatives` only when extended collateral context is necessary.
5. Decide whether a visual chart, printable report, text report, or a
   combination will help the reviewer. Do not generate every format by
   default.
6. Use `--highlight-missing` only when asking the reviewer to identify gaps.

### Privacy review

Inspect the complete generated output before presenting or sharing it:

- Include only the relatives and living-person details needed for the review.
- Check names, dates, places, photographs, remarks, Stories, and direct
  relationships.
- Remember that printable reports include `researchNotes` and project-level
  provenance guidance. Do not share one when those sections contain material
  inappropriate for the reviewer.
- Do not assume an ignored or local-only generated file is safe to share.
- Do not hand-edit generated output to redact it.

If no existing view can produce a safe package, explain the limitation and
ask whether the user wants a separate source-level feature for filtered
reports. Do not improvise a redacted generated file whose contents cannot be
reproduced and validated.

### Package output

For every included artifact:

1. Run the matching source-data check.
2. Confirm the file exists.
3. Open or inspect the complete output, not only the initial viewport.
4. Label it by view, format, and locale.
5. Provide a clickable absolute `file:///` link.
6. State what the reviewer should verify and which facts remain uncertain.

Use `draft-family-outreach` to prepare a short review request in the
reviewer's language. Do not send the message or generated files.

Returned annotations or corrections are new evidence. Preserve their original
wording, identify the respondent and date when appropriate, compare them
through `verify-genealogy-data`, and request approval before changing records.

## Procedure

1. For normal repository generation, always generate every locale registered
   by `supported-locales.json`; English is included implicitly. A review
   package may target one explicitly requested active locale.
2. Run `npm run check` to detect stale, missing, or incomplete content across
   all active locales.
3. Run `npm run render` when visual output changed or a preview was requested.
4. For ancestry views, confirm the selected person, their siblings and
   spouse(s), direct ancestors, and each direct ancestor's siblings are present.
   Exclude cousins, descendants, siblings' spouses, unrelated spouses, and
   other collateral branches.
5. Confirm the selected person and direct ancestors use the same lineage color
   and 5px border. Confirm paternal branches are on the left, maternal branches
   are on the right, fathers are rightmost in their sibling groups, and mothers
   are leftmost in theirs. Confirm explicit or relationship-inferred family
   status appears where available, except that every chart omits the Family
   field when that person's children are already visible in the chart. When
   only one member of an ancestral couple belongs to a displayed sibling
   group, confirm their spouse appears beside them inside that group. When both
   partners belong to separate displayed sibling groups, keep each with their
   own siblings and connect the groups.
6. For descendant views, confirm the tree flows downward from the selected
   person. The regular view excludes the selected person's siblings and
   includes their spouse(s), all blood descendants, and descendant spouses.
   Confirm the selected person and every blood descendant use the blue lineage
   treatment, while every non-blood spouse uses the gray spouse treatment.
7. Inspect the entire image, not only the initial viewport.
8. Confirm the preview shows the local generation date, without a time, below
   the people and generations summary.
9. Treat browser diagnostic noise as non-fatal only when the command exits
   successfully and the expected file exists.
10. If generation fails, fix the source or generator rather than hand-editing
   output.
11. Keep card dimensions and spacing in `styles.css`; `scripts/render.mjs`
    reads those CSS tokens to calculate complete screenshot dimensions.
12. Treat `scripts/views.mjs` as the registry for programmatic view IDs,
    localized name and description keys, selection behavior, and output stems.
    Add future views there and they will appear in the interactive `npm start`
    menu after their strings are added to every locale.
13. Validate each person-focused view independently: strict ancestry must not
    include siblings or spouses; ancestry must include immediate context and
    ancestral siblings; blood relatives must include all modeled blood
    descendants and every included blood relative's spouse. In blood-relative
    views, each spouse must appear beside their blood-relative partner inside
    the partner's sibling group, use the gray non-bloodline card treatment, and
    show life status. Show family status only when it is explicitly present in
    the person's JSON record; do not derive it for this view.
14. In the full view, group every person absent from all modeled family
    relationships in the orange localized unconnected group at the far right.
    Confirm those people do not appear in focused views.
15. Use `view:ascii` for a terminal-only text report containing names, birth
    and death years, and birthplaces. Call it a text report in user-facing
    communication. Format generations with ASCII tree connectors and
    whitespace indentation. Unknown dates must remain visible prompts. It must
    reuse the registered view selectors and localization resources rather than
    implement separate inclusion rules. Use `<-->` for spouses or partners and
    include a localized legend explaining the symbols.
16. When person records contain `stories`, run `npm run test:stories`, then
    generate printable reports for all active locales. Run `npm run check:lfs`
    only when at least one story has audio. Confirm each available content and
    optional audio file is linked and its relative path is visible. Treat a
    missing file warning as a recoverable archive gap, but do not accept an
    empty content file or an available audio file that is not stored with Git
    LFS.
17. Keep each audio file at or below 5 MiB when practical. `check:lfs` warns
    above 5 MiB and fails above the 10 MiB repository maximum. Based on testing
    with WhatsApp recordings (OGG format), these limits represent roughly 30
    minutes and one hour of speech, respectively; other encoders and audio
    content vary. When supplied story audio exceeds 10 MiB, ask the user how
    to handle it rather than automatically converting or discarding it.
