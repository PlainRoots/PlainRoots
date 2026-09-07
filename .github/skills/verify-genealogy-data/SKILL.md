---
name: verify-genealogy-data
description: Evaluate recovered, inferred, conflicting, or incomplete genealogy information before publishing it. Use when importing family records or deciding whether a relationship is confirmed.
---

# Verify genealogy data

Accuracy is more important than tree completeness.

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
   independently establish a fact or relationship.

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
6. Record corrections immediately and discard superseded inferences.
7. Do not silently convert proximity, matching surnames, or chart adjacency
   into a confirmed relationship.
8. Remove or correct `familyStatus` when exact relatives are later modeled.

## Publishing rule

If evidence is uncertain, explain it in the pull request or issue instead of
adding it to the published tree. Include the source, who confirmed it, and any
remaining ambiguity.
