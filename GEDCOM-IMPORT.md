# Importing GEDCOM for review

PlainRoots can analyze GEDCOM 5.5, 5.5.1, and 5.5.5 files and create an
ignored, reviewable staging package. Import does not update `tree.json`,
`people/`, locales, research notes, or generated family-tree outputs.

```powershell
npm run import:gedcom -- --input path\family.ged
```

The default staging location is:

```text
.plainroots-import/
`-- family/
    |-- import-manifest.json
    |-- proposed-tree.json
    |-- guardianship-candidates.json
    |-- pedigree-candidates.json
    |-- diagnostics.json
    |-- unresolved-records.json
    |-- IMPORT-REPORT.md
    `-- people/
        `-- proposed-person-id.json
```

The source GEDCOM file remains in its original location. It is not copied into
the repository.

## Safety and privacy

GEDCOM files and staging packages may contain names, dates, places,
occupations, relationships, notes, source citations, and other information
about living people. The command prints a prominent sensitive-information
notice.

The `.plainroots-import/` directory is ignored by Git. This does not make its
contents safe to share. Review the complete staging package and apply the
repository's normal privacy rules before moving any information into source
records.

An existing staging package is not replaced unless `--force` is supplied:

```powershell
npm run import:gedcom -- --input path\family.ged --force
```

Even with `--force`, the importer refuses to delete an existing directory
unless it contains a recognized PlainRoots GEDCOM import manifest.

Use `--output` to choose another staging directory:

```powershell
npm run import:gedcom -- --input path\family.ged --output review\family
```

## Supported encodings

The importer supports:

- UTF-8, with or without a byte-order mark
- UTF-16 little-endian
- UTF-16 big-endian
- ASCII

GEDCOM files declaring `CHAR ANSEL` are rejected with an actionable error.
PlainRoots does not decode ANSEL yet, and treating it as Windows-1252 or UTF-8
would silently corrupt names and places. Convert the file to UTF-8 using a
genealogy application or a verified conversion tool before importing it.

## Parsing behavior

The parser:

- Accepts CRLF, LF, and CR line terminators
- Builds the GEDCOM level hierarchy
- Resolves cross-references after reading the complete file
- Reports broken pointers
- Rejects duplicate cross-reference identifiers
- Supports `CONT` and `CONC`
- Unescapes doubled `@@` characters in line values
- Preserves user-defined and unsupported records for review
- Requires the file to begin with `HEAD` and end with `TRLR`
- Requires a supported `HEAD.GEDC.VERS` and `HEAD.CHAR`

Records do not need to appear before records that point to them.

## Current conversion mapping

| GEDCOM input | Staged PlainRoots proposal |
| --- | --- |
| `INDI` | Proposed person review file |
| Primary `NAME`, `GIVN`, and `SURN` | `name`, `givenNames`, and `surnames` |
| Additional `NAME` with `TYPE maiden` | `maidenName` when a surname is available |
| Primary `NAME.NICK` | `alternateNames` entry of type `nickname` |
| Other additional `NAME` structures | Evidence-review alternate-name proposal |
| `SEX M/F/X/U/N` | `male`, `female`, `intersex`, `unknown`, or `not-recorded` |
| `BIRT.DATE` | `birthDate`; `ABT`, `EST`, or `CAL` also set `birthDateEstimated` |
| `BIRT.PLAC` | `birthPlace` |
| `DEAT.DATE` and `DEAT.PLAC` | Death fields and `lifeStatus: deceased` |
| `DEAT Y` | `lifeStatus: deceased` |
| First `OCCU` | `occupation` |
| `FAM.HUSB` and `FAM.WIFE` | Neutral `partners` array |
| `FAM.CHIL` | `children` array |
| `MARR` | `relationship: married` |
| `DIV` | `relationship: divorced` |
| Child-only `FAM` with at least two children | `siblingGroups` proposal |
| `FAMC` with `PEDI foster` | Guardianship candidate requiring review |

Repeated `HUSB` or `WIFE` records are accepted. Partner sex is taken only from
`INDI.SEX`; the importer does not infer sex from family tags.

## Dates

PlainRoots currently stores complete dates as `YYYY-MM-DD` and year-only dates
as `YYYY`. The importer converts:

- `11 MAY 1968` to `1968-05-11`
- `1968` to `1968`
- `ABT 1968` to `1968` with `birthDateEstimated: true`

`EST` and `CAL` are also reduced to `birthDateEstimated: true` and reported as
lossy. Month-and-year dates, ranges, periods, before/after dates, interpreted
dates, date phrases, and non-Gregorian dates remain unresolved instead of
being guessed.

PlainRoots does not currently have `deathDateEstimated`, so an approximate
death date is staged with a warning.

## Names and proposed IDs

Structured `GIVN` and `SURN` values are preferred. When they are absent, the
importer can use the slash-delimited parts of `NAME`. It does not guess surname
boundaries in an unstructured name.

Proposed PlainRoots IDs are deterministic lowercase ASCII slugs. Numeric
suffixes resolve collisions. These IDs are proposals only and must be reviewed
before creating person directories.

If required person fields cannot be recovered, the staging proposal uses
`"Unknown"` and records a review issue. This is not approval to publish the
placeholder.

## Relationship review

Ordinary family records are staged only after all available person pointers
are resolved.

- A two-partner family without `MARR` or `DIV` receives
  `relationship: "unknown"` and cannot be applied directly to the current
  PlainRoots relationship schema.
- A one-partner family does not receive an invented relationship status.
- A family without partners and with at least two children becomes a sibling
  group proposal.
- A family without partners and fewer than two children remains unresolved.
- `PEDI foster` produces a guardianship candidate rather than an automatic
  relationship. GEDCOM does not provide PlainRoots' required starting age or
  evidence classification.
- Adoptive and other non-birth pedigree values are written to
  `pedigree-candidates.json` and are not converted into biological parentage.

## Unsupported and lossy content

The importer inventories unconverted structures in
`unresolved-records.json`, preserving their hierarchy and original line
numbers. Examples include:

- Notes and source citations
- Source and repository records
- Multimedia records and links
- Submitter records
- Family event dates and places
- Additional occupation details
- Change dates and application record numbers
- Custom `_TAG` records
- Events and attributes without PlainRoots fields
- Phonetic and romanized name structures
- Unsupported pedigree details

`diagnostics.json` contains malformed or broken relationships and lossy
conversion warnings. `IMPORT-REPORT.md` summarizes the proposed people,
relationships, guardianship candidates, diagnostics, and unresolved-record
categories.

## Approval boundary

The importer has no apply or merge mode. A staging package is source evidence,
not a set of accepted facts.

Before adding staged information to PlainRoots:

1. Profile and review the GEDCOM source.
2. Match people using multiple facts, not names alone.
3. Review conflicts, estimates, and unsupported records.
4. Confirm every proposed person and relationship.
5. Add provenance and uncertainty appropriate to the source.
6. Apply only explicitly approved proposals using the normal PlainRoots person,
   relationship, localization, and validation workflows.

Do not copy the original GEDCOM file or the staging package into Git without
separate approval and a privacy review.
