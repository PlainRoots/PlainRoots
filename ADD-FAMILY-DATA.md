# Add data to your family archive

Use this guide only in the private working copy created through
[Start your private family archive](START-YOUR-FAMILY-ARCHIVE.md). Configure
the family's languages in `supported-locales.json` before adding records.

You do not need to write JSON or give Copilot a long procedure. Describe the
task and confirmed information naturally, identify the source, and say what is
unknown or uncertain. Repository skills supply the detailed privacy,
provenance, relationship, translation, media, and validation rules.

You remain responsible for reviewing proposed interpretations, file changes,
translations, generated outputs, and privacy implications.

Before handling real family data, Copilot must run `protect-family-archive`
and verify the private repository and remotes.

## How the repository skills help

Copilot selects the relevant skill from your request. You may name a skill
when you want to make the workflow explicit.

| Task | Repository skill |
| --- | --- |
| Verify the private repository and safe remotes | [`protect-family-archive`](.github/skills/protect-family-archive/SKILL.md) |
| Read a document, image, export, or recovered notes | [`ingest-genealogy-source`](.github/skills/ingest-genealogy-source/SKILL.md) |
| Evaluate evidence, conflicts, locations, or identities | [`verify-genealogy-data`](.github/skills/verify-genealogy-data/SKILL.md) |
| Add or correct a person, name, fact, or portrait | [`add-family-member`](.github/skills/add-family-member/SKILL.md) |
| Add or correct family relationships or caregiving | [`manage-family-relationships`](.github/skills/manage-family-relationships/SKILL.md) |
| Add an attributed text or audio Story | [`add-family-story`](.github/skills/add-family-story/SKILL.md) |
| Audit gaps and plan further research | [`plan-genealogy-research`](.github/skills/plan-genealogy-research/SKILL.md) |
| Draft questions or source requests without sending them | [`draft-family-outreach`](.github/skills/draft-family-outreach/SKILL.md) |
| Add and review translations | [`localize-family-tree`](.github/skills/localize-family-tree/SKILL.md) |
| Generate charts, text reports, printable reports, or review packages | [`generate-family-tree`](.github/skills/generate-family-tree/SKILL.md) |
| Review and prepare a commit, push, or pull request | [`prepare-family-tree-pr`](.github/skills/prepare-family-tree-pr/SKILL.md) |

The skills distinguish permission to inspect a source, change records, copy
media, commit, push, and open a pull request. Approval for one action does not
approve the others.

## Supply documents and images

Reference a supported file by typing `@` followed by its path or by dragging
it into the Copilot CLI session. Supported attachments include PDF, PNG,
JPEG/JPG, GIF, WebP, HEIC, and HEIF.

TIFF is not a native attachment format. Ask Copilot to prepare it for review.
The source-ingestion skill governs conversion and preservation of the original.

## Common prompts

Replace the fictional details below with your information and source. The
skills supply the necessary checks, questions, and approval steps.

### Analyze or ingest a source

```text
Analyze @C:\FamilySources\record.pdf for information about my relatives.
```

For a legacy tree or spreadsheet:

```text
Compare @C:\FamilySources\old-tree.txt with my family archive.
```

### Add or correct a person

```text
Add confirmed relative Elena Navarro Ruiz. She was born in 1978 in Mérida,
Yucatán, Mexico, and is living. Her daughter confirmed this on 12 September
2026.
```

```text
@C:\FamilySources\record.pdf gives a different birth date for Elena. Help me
resolve the conflict.
```

### Add or correct relationships

```text
Elena Navarro and Mateo Ruiz are confirmed siblings with the same known
mother; their other parent is unknown. Add their relationship.
```

```text
Rosa Castillo raised Daniel Soto from age nine but was not his biological
parent. Add this caregiving relationship.
```

### Add a Story

```text
Add @C:\FamilySources\interview.m4a as a family Story. Elena Navarro is the
author and speaker.
```

You can also paste Story text directly and identify its author.

### Add or improve a portrait

```text
Use @C:\FamilySources\portrait.jpg as Elena Navarro's new card portrait.
```

For a group photograph, identify each known person and their position.

### Audit or research

```text
Audit my family archive and recommend the next five research priorities.
```

```text
Research the historical jurisdiction and likely record custodian for this
place and period.
```

### Draft outreach or process a reply

```text
Draft three questions for the relative most likely to resolve these research
gaps.
```

```text
Process this reply from Elena's daughter, received on 14 September 2026:

<paste the reply>
```

### Prepare a family review package

```text
Prepare a review package for Elena's daughter to check this branch for missing
people and incorrect relationships.
```

## Finish safely

```text
Review these changes and tell me whether they are ready to commit.
```

Ask Copilot to commit, push, or open a pull request only when you are ready for
that specific action.
