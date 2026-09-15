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

## Begin each session safely

Start Copilot CLI in the private archive and enter:

```text
Verify that this is my private family archive before handling family data.
Check the folder, GitHub visibility, branch, working tree, and every remote
fetch and push destination. Do not change anything until the private-archive
checks pass.
```

Stop if the repository is public, the folder is unexpected, or a remote could
push family information to public PlainRoots.

Keep private source documents and recordings outside Git by default. An
independent encrypted backup of irreplaceable originals is recommended, but
Copilot must not create, copy, configure, inspect, or manage that backup.

## Work in small, reviewable steps

For most tasks:

1. State whether Copilot should analyze only, propose changes, or apply
   approved changes.
2. Supply the source or describe who confirmed the information and when.
3. Ask Copilot to separate facts from inference and report conflicts,
   ambiguity, privacy concerns, and missing provenance.
4. Review the numbered proposal.
5. Approve only the items that should change.
6. Review the source diff and generated output.
7. Request a commit or push separately when ready.

Copilot should preserve uncertainty rather than inventing details, silently
choosing between conflicting sources, or completing a relationship merely to
make the chart look complete.

## Supply documents and images

Reference a supported file by typing `@` followed by its path or by dragging
it into the Copilot CLI session. Supported attachments include PDF, PNG,
JPEG/JPG, GIF, WebP, HEIC, and HEIF.

TIFF is not a native attachment format. Ask Copilot to preserve the original
and propose a temporary PNG or JPEG working copy. Approve the conversion
before it runs; the original must not be replaced or deleted.

OCR, handwriting recognition, transcription, and translation can be wrong.
Review names, accents, dates, ages, stamps, marginal notes, and unclear words
against the original.

## Common prompts

The examples below are starting points. Replace the fictional details with
your information and source.

### Analyze or ingest a source

```text
Analyze @C:\FamilySources\record.pdf as genealogical evidence. Begin
read-only. Transcribe relevant wording in its original language, identify
each claim and its provenance, compare it with the archive, validate
locations, and list conflicts or uncertainty. Show numbered proposed updates
but do not change files until I approve specific items.
```

For a legacy tree or spreadsheet:

```text
Compare @C:\FamilySources\old-tree.txt with this archive without changing
files. Classify exact matches, possible matches, new people, unresolved
duplicates, relationship conflicts, and unconnected people. Propose a small
first import batch and wait for approval.
```

### Add or correct a person

```text
Add confirmed relative Elena Navarro Ruiz. She was born in 1978 in Mérida,
Yucatán, Mexico, and is living. Her daughter confirmed this on 12 September
2026. Check privacy, duplicates, location, precision, and provenance. Show the
proposed record before changing files.
```

```text
This source gives a different birth date for Elena. Compare both claims and
their provenance. Do not overwrite either value automatically. Show the
supported precision, conflict, and proposed record or research note, then wait
for my approval.
```

Years, ranges, `before`, `after`, reported ages, and estimates must retain
their original precision. A calculated date is not automatically an exact
date.

### Add or correct relationships

```text
Elena Navarro and Mateo Ruiz are confirmed siblings with the same known
mother; their other parent is unknown. Check existing people and relationships,
do not invent the unknown parent or a partnership, and show the proposed model
and affected views before changing tree.json.
```

```text
Rosa Castillo raised Daniel Soto from age nine but was not his biological
parent. Preserve biological parentage and record only the confirmed raised-by
caregiving relationship supported by the current schema. Show the evidence
and proposed links before changing files.
```

`raised-by` records confirmed caregiving. It does not itself establish legal
guardianship, adoption, step-parenthood, or biological parentage. Ask Copilot
to explain any relationship the current schema cannot represent faithfully.

### Add a Story

```text
Add @C:\FamilySources\interview.m4a as an attributed family Story. Confirm the
author, speaker, date, permission, and existing person ID. Preserve the
original language, prepare a verbatim transcript with inaudible markers,
translate it for every active locale, and show the transcript and metadata for
approval before copying media or registering the Story.
```

For pasted text, identify the author and whether the account is direct memory
or retold information. Use `researchNotes` for hypotheses and competing
claims, `remarks` for concise report-ready context, and a Story for a
substantial attributed narrative.

### Add or improve a portrait

```text
Prepare @C:\FamilySources\portrait.jpg as Elena Navarro's card portrait.
Confirm her person ID and permission, preserve all existing portraits, report
the source dimensions and file size, and create the next numbered portrait.
Use the repository crop and size guidance, then report the final dimensions
and size and give me a link to review it before updating records.
```

For a group photograph, supply known identities and positions. Copilot may
create proposed crops, but visual resemblance is never sufficient evidence of
identity.

### Audit or research

```text
Audit this archive without changing files. Prioritize missing or uncertain
facts, relationships, provenance, source files, translations, and possible
duplicates. Rank the next five research actions by value, confidence, privacy
risk, and effort.
```

```text
Research the historical jurisdiction and likely record custodian for this
place and period. Cite authoritative sources, distinguish current from
historical geography, and keep contextual findings separate from person-level
facts. Propose any useful research notes and wait for approval.
```

### Draft outreach or process a reply

```text
Draft three focused questions for the relative most likely to resolve these
gaps. Use only the information needed, write in the recipient's language, and
include an English review translation. Explain why each answer would help. Do
not send anything.
```

```text
Process the following family reply as new evidence without changing files.
Preserve its original wording and language, attribute each claim to the
respondent and date received, compare it with the archive, identify conflicts
and follow-up questions, and show numbered proposed updates:

<paste the reply>
```

Copilot may draft correspondence and research official procedures, but it
must not send messages, submit forms, create accounts, pay fees, or contact
anyone.

### Prepare a family review package

```text
Prepare a review package for a relative to check this branch for missing
people and incorrect relationships. Ask for the reviewer, scope, goal, and
language. Choose the smallest useful view and only the formats needed. Inspect
the complete output for private or inappropriate material, give me verified
links, and draft, but do not send, a short review request.
```

Returned corrections are new evidence. They require attribution, comparison,
and approval before records change.

## Finish safely

After an approved update:

```text
Review the complete change using prepare-family-tree-pr. Check privacy,
provenance, uncertainty, relationships, translations, media, and generated
outputs. Run the applicable repository checks and show me the exact files and
diff. Do not commit or push until I explicitly request that action.
```

Commit small, related changes so their purpose and provenance remain
understandable. Before every push containing real family information, Copilot
must recheck the destination and repository visibility and obtain explicit
approval.
