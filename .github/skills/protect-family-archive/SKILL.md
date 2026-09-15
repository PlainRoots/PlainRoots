---
name: protect-family-archive
description: Verify repository privacy, remotes, and safe source handling before adding real family data or sensitive family media.
---

# Protect a family archive

Run this skill before handling real family records, living-person information,
private documents, photographs, recordings, or correspondence. PlainRoots
itself is a public fictional reference repository; real family data belongs
only in a verified private independent copy.

This is a read-only safety check. Do not change repository visibility, remotes,
files, branches, or Git history while performing it.

## Determine the work mode

First determine which mode applies:

- **Public sample mode:** The repository contains only PlainRoots fictional
  sample data. Public visibility is expected. Do not add real family
  information or sensitive media.
- **Private archive mode:** The user intends to handle real family data. All
  checks below must pass before reading sensitive attachments or changing
  files.

If the user's intent is unclear, ask whether the task uses only fictional
sample data or real family information. Never infer that a repository is safe
because its folder name contains `private`, `family`, or `archive`.

## Private archive verification

Perform these checks without exposing credentials or family information:

1. Resolve and report the current folder and Git repository root.
2. Report the current branch and concise working-tree status.
3. List every Git remote with its complete fetch and push URLs.
4. Resolve the repository targeted by `origin` and query GitHub through
   GitHub CLI for its owner, name, URL, and visibility.
5. Require `origin` to target that same repository and require GitHub to report
   `PRIVATE`.
6. If `upstream` points to the public
   `https://github.com/PlainRoots/PlainRoots.git`, require its push URL to be
   exactly `DISABLED`. A public upstream may be used only for fetching.
7. Identify any additional remote that could receive a push. Do not assume an
   unfamiliar remote is safe; ask the user to confirm its purpose and
   visibility.
8. Confirm that the working copy is separate from any public PlainRoots
   checkout and is inside the private workspace the user expects.

Prefer read-only commands such as:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short
git remote -v
git remote get-url origin
git remote get-url --push origin
git remote get-url upstream
git remote get-url --push upstream
gh repo view OWNER/REPOSITORY --json nameWithOwner,url,visibility
```

Derive `OWNER/REPOSITORY` from the resolved `origin`; never guess it. Do not
print authentication tokens, credential-store contents, environment secrets,
or URL-embedded credentials.

## Pass and stop conditions

Private archive mode passes only when:

- The current folder and Git root are expected.
- GitHub reports the `origin` repository as private.
- `origin` fetch and push URLs target that private repository.
- A public PlainRoots `upstream` cannot receive pushes.
- No unexplained remote can receive private data.

If any check fails or cannot be completed:

1. Stop before reading sensitive attachments or modifying files.
2. State which safety condition is unverified without repeating sensitive
   content.
3. Do not change visibility, rewrite history, delete files, change remotes, or
   push as an automatic repair.
4. Direct the user to `START-YOUR-FAMILY-ARCHIVE.md` for private-copy setup or
   accidental-publication guidance.
5. Require a new complete verification after the user approves and completes
   any remediation.

Do not treat a successful local Git check as proof of GitHub visibility.
Likewise, a **Private** label in a browser does not prove that the current
working copy pushes to that repository; both remote and GitHub checks are
required.

## Sensitive source handling

After private archive verification succeeds:

- Read only files and folders the user explicitly supplied or approved.
- Keep source documents and recordings outside Git by default.
- Remind the user that maintaining an independent encrypted backup of
  irreplaceable originals is a best practice. Do not create, copy, configure,
  inspect, or manage backups on the user's behalf.
- Create temporary working copies only when needed for conversion, OCR,
  transcription, or cropping. Preserve the original unchanged.
- Add a source file to Git only after reviewing its complete contents,
  confirming that every repository collaborator may access it, checking Git
  LFS requirements, and receiving explicit approval.
- Warn that deleting a committed file does not remove it from Git history.
- Minimize information about living people and confirm permission before
  adding their records or media.
- Never store passwords, tokens, financial data, private addresses, phone
  numbers, identity-document numbers, or unrelated sensitive information.
- Keep commands, filenames, logs, commit messages, branch names, repository
  names, and descriptions free of unnecessary family details.
- Do not upload attachments, source text, or extracted facts to unrelated
  services.

When provenance requires identifying a source, retain only the metadata needed
to understand and locate it safely. Do not copy an entire sensitive document
into `researchNotes`.

## Approval gates

Always obtain explicit approval before:

- Copying a source or media file into the repository.
- Creating or changing a remote.
- Creating a GitHub repository.
- Changing repository visibility or collaborator access.
- Committing or pushing real family information.
- Deleting a temporary source conversion or any preserved original.

Immediately before a push containing real family data, repeat the Git root,
branch, status, destination URL, and GitHub visibility checks. Show the user
the destination owner and repository and wait for approval.

## Handoff

After the check passes, state that private archive mode is verified for the
current working copy and hand the task to the relevant repository skill:

- `ingest-genealogy-source` for documents and recovered records.
- `add-family-member` for person facts and portraits.
- `manage-family-relationships` for family links and guardianships.
- `add-family-story` for approved text or audio stories.
- `verify-genealogy-data` for evidence, conflicts, and location validation.
- `plan-genealogy-research` for read-only audits, source inventories, and
  prioritized next steps.
- `prepare-family-tree-pr` before commit, push, or pull request.

Passing this check does not approve the contents of a source or authorize a
later commit or push. Repeat it whenever the repository, remotes, working
folder, or task sensitivity changes.
