---
name: manage-family-relationships
description: Add, correct, or explain partners, parents, children, siblings, remarriages, and generations in tree.json. Use for any family relationship or tree-layout change.
---

# Manage family relationships

Relationships are modeled in `tree.json` as families, not as fields inside
person records.

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
guardianship:

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
- Use `guardianships` for caregiving or raised-by relationships. Never add
  guardians as biological partners or parents merely to display their role.
- A guardianship must have one or two confirmed guardians, a non-negative
  starting age, and explicit evidence. Preserve fuller provenance in
  `researchNotes`.
- Guardianships may add caregivers to focused ancestry context, but must never
  affect direct-ancestor traversal or generation calculation.

## Procedure

1. Identify the exact people and confirm the relationship.
2. Read the relevant existing families in `tree.json`.
3. Reuse an existing family when adding another child.
4. Create a new family for a distinct partnership or single-parent branch.
5. Keep the order of people and families intentional because it influences
   rendered ordering.
6. Generate both locales and inspect the complete tree.
7. When the full tree becomes difficult to inspect, render an ancestry view for
   an affected descendant to verify the direct parent chain independently.

## Validation

```powershell
npm run render
npm run check
npm run render:mx-ES
npm run check:mx-ES
```
