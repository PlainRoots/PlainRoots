---
name: ingest-genealogy-source
description: Analyze, compare, and apply approved genealogy evidence from documents, images, legacy trees, spreadsheets, or recovered notes.
---

# Ingest a genealogy source

Use this skill when the user supplies a PDF, image, legacy family tree,
spreadsheet, exported data, or recovered notes. Extract evidence without
silently converting it into published facts.

For real family data, run `protect-family-archive` before reading the source.
Stop if private archive mode is required and has not passed. This skill does
not authorize copying a source into Git, committing, or pushing.

## Select the mode

Confirm the requested mode before changing files:

- **Analyze only:** Describe and transcribe the source. Do not compare with or
  modify the archive unless comparison is explicitly requested.
- **Compare:** Analyze the source and compare it with existing records. Do not
  modify files.
- **Propose updates:** Produce an exact update plan with provenance. Do not
  modify files.
- **Apply approved updates:** Apply only items the user has explicitly approved
  from the current proposal.

Default to **analyze only** when the user asks what a source contains or says
not to add anything. Default to **propose updates** when the user asks to
extract and add information but has not yet reviewed the interpretation.
Never treat permission to read a source as permission to change records.

If the source contains multiple unrelated branches or many uncertain matches,
propose small review batches rather than one large update.

## Supported inputs and working copies

Copilot CLI can receive PDF, PNG, JPEG/JPG, GIF, WebP, HEIC, and HEIF
attachments. A source may also be plain text, Markdown, CSV, JSON, or another
text-based export that available tools can safely read.

TIFF is not a native Copilot CLI attachment format. For TIFF input:

1. Preserve the supplied original unchanged and outside Git.
2. Explain the proposed local conversion command and destination.
3. Obtain approval before creating a temporary PNG or JPEG working copy.
4. Use the working copy only for extraction and review.
5. Do not delete the original.
6. Ask before deleting the temporary conversion after the task.

Do not claim support for a genealogy exchange format merely because its text
can be inspected. PlainRoots has a tested review-only importer for GEDCOM 5.5,
5.5.1, and 5.5.5:

```powershell
npm run import:gedcom -- --input path\family.ged
```

It creates an ignored `.plainroots-import/` staging package and never applies
records. ANSEL input is rejected until it is safely converted to UTF-8.
Treat every staged proposal as source evidence requiring the matching,
conflict, provenance, and approval steps in this skill. For other exchange
formats, analyze them as source evidence unless the repository gains a tested
importer.

Do not upload source files or extracted contents to unrelated services. Keep
sensitive sources outside Git unless the user separately approves adding the
complete reviewed file under the rules in `protect-family-archive`.

## Profile the source

Before extracting person facts, record what can be established about the
source:

- Source type and title or short description.
- Issuing organization, archive, registry, parish, author, or compiler.
- Jurisdiction and collection.
- Creation, issue, registration, or compilation date.
- Volume, book, page, image, entry, certificate, or reference number.
- Original language or languages.
- Whether the source appears original, derivative, delayed, annotated, or
  incomplete.
- Who supplied the copy and when, when appropriate and safe.
- Pages, regions, or fields that are illegible, cropped, missing, or uncertain.

Do not copy credentials, financial information, private addresses, phone
numbers, identity-document numbers, or unrelated sensitive content into the
repository or response.

## Transcribe before interpreting

1. Transcribe relevant text exactly in its original language.
2. Preserve spelling, diacritics, punctuation, abbreviations, and apparent
   errors.
3. Mark uncertain characters and unreadable passages explicitly; never fill
   them through guesswork.
4. Keep page, image, row, cell, or section references with each excerpt.
5. Distinguish handwritten additions, stamps, marginal notes, and later
   annotations from the primary text.
6. Identify the stated informant or declarant when the source names one.
7. When OCR is used, tell the user that the result is a draft and identify
   names, dates, ages, and places that require visual review.

Translate relevant excerpts for review when requested. Preserve the original
transcription beside any translation and identify uncertain wording. A review
translation does not automatically belong in locale resources or person
records.

## Extract claims

List each claim separately with:

- The person or relationship it may concern.
- The exact source excerpt and its location.
- The source's original value.
- Any normalized value proposed for the archive.
- Whether the value is explicit, calculated, inferred, or unreadable.
- The informant, when known.
- Relevant uncertainty or internal contradiction.
- The existing archive value, when comparing.
- The proposed evidence level under `verify-genealogy-data`.

Treat dates, ages, names, occupations, locations, life status, parentage,
partnerships, children, guardianships, migration, burial, and other statements
as separate claims. An official document can be strong evidence for one claim
and weak evidence for another.

Do not derive an exact date from a year, an exact year from an approximate age,
or a confirmed relationship from chart placement or a shared surname.

## Match people carefully

When comparing a source with the archive, classify each person as:

- **Exact existing match**
- **Probable match**
- **Possible match**
- **Apparently new person**
- **Unresolved duplicate**
- **Conflict with an existing identity**

Use multiple attributes such as names, alternate names, dates, places,
partners, parents, children, siblings, occupation, and source context. Never
merge or update people based only on similar names.

For every non-exact match:

1. Show the candidate person IDs.
2. Explain supporting and contradictory evidence.
3. Identify what question or source could resolve the identity.
4. Ask the user to confirm the match before proposing record changes.

Visual resemblance may help a user formulate a question, but it does not
establish identity. Do not perform or claim facial-recognition identification.

## Reconcile legacy trees and recovered notes

For an indented outline, spreadsheet, legacy tree, or exported data:

1. Preserve its original ordering and hierarchy during analysis.
2. Mark ambiguous indentation, connectors, merged cells, shorthand, and
   spouse notation.
3. Extract people before treating lines as relationships.
4. Compare every proposed family link with `tree.json`.
5. Report people who would remain unconnected.
6. Identify relationships that the current PlainRoots schema cannot represent
   faithfully.
7. Divide a large import into small, high-confidence batches.
8. Never create placeholder parents or duplicate people to reproduce a legacy
   layout.

The source's visual proximity, row order, or indentation is evidence to
evaluate, not proof of a relationship.

## Evaluate conflicts and locations

Apply `verify-genealogy-data` to:

- Assess reliability separately for each claim.
- Calculate and preserve every supported date range.
- Compare informants, event proximity, record purpose, and registration timing.
- Retain competing evidence.
- Validate locations against authoritative sources.
- Ask for disambiguation when multiple places or identities remain plausible.

Never average conflicting dates, choose the newest record automatically, or
silently replace an existing value. If no source has a defensible advantage,
retain the current value, use the least-specific supported value, or leave it
unknown.

## Proposal format

Before applying changes, present:

1. A short source profile.
2. Transcription and translation issues requiring review.
3. Exact and possible person matches.
4. Proposed new people.
5. Proposed fact changes.
6. Proposed relationship changes.
7. Conflicts and unresolved questions.
8. Proposed provenance text for each affected record.
9. Files that would be created or modified.
10. Validation and generated outputs that would be required.

Separate confirmed items from candidate or unresolved items. Number the
proposals so the user can approve or reject them individually. Approval of one
item does not approve related or remaining items.

## Apply approved updates

When the user approves specific proposal numbers:

1. Recheck that the source and archive have not changed since the proposal.
2. Apply only the approved items.
3. Use `add-family-member` for person records and portraits.
4. Use `manage-family-relationships` for partners, parents, children, sibling
   groups, and guardianships.
5. Use `localize-family-tree` for values and narratives that require repository
   translations.
6. Store concise per-fact provenance, uncertainty, competing evidence, and
   rationale in `researchNotes`.
7. Keep narrative accounts in Stories or `remarks` according to repository
   rules rather than embedding them in evidence notes.
8. Do not create unsupported schema fields merely to retain every extracted
   detail.
9. Do not copy the source file into the repository unless that separate action
   was explicitly approved.
10. Leave rejected and unresolved proposals unapplied.

After applying a batch, show the source diff and stop for review before
starting another batch.

## Validation

Run the smallest complete existing checks for the files changed:

- Person and relationship changes: generate and check every active locale.
- Narrative translations: run translation checks.
- Stories: run story tests and localized printable-report checks.
- Added media: run applicable image or Git LFS checks.
- All changes: run `git diff --check` and report the working-tree status.

Do not commit or push unless the user explicitly requests it. Before either
operation with real family data, hand off to `prepare-family-tree-pr` and
repeat the destination checks required by `protect-family-archive`.
