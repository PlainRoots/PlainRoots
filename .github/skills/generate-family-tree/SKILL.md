---
name: generate-family-tree
description: Generate, validate, or render the family tree and its localized cards. Use when asked to refresh outputs, produce a preview, or diagnose stale generated files.
---

# Generate the family tree

Source data consists of `tree.json`, `people/*/person.json`, per-person
`translations.json` files for populated narratives, `research-notes.json`,
`research-notes.translations.json`, optional photos, locale resources,
templates, styles, and scripts.

Generated files must not be edited manually.

## Commands

```powershell
npm start
npm run generate
npm run generate:mx-ES
npm run check
npm run check:mx-ES
npm run check:translations
npm run render
npm run render:mx-ES
npm run view:ascii -- --view descendants --person <person-id>
```

Add `--highlight-missing` to any generate, check, or render command to create a
separate `.highlight-missing` HTML or PNG research preview. This opt-in mode
uses yellow to identify displayed unknown facts without replacing normal
reports; missing portraits retain their standard placeholder styling. It also
displays an unknown death date for deceased people whose date is missing. Do
not treat intentionally omitted redundant fields as missing.

Use `node scripts/print-report.mjs --view <view-id>` to generate an image-free,
print-optimized HTML report for any registered view. Person-centered views also
require `--person <person-id>`. Add `--locale mx-ES` for Mexican Spanish and
`--highlight-missing` for yellow unknown-fact markers. The report includes the
ASCII relationship outline, complete facts, modeled relationships, remarks,
research notes, and project-level provenance guidance. Person records use the
complete graph for direct relationships, even when a related person is outside
the selected view.

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
canonical `us-EN` text in translation files, omit required translations, add
empty translations, or add a narrative field absent from `person.json`.
Project-note translations are indexed by locale and stable note ID in
`research-notes.translations.json`; localized status labels belong in each
locale resource's `researchNoteStatuses`. Printable reports must fail instead
of falling back to English narrative text.

For a direct-ancestry view with aunts and uncles:

```powershell
npm run render:ancestry -- <person-id>
npm run render:ancestry -- <person-id> --locale mx-ES
npm run check:ancestry -- <person-id>
npm run check:ancestry -- <person-id> --locale mx-ES
```

For direct ancestors only:

```powershell
npm run render:ancestry-strict -- <person-id>
npm run render:ancestry-strict -- <person-id> --locale mx-ES
npm run check:ancestry-strict -- <person-id>
npm run check:ancestry-strict -- <person-id> --locale mx-ES
```

For descendants with the selected person's spouse(s), plus every descendant's
spouse:

```powershell
npm run render:descendants -- <person-id>
npm run render:descendants -- <person-id> --locale mx-ES
npm run check:descendants -- <person-id>
npm run check:descendants -- <person-id> --locale mx-ES
```

For all modeled blood descendants of the direct ancestors, plus every included
blood relative's spouse:

```powershell
npm run render:blood-relatives -- <person-id>
npm run render:blood-relatives -- <person-id> --locale mx-ES
npm run check:blood-relatives -- <person-id>
npm run check:blood-relatives -- <person-id> --locale mx-ES
```

## Outputs

- `index.html`: English tree.
- `index.mx-ES.html`: Mexican Spanish tree.
- `people/*/card.html`: English standalone cards.
- `people/*/card.mx-ES.html`: Mexican Spanish standalone cards.
- `family-tree.png`: English preview.
- `family-tree.mx-ES.png`: Mexican Spanish preview.
- `index.highlight-missing*.html`, `people/*/card.highlight-missing*.html`,
  and `family-tree.highlight-missing*.png`: ignored research-gap previews.
- `print-report*.html`: ignored image-free printable reports for all views.
- `index.ancestry.html`: local ancestry view with the selected person's
  siblings and spouse(s), plus direct ancestors and their siblings.
- `index.ancestry.mx-ES.html`: Mexican Spanish ancestry view.
- `family-tree.ancestry.png`: English ancestry preview.
- `family-tree.ancestry.mx-ES.png`: Mexican Spanish ancestry preview.
- `index.ancestry-maternal*.html` and `family-tree.ancestry-maternal*.png`:
  maternal-only ancestry using the second parent recorded in the family.
- `index.ancestry-paternal*.html` and `family-tree.ancestry-paternal*.png`:
  paternal-only ancestry using the first parent recorded in the family.
- `index.ancestry-strict*.html` and `family-tree.ancestry-strict*.png`:
  direct-ancestor-only outputs.
- `index.descendants*.html` and `family-tree.descendants*.png`:
  descendant outputs with spouse context and descendant spouses.
- `index.blood-relatives*.html` and `family-tree.blood-relatives*.png`:
  extended blood-relative outputs.

## Procedure

1. Always generate both English and Mexican Spanish outputs.
2. Run both locales' check commands and `npm run check:translations` to detect
   stale, missing, or incomplete localized content.
3. Render both locales when visual output changed or a preview was requested.
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
15. Use `view:ascii` for a terminal-only text report containing names, birth and
    death years, and birthplaces. Format generations with ASCII tree connectors
    and whitespace indentation. Unknown dates must remain visible prompts. It
    must reuse the registered view selectors and localization resources rather
    than implement separate inclusion rules. Use `<-->` for spouses or partners
    and include a localized legend explaining the symbols.
