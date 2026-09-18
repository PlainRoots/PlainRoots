---
name: manage-family-relationships
description: Analyze, add, or correct partners, parents, children, siblings, remarriages, half-siblings, raised-by caregiving, and generations in tree.json.
---

# Manage family relationships

Relationships are modeled in `tree.json` as families, not as fields inside
person records.

For real family data, require `protect-family-archive` to pass first. Use
`verify-genealogy-data` to evaluate identity, evidence, conflicts, corrections,
and uncertainty before changing relationships.

## Before editing

Relationship work begins with a dry run:

1. Identify each person by stable ID and check for same-name people, possible
   duplicates, and mistaken merges.
2. Read every existing family, sibling group, and guardianship containing the
   affected people.
3. Separate biological parentage, partnership, siblinghood, caregiving,
   guardianship, adoption, and stepfamily claims.
4. Compare the proposed relationship with existing parents, partners,
   children, surnames, dates, generations, and provenance.
5. Trace the families, sibling groups, guardianships, family-status summaries,
   and generated views that would change.
6. Show the complete proposed `tree.json` structures, person-record changes,
   provenance, and validation plan.
7. Ask for approval before editing.

Apply only approved relationships. Permission to add one relationship does not
approve inferred partners, parents, children, siblings, or caregivers.

## Family model

```json
{
  "id": "garcia smith",
  "partners": ["parent-one", "parent-two"],
  "children": ["child-one", "child-two"]
}
```

When siblings are confirmed but their parents are unknown, use a sibling group:

```json
{
  "id": "branch siblings",
  "partners": [],
  "children": ["sibling-one", "sibling-two"],
  "titleKey": "localizedSiblingGroupTitle"
}
```

When someone was raised by confirmed non-parent caregivers, use a separate
entry in the `guardianships` collection:

```json
{
  "id": "child-raised-by-guardians",
  "child": "child-id",
  "guardians": ["guardian-one", "guardian-two"],
  "relationship": "raised-by",
  "startingAge": 8,
  "evidence": "family-account"
}
```

## Rules

- Use one or two partners and any number of children.
- Two-partner families default to `unknown` when `relationship` is omitted.
  Store `married` or `divorced` explicitly only when confirmed, and use
  `partnered` for a confirmed informal or non-marital union.
- Do not use `partnered` merely because no marriage record has been found, and
  do not use `unknown` when evidence confirms that no partnership existed.
- For two-parent families with children, list the paternal parent first and the
  maternal parent second; ancestry branch ordering depends on this convention.
- Use only person IDs already listed in `tree.json.people`.
- Derive the family ID from the surname or combined surnames of the children.
- Keep family IDs lowercase ASCII with spaces or hyphens, unique, and stable.
- A person may appear in multiple families to support remarriage and
  half-siblings.
- Never duplicate a person to force a layout.
- Never add an unconfirmed relationship as fact.
- Remove a person's optional `familyStatus` summary when their exact partner or
  children are modeled, preventing contradictory data.
- Avoid parent-child cycles and relationships that make generation layout
  impossible.
- Families with multiple children render automatically as sibling groups.
- Use `siblingGroups` only when the sibling relationship is known and the
  parents are unknown. Never create a fake parent to force the grouping.
- Despite its collection name, `guardianships` records confirmed `raised-by`
  caregiving. It does not by itself establish legal guardianship.
- Never add caregivers as biological partners or parents merely to display
  their role.
- A raised-by entry must have one or two confirmed caregivers, a non-negative
  starting age, and explicit evidence. Preserve fuller provenance in
  `researchNotes`.
- Raised-by entries may add caregivers to focused ancestry context, but must
  never affect direct-ancestor traversal or generation calculation.

## Multiple partnerships and half-siblings

Represent each distinct partnership or single-parent branch as a separate
family. Reuse the same person ID across those families:

```json
[
  {
    "id": "rivera santos",
    "partners": ["parent-one", "first-partner"],
    "children": ["child-one"]
  },
  {
    "id": "rivera morales",
    "partners": ["parent-one", "second-partner"],
    "children": ["child-two"]
  }
]
```

The children are half-siblings because the two families share `parent-one`.
Do not create a separate sibling group for them and do not duplicate their
shared parent. Add `"relationship": "divorced"` only to a partnership that is
confirmed divorced; a later partnership does not prove divorce.

## Stepfamilies, adoption, and caregiving

The schema supports confirmed `raised-by` caregiving through the
`guardianships` collection. It does not separately encode legal guardianship,
step-parenthood, stepchild status, or adoption.

- Keep a child's confirmed biological parentage in its own family.
- A parent's later partner does not become the child's parent automatically.
- Do not add stepchildren as biological children merely to display a
  household.
- If a step-parent or another caregiver actually raised the child and the
  raised-by facts are confirmed, use a separate `guardianships` entry.
- A `raised-by` entry records the caregiving fact. It does not prove legal
  guardianship, adoption, or step-parenthood and must not be described as
  doing so.
- Do not model an adopted child as biological. Preserve confirmed adoption
  information in `remarks` or `researchNotes` according to its purpose and
  explain that the current relationship schema cannot represent adoptive
  ancestry faithfully.
- Someone raised as a sibling is not a biological sibling unless that
  relationship is independently confirmed.

When the schema cannot represent the relationship faithfully, explain the
limitation and ask whether to preserve the information narratively or defer
the relationship. Never invent a schema value or overload an existing type.

## Raised-by caregiving

Use the `guardianships` collection only for a confirmed `raised-by` caregiving
relationship. The collection name does not assert legal status. The current
schema requires:

- One child.
- One or two caregivers in the `guardians` array.
- Relationship value `raised-by`.
- A known non-negative integer `startingAge`.
- Evidence value `family-account`.

If the starting age is unknown, the evidence is not a family account, or the
relationship was caregiving without a confirmed raised-by role, do not force
it into the current structure. Preserve the evidence and limitation in
`researchNotes` and ask whether the schema should be extended separately.

Keep fuller source attribution in the affected person's `researchNotes`.
Never use a raised-by entry to alter biological ancestry, parent ordering,
generation calculation, surnames, or legal relationship status.

## Siblings

- Children in the same confirmed two-parent family are full siblings.
- Children in the same single-parent family share that confirmed parent, but
  the model alone does not establish whether they are full or half-siblings.
- Children across different families sharing one confirmed parent are
  half-siblings.
- Use `siblingGroups` only when siblinghood is confirmed but no parent is
  known.
- Do not use a sibling group for people merely raised together, described as
  close as siblings, or sharing a surname.
- When a correction moves someone between sibling groups or parent families,
  inspect every affected sibling and descendant rather than changing only the
  named person.

## Family-status summaries

Use optional `familyStatus` only when exact relatives are not modeled. The
current field can represent only the supported relationship category and
whether children exist; it cannot store an exact or approximate child count.

- `"has-children"` may summarize confirmed wording such as “has children,” “at
  least three children,” or “three or four children.”
- Preserve an exact or approximate count and its source in `remarks` or
  `researchNotes` when it is useful and appropriate.
- Do not create unnamed child records to satisfy a reported count.
- Do not convert “probably married” or “may have children” into a confirmed
  summary.
- Remove `familyStatus` when the exact partner or children are modeled.

## Correct relationships safely

Before changing parentage, partnership, siblinghood, or guardianship:

1. Verify that the correction concerns the intended people rather than a
   same-name person or accidental merge.
2. Show the current and proposed structures side by side.
3. Identify every family and relationship that would be removed, reused,
   created, or reordered.
4. Identify affected direct ancestry, descendants, sibling groups,
   guardianships, and family-status summaries.
5. Preserve the rejected claim, its source, and the correction rationale in
   `researchNotes` when useful for preventing the same mistake.
6. Do not delete a person merely because their relationship was wrong.
7. Ask for approval before applying the correction.

After editing, inspect both the corrected person's context and at least one
affected descendant's ancestry. A locally plausible edit can still create a
cycle, duplicate family, incorrect half-sibling relationship, or reordered
ancestry branch.

## Procedure

1. Complete the dry run and receive approval.
2. Reuse an existing family when adding another child to the same confirmed
   parent or parents.
3. Create a new family for a distinct partnership or single-parent branch.
4. Keep the order of people and families intentional because it influences
   rendered ordering.
5. Update or remove affected `familyStatus` summaries.
6. Preserve approved provenance and correction rationale in `researchNotes`.
7. Generate every active locale and inspect the complete tree.
8. Render focused views for affected people and descendants to verify parent
   chains, half-siblings, guardianships, and generation placement.
9. Show the source diff and generated outputs before commit or push.

## Validation

```powershell
npm run render
npm run check
```

The standard commands process canonical English and every active locale from
`supported-locales.json`. For each affected branch, run the smallest applicable
person-focused ancestry, strict-ancestry, descendants, or blood-relative check
and render command. Confirm the expected files exist and provide clickable
links for review.
