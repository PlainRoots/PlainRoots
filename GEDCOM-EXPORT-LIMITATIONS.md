# GEDCOM export limitations

PlainRoots exports its canonical family data as GEDCOM 5.5.5 through:

```powershell
npm run export:gedcom
```

The exporter currently preserves individuals, structured primary names, maiden
names, nicknames, sex, births, deaths, occupations, partnerships, children,
marriage and divorce status, sibling groups with unknown parents, and raised-by
guardianships.

This document enumerates PlainRoots information and behavior that the current
exporter does not preserve completely. An item listed here is not necessarily
impossible to represent in GEDCOM. Some items are supported by GEDCOM but have
not been implemented, some require a project-specific extension, and others
have no faithful GEDCOM 5.5.5 equivalent.

## Completely omitted source data

| PlainRoots functionality | Current export behavior | GEDCOM 5.5.5 potential |
| --- | --- | --- |
| Person `remarks` | Omitted with a warning | Could be represented as `NOTE`, but the exporter does not yet define which remarks are appropriate for interchange |
| Person `researchNotes` | Omitted with a warning | `NOTE` could carry the text, but would not preserve its source-only purpose or privacy expectations |
| Project research notes | `research-notes.json` and its translations are not read by the exporter | A shared `NOTE` record is possible, but GEDCOM has no direct model for PlainRoots note statuses, implications, and project guidance |
| Stories | Story title, date, author association, Markdown content, and file identity are omitted with a warning | Parts could use `NOTE`, `EVEN`, or custom records, but there is no lossless standard mapping for the complete story model |
| Story audio | Omitted | GEDCOM multimedia links can reference files, but do not package the files or preserve PlainRoots audio policies and availability state |
| Story images | Files, alternative text, captions, and localized image text are omitted | `OBJE` can reference an image and include a title, but cannot faithfully preserve all PlainRoots accessibility and translation metadata |
| Portrait photos | Omitted with a warning when present | `OBJE` could reference the selected portrait, but the current exporter does not emit multimedia records or package media |
| `familyStatus` summaries | Omitted | Some values could be approximated through events or counts, but the field intentionally describes unmodeled or uncertain relatives and has no direct lossless mapping |
| Searchable person `name` | Not exported as a separate field | GEDCOM receives `givenNames` and `surnames`; the independent PlainRoots searchable/display value is not retained |
| Person `initials` | Omitted | These are presentation metadata rather than a GEDCOM genealogical fact |
| Tree title | Omitted | It could be included in `HEAD.NOTE` or a custom record, but that mapping is not implemented |

## Alternate-name limitations

PlainRoots alternate names contain a name, type, language, evidence, and
optional transliteration. Only entries with type `nickname` are currently
exported, using `NAME.NICK`.

The following types are omitted with a warning:

- `documented-variant`
- `married-name`
- `confirmed-original-spelling`
- `likely-original-spelling`
- `translated-name-equivalent`

GEDCOM supports multiple `NAME` structures and several `NAME.TYPE` values, but
GEDCOM 5.5.5 also requires each known name piece to be identified. PlainRoots
currently stores an alternate name as one complete string rather than separate
given-name and surname pieces. Splitting that string automatically would risk
corrupting names from different naming traditions.

Even for exported nicknames, the following metadata is lost:

- Language tag
- Evidence text
- Transliteration
- The distinction between confirmed use and a research hypothesis

## Localization limitations

GEDCOM output uses canonical English source values. It does not preserve:

- `supported-locales.json`
- Locale resource dictionaries
- Localized occupations
- Localized birth and death places
- Translated remarks and research notes
- Translated alternate-name evidence
- Story translations
- Localized story image alternative text and captions
- The canonical-versus-translation relationship between files
- BCP 47 locale identifiers used by PlainRoots

GEDCOM has a header language and limited phonetic or romanized name structures,
but it does not provide a general lossless model for PlainRoots' parallel,
field-level localization system.

## Values reduced during export

| PlainRoots functionality | GEDCOM output | Information lost or changed |
| --- | --- | --- |
| Explicit `"Unknown"` values | The corresponding GEDCOM line is omitted | A receiving application cannot distinguish “known to be unknown” from “not recorded” |
| `lifeStatus: "living"` | No GEDCOM event is emitted | GEDCOM absence of a death event does not prove that the person is living |
| `lifeStatus: "unknown"` | No GEDCOM event is emitted | The explicit PlainRoots uncertainty is lost |
| `lifeStatus: "deceased"` without death details | `DEAT Y` | The status is retained, but no PlainRoots provenance or reason is carried |
| `birthDateEstimated: true` | Date is prefixed with `ABT` | GEDCOM's “about” modifier does not retain how or why PlainRoots classified the date as estimated |
| Canonical place and occupation values | Canonical English text | Locale dictionary identity and translations are lost |
| Person IDs | Sequential pointers such as `@I1@` | Stable PlainRoots IDs such as `sofia-garcia-smith` are not retained |
| Family IDs | Sequential pointers such as `@F1@` | Stable PlainRoots family and relationship IDs are not retained |

## Relationship limitations

### Sibling groups with unknown parents

PlainRoots sibling groups are exported as child-only `FAM` records. GEDCOM
5.5.5 supports this representation, so the sibling relationship is retained.
The following PlainRoots information is not retained:

- Sibling-group ID
- The fact that the source explicitly modeled a sibling group rather than an
  ordinary family whose parents happen to be missing
- Derived sibling-group labels used by rendered views
- PlainRoots display and grouping behavior

### Raised-by guardianships

A raised-by guardianship is exported as a separate `FAM` record. The child
links to that record through `FAMC` with `PEDI foster`. This prevents the
guardians from replacing the child's modeled parents, but it is not lossless.

The following information is omitted with a warning:

- Guardianship ID
- `startingAge`
- Evidence classification
- The exact `raised-by` relationship label
- The distinction between a family guardian arrangement and other meanings of
  GEDCOM's broader `foster` pedigree value

### Partnership metadata

PlainRoots records `married`, `divorced`, `partnered`, and `unknown`
relationship status. The exporter writes partnered families as `EVEN` with
`TYPE Unmarried partnership`; unknown relationships omit marriage and
partnership events. An omitted relationship also defaults to `unknown`; known
marriages must store `married` explicitly. GEDCOM consumers may not interpret
the free-text partnered event consistently. The exporter cannot add
information that PlainRoots does not model, such as:

- Marriage or divorce dates
- Marriage or divorce places
- Relationship evidence
- Relationship-specific notes
- Legal, civil, religious, or customary marriage type

### Same-sex partner tags

GEDCOM 5.5.5 describes `FAM.HUSB` and `FAM.WIFE` as historical partner labels
that must not be treated as proof of sex or gender. Its strict grammar permits
at most one of each tag per family.

At the project's request, PlainRoots deliberately exports:

- Two `HUSB` records for two male partners
- Two `WIFE` records for two female partners

This preserves the requested PlainRoots convention but exceeds strict GEDCOM
5.5.5 cardinality. The exporter reports every use of this extension. Receiving
applications may reject the family, discard one partner, or normalize it to one
`HUSB` and one `WIFE`.

## Evidence and provenance limitations

PlainRoots keeps evidence and provenance close to the facts they explain. The
current exporter does not create GEDCOM `SOUR`, `REPO`, or source-citation
structures.

The following are therefore not exported:

- Alternate-name evidence
- Guardianship evidence
- Person research-note provenance
- Project research-note provenance
- Research-note status
- Research-note implications
- Story attribution beyond the source person association
- Repository guidance about fictional or private data

PlainRoots does not yet have first-class structured source assertions for every
fact. The exporter must not manufacture GEDCOM citations from narrative text.

## Media and archive-management limitations

GEDCOM is an interchange file, not a complete PlainRoots archive. It does not
carry the repository's media-management behavior:

- Git LFS tracking
- Audio size limits and warnings
- Preferred portrait selection
- Preservation of earlier portrait versions
- Supplemental photographs
- Missing-media availability state
- Markdown story files
- Repository-relative story and media paths as reviewable source artifacts
- Image alternative text and localized captions

The current exporter does not produce GEDZIP or another package containing the
GEDCOM file and its media.

## Generated-view functionality not represented

PlainRoots generates several views from the same source graph. None of this
presentation behavior is encoded in the GEDCOM file:

- Full-tree HTML
- Standalone person cards
- PNG previews
- Printable reports
- Terminal text reports
- Person-focused views
- Strict ancestry views
- Maternal and paternal ancestry views
- Descendant views
- Extended blood-relative views
- Spouse context selected for each view
- Lineage colors and card styling
- Sibling-group layout
- Connector presentation
- Generation summaries
- Local generation dates
- Highlight-missing research previews
- Unknown-value prompts
- Localized labels and descriptions

A receiving genealogy application is expected to choose its own selection,
layout, styling, and reporting behavior.

## Git-native workflow not represented

GEDCOM contains a snapshot of exported genealogical records. It does not
preserve PlainRoots' repository and review workflow:

- File-level change history
- Git commits and branches
- Pull-request review and discussion
- Evidence approval history
- Human-readable JSON diffs
- Per-person directory organization
- Source-versus-generated-file boundaries
- Translation completeness checks
- Story and media validation
- Privacy review procedures
- Family outreach and correction workflows
- Research planning and open-question tracking

These capabilities remain in the PlainRoots repository even when a GEDCOM file
is created.

## Sensitive information

Living people are intentionally included in full. The exporter does not redact
their names, dates, places, occupations, or relationships. It prints a
prominent notice that the resulting file contains sensitive family
information, but that notice is terminal output and is not embedded in the
GEDCOM file itself.

Anyone reviewing or sharing an export must treat the GEDCOM file as carrying
the same privacy risk as the underlying PlainRoots records.

## Summary

The current exporter is suitable for transferring the core family graph and
basic individual facts. A PlainRoots repository remains the authoritative
archive whenever stories, evidence, localization, guardianship details,
research context, media, presentation, or review history matter.
