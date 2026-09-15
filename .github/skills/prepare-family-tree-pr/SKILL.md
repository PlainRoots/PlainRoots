---
name: prepare-family-tree-pr
description: Review and prepare family-tree changes for commit, push, or pull request with privacy, provenance, localization, media, destination, and approval checks.
---

# Prepare a family-tree contribution

Use this skill when asked to assess readiness, commit changes, push a branch,
or open a pull request. Review is read-only until the user authorizes the
requested Git or hosting action.

Committing, pushing, and opening a pull request are separate actions. Approval
for one does not authorize the next. Do not amend a commit, rewrite history,
change repository visibility, alter remotes, create a remote repository, or
merge a pull request unless explicitly requested.

## Confirm the work mode

Determine whether the contribution is:

- **Public sample mode:** Changes contain only PlainRoots source code,
  documentation, and fictional sample genealogy suitable for the public
  repository.
- **Private archive mode:** Changes contain real family records, living-person
  information, private media, correspondence, or source-derived facts.

For private archive mode, run `protect-family-archive` before inspecting the
diff or generated output. Its repository, remote, visibility, and push-safety
checks must pass. Passing that check does not authorize a commit or push.

If the diff mixes public reusable improvements with real family data, stop.
Separate the public-safe implementation and fictional examples from the
private archive changes before preparing either contribution.

## Review the exact change set

1. Resolve the Git root, current branch, concise status, and complete diff
   against `HEAD`.
2. Include staged, unstaged, untracked, renamed, deleted, binary, and Git LFS
   changes in the review. Do not assume `git diff` alone shows the complete
   contribution.
3. Identify which files belong to the requested task. Do not stage unrelated
   user changes.
4. Inspect new and modified text files for credentials, tokens, private
   addresses, phone numbers, identity numbers, unrelated personal details,
   local absolute paths, temporary files, logs, and accidental source
   transcriptions.
5. Inspect each added or changed media file's purpose, subject, repository
   path, size, and LFS status. Do not infer safety from a filename.
6. Check ignored generated outputs separately when they are used for review;
   ignored files may still expose private information even though they will
   not be committed.
7. Present material concerns and the intended files before staging or
   committing. If the user requested only a readiness review, stop without
   changing Git state.

## Genealogy and provenance review

- Confirm every published person fact, relationship, family-status summary,
  Story attribution, alternate name, and location is approved and supported
  at the evidence level required by the relevant skill.
- Confirm uncertain, conflicting, candidate, and rejected claims are not
  presented as facts in `tree.json`.
- Preserve source precision. Do not turn years, ranges, `before`, `after`,
  reported ages, or estimates into unsupported exact dates.
- Check for duplicate people, mistaken merges, same-name confusion, and
  relationship side effects.
- Verify IDs are stable ASCII identifiers, correctly formatted, and fully
  referenced.
- Confirm names preserve documented spelling, diacritics, scripts, and the
  alternate-name semantics defined by `add-family-member`.
- Confirm dates use the precision and representation supported by the schema.
- Confirm people older than 110 default to `deceased` unless explicitly
  confirmed living, applying the year-only rule conservatively.
- Confirm provenance is specific enough to understand and relocate the source
  but does not copy sensitive documents or unnecessary personal information
  into the repository.
- Confirm `remarks`, `researchNotes`, Stories, and structured facts use their
  intended destinations and do not duplicate the same narrative.
- Describe unresolved questions deliberately excluded from published facts.

## Privacy review

For public sample mode:

- Confirm every person, family, event, Story, source example, filename, image,
  and generated preview is fictional or otherwise intentionally public.
- Look for details copied or closely patterned from a private archive,
  including distinctive combinations of names, dates, places, relationships,
  quotations, record numbers, or media.
- Replace private-derived examples with unrelated synthetic examples rather
  than merely changing one identifying field.

For private archive mode:

- Minimize living-person information and confirm permission for records and
  media where required.
- Confirm every collaborator on the destination repository may access each
  committed source or media file.
- Keep source documents, correspondence, recordings, and temporary working
  copies outside Git unless the user separately approved adding each file.
- Check commit messages, branch names, PR titles, PR bodies, filenames, and
  logs for unnecessary family details.
- Remember that deleting a sensitive file in the current diff does not remove
  it from existing Git history.

Do not include passwords, tokens, financial data, private addresses, phone
numbers, identity-document numbers, confidential correspondence, or unrelated
sensitive information in any mode.

## Localization review

Load `supported-locales.json`; do not assume a fixed set of languages.

- Treat `en-US` as canonical and include every active additional locale.
- Ensure every new or changed interface value, occupation, place, relationship
  label, view label, and other localized value is complete in every active
  locale.
- Ensure populated canonical narratives have the required translations in
  their dedicated translation files without silent English fallback.
- Confirm Story translations and localized media metadata follow
  `add-family-story`.
- Preserve names, dates, quantities, evidence levels, attribution,
  uncertainty, placeholders, links, and Markdown structure across languages.
- Identify machine-generated or culturally sensitive wording that still needs
  fluent-speaker review. Do not describe an unreviewed machine translation as
  final.
- Inspect generated output for accents, text direction, date formatting,
  wrapping, truncation, and semantic consistency.

## Media and generated-output review

- Preserve original media; confirm any derivative portrait or Story image uses
  the repository's naming, cropping, attribution, and metadata rules.
- Confirm Story audio is tracked by Git LFS, is at most 10 MiB, and preferably
  at most 5 MiB.
- Confirm no pointer file, required Story content, image, or audio asset is
  missing.
- Generate source-derived files instead of editing them manually.
- Keep source and tracked generated files in the same contribution.
- Inspect the complete rendered output, not only the initial viewport.
- Confirm generated HTML, charts, text reports, and printable reports match
  source data in every active locale.
- Treat family review packages as sharing artifacts, not automatically as PR
  attachments. Do not add or upload them unless the user explicitly requests
  it and their complete contents are appropriate for every recipient.
- Remember that printable reports include `researchNotes`; an output can be
  correct but still inappropriate to share.

## Validation

Always run:

```powershell
npm run generate
npm run check
git diff --check
git status --short
```

Also run the smallest applicable existing checks:

- `npm test` when schema, validation, generator, or behavior changes.
- `npm run test:locales` when locale configuration or locale validation
  changes.
- `npm run test:stories` when Story metadata, content, translation, or media
  changes.
- `npm run check:notes` when project research notes change.
- `npm run check:lfs` when Story audio exists or LFS-tracked media changes.
- `npm run render` when layout, styles, templates, translations, people, or
  relationships affect visible output.
- The matching person-focused check and render commands when a focused view
  changes.

Do not hide a failing check, silently regenerate over an unexplained change,
or weaken validation to make the contribution pass. Fix the source problem or
report the blocker.

## Commit gate

Before committing:

1. Show the files that will be committed and summarize material changes,
   privacy findings, unresolved issues, and validation results.
2. Confirm no unrelated or unreviewed file is staged.
3. Use a concise commit subject that does not expose private family details.
4. Obtain explicit approval to commit real family information. A request to
   review, generate, or stage changes is not commit approval.
5. Stage only the reviewed files and verify the staged diff before creating
   the commit.
6. Do not amend an existing commit unless the user explicitly requests it.

After committing, report the commit identifier. Do not push merely because the
commit succeeded.

## Push and pull-request gate

Immediately before any push:

1. Re-resolve the Git root, branch, status, complete push destination, and
   repository visibility.
2. In private archive mode, repeat every push-safety check required by
   `protect-family-archive`.
3. Confirm the branch contains only commits intended for that destination.
4. Show the destination owner, repository, visibility, and branch.
5. Obtain explicit approval for that push. Earlier approval to commit or a
   previous push does not authorize it.

Before opening a pull request:

1. Confirm the head repository and branch, base repository and branch, and
   visibility of both repositories.
2. Never open a pull request containing real family information against public
   PlainRoots or any other public repository.
3. Confirm the title, body, labels, linked issues, reviewers, and attachments
   reveal no information beyond what is appropriate for everyone who can
   access the destination.
4. Present the proposed title and body and obtain explicit approval before
   creating the pull request.
5. Do not add reviewers, upload files, enable auto-merge, merge, or delete the
   branch unless separately requested.

## Contribution description

Describe only what collaborators need to review:

- People, facts, relationships, or fictional examples added or corrected.
- The source category and evidence basis for genealogy changes, using
  privacy-safe provenance rather than sensitive source contents.
- Unresolved questions deliberately excluded from published facts.
- Localization, Story, media, generator, documentation, or design changes.
- Validation performed and generated views inspected.
- Known limitations and any translation still awaiting fluent-speaker review.

Use neutral wording for sensitive private changes. Do not place living-person
details, private correspondence, source transcriptions, local paths, or
confidential research hypotheses in commit messages or pull-request text.
