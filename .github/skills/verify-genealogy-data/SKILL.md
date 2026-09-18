---
name: verify-genealogy-data
description: Evaluate sources, family replies, corrections, identities, locations, and inferred, conflicting, or incomplete genealogy information before publishing it.
---

# Verify genealogy data

Accuracy is more important than tree completeness.

For real family data, require `protect-family-archive` to pass before reading
sensitive evidence. When evidence comes from an attached document, legacy
tree, spreadsheet, or recovered notes, use `ingest-genealogy-source` to
transcribe and identify claims before evaluating them here.

## Operating mode

Evidence review begins as read-only analysis. If the user asks to analyze,
compare, research, explain, inventory, or identify conflicts, do not modify
files.

When the user asks to add or correct information:

1. Identify each proposed fact or relationship separately.
2. Show the source, evidence level, conflicts, uncertainty, and exact proposed
   value.
3. Ask for approval before changing source records.
4. Apply only approved items.

Permission to read evidence is not permission to update the archive. Approval
of one claim does not approve other claims from the same source.

## Evidence levels

- **Confirmed:** Explicitly supplied or approved by a family member, or
  supported by a reliable record.
- **Candidate:** Strongly suggested by names, hierarchy, dates, or recovered
  structure but not confirmed.
- **Unresolved:** Multiple reasonable interpretations remain.
- **Rejected:** Evidence or a family member contradicts the inference.

Only confirmed facts belong in `tree.json`.

An optional `familyStatus` summary may describe unmodeled relatives, but its
relationship and children values must also be confirmed. It does not establish
specific partner or parent-child relationships.

## Per-claim provenance

Assess and cite provenance for each claim, not merely for the source as a
whole. A single document may be primary evidence for one fact and weak,
incidental evidence for another.

For each claim, retain when known:

- The person or relationship concerned.
- The source type, creator or issuing organization, jurisdiction, and date.
- Page, image, entry, certificate, row, or other precise locator.
- The exact original statement and language.
- The informant or declarant and their ability to know the fact.
- Whether the value is explicit, calculated, inferred, translated, or
  unreadable.
- The source's value and any normalized archive value.
- Competing evidence, uncertainty, calculations, and rationale.
- Who supplied or confirmed the information and when, when appropriate and
  safe.

Keep provenance concise enough for `researchNotes`; do not copy entire
sensitive documents, private addresses, identity numbers, or unrelated
personal information into the repository.

## Automatic life status

When adding or reviewing source data, presume anyone older than 110 is deceased
unless the user or a reliable source explicitly confirms that the person is
living. Confirmed living status always overrides the age-based default. For a
complete birth date, apply the default after the person's 111th birthday. For a
month- or year-only birth, apply it only when every possible birthday in that
period would make the person older than 110. Preserve the unknown death date
and explain the age-based presumption in `researchNotes`. Report generation
must render the stored status without inferring or overriding it.

## Source reliability

Assess reliability for the specific fact being evaluated, not for the document
as a whole. An official record can still contain an inaccurate age, spelling,
relationship, or birthplace.

Consider these factors:

1. **Ability to know and verify:** Prefer information supplied or verified by
   the person concerned, followed by a close participant with direct
   knowledge. Information supplied after the person's death is weaker for
   facts only that person could reliably correct.
2. **Proximity to the event:** Prefer records created near the event over later
   recollections or derivative certificates.
3. **Purpose of the record:** Give more weight to facts central to the legal
   purpose of the record. Treat incidental ages, spellings, and relationships
   as more error-prone.
4. **Original versus delayed registration:** A timely original registration is
   usually stronger than a delayed registration. A delayed registration can
   still be strong when the person concerned participated and could verify the
   information.
5. **Self-declared legal records:** Notarial, immigration, naturalization, tax,
   and property records can provide strong evidence when they explicitly say
   the parties appeared and declared their particulars. Ages may nevertheless
   be rounded or copied incorrectly.
6. **Death records:** Treat a death certificate as primary evidence for the
   death date and place, but normally as secondary evidence for birth details.
   The deceased could not correct the informant's report.
7. **Family accounts:** Preserve attributed oral history as valuable evidence,
   but do not present it as documentary fact until corroborated.
8. **Derived clues:** Name days, age calculations, address matching, surname
   similarity, and photograph comparisons support hypotheses; they do not
   independently establish a fact or relationship. Visual resemblance never
   establishes identity, and the agent must not perform or claim
   facial-recognition identification.

Do not mechanically apply this order. For example, a child's delayed birth
registration may be stronger evidence for the mother's age than her later
death certificate if the mother participated and could verify her age. A
contemporaneous self-declared notarial record may be similarly strong, but a
one-year conflict can still result from rounded ages.

## Resolving conflicts

1. Transcribe each source's explicit statement before calculating implications.
2. Calculate every possible date range from reported ages and document dates.
3. Identify the informant when possible and whether the subject could correct
   the statement.
4. Check for internal conflicts, such as prose, RFC, and CURP values encoding
   different dates.
5. Never average conflicting dates or silently select the newest document.
6. Choose a working value only when one source has a defensible reliability
   advantage. Mark it as estimated and preserve every competing value,
   provenance, calculation, and rationale in `researchNotes`.
7. If no source is meaningfully stronger, keep the value unknown or use the
   least-specific supported value until more evidence appears.

## Precision and derived facts

Preserve the precision of the evidence:

- A year is not a complete date.
- `About 1900` is not exactly `1900`.
- `Before 1956` is not `1955`.
- `After 1920` has no implied end date.
- A range must not be replaced with its midpoint.
- `At least three children` is not exactly three.
- `Three or four children` must remain an unresolved range.

For a fact derived from an age on a dated source:

1. Transcribe the stated age and source date.
2. Calculate every possible birth date or year, accounting for whether the
   birthday had occurred.
3. Show the calculation and assumptions.
4. Mark the result as estimated.
5. Preserve the stated age, source date, range, and calculation in
   `researchNotes`.

Do not increase precision merely because the data model accepts a complete
date. If the schema cannot represent the supported precision faithfully, keep
the published value at the least-specific supported level and preserve the
full expression in `researchNotes`.

## Corrections, duplicates, and identity

Before correcting a person or relationship:

1. Check for similarly named people and unresolved duplicates.
2. Compare dates, places, partners, parents, children, siblings, occupations,
   alternate names, and source context.
3. Trace which families, sibling groups, guardianships, and generated views
   the correction would affect.
4. Distinguish a wrong fact from a wrong relationship, mistaken merge, or two
   different people with similar names.
5. Show the proposed change and its effects before editing.

Do not delete a person merely because one relationship or identifying fact was
wrong. Remove a rejected claim from the published value, but preserve its
source and the correction in `researchNotes` when useful for preventing the
same mistake or understanding prior conclusions. Never preserve superseded
private data that the repository does not need.

## Family replies and oral accounts

When the user pastes a relative's message or summarizes a conversation:

1. Preserve the original wording and language during analysis.
2. Identify the respondent, their relationship to the events or people, and
   when the reply was received, when appropriate and safe.
3. Separate direct memory from information heard from another person.
4. Extract each fact, correction, relationship, story, and uncertainty
   separately.
5. Expand abbreviations only when their meaning is clear.
6. Compare every claim with the archive and identify ambiguous names, dates,
   places, and conflicts.
7. Ask focused follow-up questions from the respondent's point of view.
8. Present proposed updates and attribution before changing files.

Attribute the claim to the relative who supplied it, not to the archive
contributor who typed or pasted it. A family reply can be first-hand evidence
without automatically overriding a contemporary record.

## Names, scripts, and linguistic hypotheses

Distinguish:

- Documented names and spelling variants.
- Maiden and married names.
- Confirmed nicknames.
- Original-script names and direct transliterations.
- Phonetic administrative spellings.
- Translated equivalents.
- Culturally plausible but unconfirmed name hypotheses.

Similar meaning, pronunciation, or cultural usage does not prove that a person
used a name. Research historical period, documented language, location, and
community without inferring ethnicity or religion. Keep unconfirmed linguistic
possibilities in `researchNotes`; add an alternate name only when evidence or
an informed family source confirms its use or explicitly approves its
tentative classification.

## Choose the right content location

| Content | Store in |
| --- | --- |
| Stable biographical fact represented by the schema | The corresponding `person.json` field |
| Substantial attributed first-person or family narrative | A Story through `add-family-story` |
| Concise biographical context suitable for family reports | `remarks` |
| Provenance, citations, competing claims, calculations, hypotheses, or curation guidance | `researchNotes` |
| Unsupported sensitive detail or unrelated information | Do not store |

Do not convert a narrative into `remarks` or a Story automatically. Identify
the narrator, distinguish direct memory from retelling, recommend a location,
and ask for approval. When one account concerns multiple people, keep one
authoritative attributed narrative rather than creating inconsistent copies.

## Location validation

Always validate a location before adding or correcting it. Prefer authoritative
geographic sources such as national statistical agencies, government locality
catalogs, civil registries, and official municipal or state records.

1. Confirm the standard spelling, accents, country, and current administrative
   hierarchy.
2. Distinguish a locality or municipal seat from its municipality, county,
   state, province, or similarly named region.
3. Check whether the source uses a historical name or historical jurisdiction
   that differs from the modern one.
4. Preserve the family's wording in provenance notes when it differs from the
   normalized display value.
5. If multiple plausible locations remain, do not choose one silently. Present
   the candidates and ask the user for the detail needed to disambiguate them
   before publishing the location.

## Procedure

1. Preserve the original spelling and wording of recovered evidence.
2. Separate direct evidence from inference.
3. Check whether the proposed relationship conflicts with existing parents,
   partners, children, surnames, or generations.
4. Ask focused questions from the perspective of the relative being asked.
5. Prefer questions that resolve an entire branch, such as identifying a
   sibling group's missing parent.
6. Remove superseded inferences from published values after approval. Preserve
   useful provenance explaining the correction.
7. Do not silently convert proximity, matching surnames, or chart adjacency
   into a confirmed relationship.
8. Remove or correct `familyStatus` when exact relatives are later modeled.
9. Keep read-only work read-only. For requested changes, present numbered,
   individually approvable proposals before editing.
10. After approved edits, use `add-family-member` and
    `manage-family-relationships` for the actual source changes and run their
    validation procedures.

## Publishing rule

If evidence is uncertain, explain it in the pull request or issue instead of
adding it to the published tree. Include the source, who confirmed it, and any
remaining ambiguity.
