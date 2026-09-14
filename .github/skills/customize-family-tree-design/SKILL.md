---
name: customize-family-tree-design
description: Change the family tree's visual design, card layout, typography, sibling-group colors, or connector presentation. Use for CSS and presentation requests.
---

# Customize the family-tree design

`styles.css` is the design source of truth. Never edit generated HTML to make a
visual change.

## Design system

- Named design tokens are grouped at the top of `styles.css`.
- Sibling-group palettes are defined under the
  `Sibling-group palettes` comment.
- `templates/person-card-html.mjs` controls card markup.
- `scripts/generate.mjs` controls generation and grouping markup.
- `tree.js` draws responsive relationship connectors.

## Rules

- Prefer changing named CSS variables over scattering new literal values.
- Keep card width, height, photo width, text width, and generation spacing in
  the named tokens in `styles.css`; the PNG renderer reads these values
  dynamically.
- Keep given names on the first line and surnames on the second.
- Assign distinct sibling-group palettes within a generation; palettes may
  repeat across generations.
- Preserve full-width horizontal layout for large generations.
- Keep standalone cards and complete-tree cards visually consistent.
- Inspect previews for every active locale after each sizing or typography
  change because translated labels may wrap differently.
- Do not encode genealogical meaning through color unless explicitly requested.
- Maintain readable contrast and UTF-8 font support.

## Validation

Regenerate and visually inspect every active locale:

```powershell
npm run render
npm run check
```

Check the widest generation, long translated labels, maiden names, photos,
initials, sibling boxes, relationship markers, and connector alignment.
