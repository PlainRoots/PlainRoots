# Start your private family archive

Use this guide only after you have completed the
[Getting started guide](GETTING-STARTED.md), explored the fictional family, and
are ready to enter information about your own family.

## Create a private independent copy

GitHub does not support private forks of public repositories. A fork of
PlainRoots would remain public because every repository in a GitHub fork
network shares the same visibility.

The safe workaround is to create a new **private repository** and duplicate
PlainRoots into it. The result contains the same files and history, but GitHub
does not identify it as a fork and does not synchronize it automatically.
GitHub documents this approach as
[duplicating a repository](https://docs.github.com/repositories/creating-and-managing-repositories/duplicating-a-repository).

Private repositories are available with GitHub Free. You do not need a paid
plan or trial.

> [!CAUTION]
> Do not enter real family information until GitHub and Copilot have both
> confirmed that the new repository is private and your local working copy
> points to it. Never add private data to the public PlainRoots checkout.

## Create a dedicated private workspace

Keep this operation separate from the public PlainRoots working copy. Exit the
current Copilot session with `/exit`, then create a dedicated parent folder.

On Windows PowerShell:

```powershell
$familyArchives = Join-Path $HOME "FamilyArchives"
New-Item -ItemType Directory -Path $familyArchives
Set-Location $familyArchives
copilot
```

On macOS Terminal:

```shell
mkdir ~/FamilyArchives
cd ~/FamilyArchives
copilot
```

If the `FamilyArchives` folder already exists, stop and inspect it instead of
overwriting it. When Copilot asks whether you trust the folder, choose **Yes,
proceed** for this session. Copilot can then create the temporary mirror and
private working copy inside this dedicated folder without gaining access to
all files in your home directory.

## Ask Copilot to create the private copy

Use a neutral repository name that does not disclose a family name or other
private information. The example below uses `my-family-archive`.

Paste this prompt into Copilot:

```text
Help me create an independent private GitHub copy of this public PlainRoots
repository for my own family data.

1. Confirm through GitHub CLI that https://github.com/PlainRoots/PlainRoots is
   a PUBLIC repository. Do not modify or push to it.
2. Confirm which personal GitHub account GitHub CLI is using. Ask me for a
   neutral name for the new repository; suggest "my-family-archive". Do not
   include family names or personal details in the repository name or
   description.
3. Confirm that a repository with that name does not already exist. Create a
   new, empty repository under my personal account with PRIVATE visibility.
   Do not initialize it with a README, license, or .gitignore.
4. Follow GitHub's documented repository-duplication procedure in a new,
   uniquely named temporary directory inside this FamilyArchives workspace:
   - make a bare clone of https://github.com/PlainRoots/PlainRoots.git;
   - fetch every Git LFS object with "git lfs fetch --all";
   - mirror-push Git refs only to the newly created private repository;
   - push every Git LFS object to that private repository.
5. Immediately before each push, verify that the destination is the empty
   private repository created in step 3. Show me its complete owner, name, URL,
   visibility, and whether it contains any commits, then ask for approval.
   Mirror-push only to that new empty repository. Never push to
   PlainRoots/PlainRoots or to any repository that already contains commits.
6. Verify through the GitHub API that the new repository visibility is
   PRIVATE. Open its GitHub page so I can confirm the Private label. Stop if
   either check does not show that it is private.
7. Clone the new private repository into a new local folder named after the
   repository inside this FamilyArchives workspace. Set that clone's origin to
   the private repository. Add
   https://github.com/PlainRoots/PlainRoots.git as a remote named upstream,
   then run "git remote set-url --push upstream DISABLED" so upstream cannot be
   used for pushing.
8. In the private working copy, confirm the main branch, show every remote and
   its fetch and push URL, and run the repository checks. Clearly identify the
   folder in which I may safely begin replacing fictional sample data.
9. Remove only the uniquely named temporary bare clone after all verification
   succeeds and after asking for my approval. Do not access, delete, or modify
   any public PlainRoots working copy outside this FamilyArchives workspace.

Use only free GitHub features. Do not add collaborators, enable GitHub Pages,
publish a release, create a public fork, change repository visibility, or put
credentials or family information in commands, logs, descriptions, or files.
Ask for approval before every command that creates a repository, pushes,
changes a remote, or deletes the temporary clone.
```

Copilot should pause for your repository name and for every consequential
operation. Read each proposed command and destination before approving it. Do
not use `/allow-all` for this workflow.

## Verify privacy before adding data

The setup is not complete until all of these statements are true:

- GitHub displays a **Private** label on the new repository.
- `gh repo view OWNER/REPOSITORY --json visibility` reports `"PRIVATE"`.
- The new local folder is inside `FamilyArchives` and separate from any public
  `PlainRoots` folder.
- `origin` in the new folder points to your private repository.
- `upstream` fetches from `https://github.com/PlainRoots/PlainRoots.git` but
  displays `DISABLED` as its push URL.
- The public PlainRoots working copy remains unchanged.
- No collaborators have access unless you intentionally invited them.

Ask Copilot to repeat these checks whenever you are uncertain:

```text
Before I add family data, verify that this is the private working copy. Show
the current folder, GitHub repository visibility, branch, working-tree status,
and every remote fetch and push URL. Do not change anything.
```

If any check is unexpected, stop. Do not add or commit private information
until the destination is corrected.

## Configure your family's languages first

Before adding family records, decide which languages and regional conventions
your relatives will use to read and contribute to the archive. For example,
choose `es-MX` for Mexican Spanish rather than the broader `es` tag when
Mexican spelling, terminology, and date formatting are intended.

PlainRoots always keeps `en-US` as its canonical source locale. List every
additional active locale in `supported-locales.json`. Each active locale needs
a matching resource under `locales/` and complete translations for current
translatable content. Locale IDs use canonical
[BCP 47](https://www.rfc-editor.org/info/bcp47) casing.

Ask Copilot:

```text
Before I add any family data, help me configure the languages spoken and read
by members of my family.

1. Read supported-locales.json, locales/en-US.json, the localization
   documentation, and the localize-family-tree skill.
2. Ask me which languages and regional variants my family needs. Do not assume
   a locale from a country name or from my computer settings.
3. Keep en-US as the canonical source locale. For each additional language I
   confirm, propose its canonical BCP 47 locale ID and explain the regional
   choice before changing files.
4. Update supported-locales.json and create or update the matching locale
   resources. Translate every required interface value accurately and preserve
   placeholders and data structure. Do not activate or delete a locale without
   my approval.
5. Complete any translations required by the existing fictional reference
   content so locale validation succeeds. Do not add, remove, or replace family
   records as part of this language-configuration task.
6. Run the locale tests, translation checks, and generation checks for every
   configured locale. Summarize the files changed and any wording that still
   needs review by a fluent speaker.

Show me a plan and ask for approval before changing files. Do not add real
family names, relationships, stories, photographs, recordings, or other family
information yet.
```

Have a fluent speaker review each locale before relying on it. Machine
translation can provide a draft, but names, kinship terms, places, and
genealogy terminology need human review.

## Add your family data

After locale configuration is complete, follow
[Add data to your family archive](ADD-FAMILY-DATA.md). It provides prompts for
documents and images, stories and recordings, natural-language family facts,
location and conflict validation, photos, and correspondence with relatives or
record custodians.

## Protect your private family archive

Private repository access reduces accidental public exposure, but it does not
replace careful handling:

- Enable two-factor authentication on your GitHub account.
- Invite only trusted collaborators.
- Do not store passwords, access tokens, financial information, addresses, or
  other unnecessary sensitive data.
- Obtain permission before adding information or media about living people.
- Keep an independent encrypted backup of irreplaceable source material.
- Review generated files and Git history before sharing or changing
  visibility.
- GitHub Free usage and Git LFS quotas apply. Check GitHub's current billing
  documentation before adding a large media collection; you do not need to
  upgrade merely to begin with text records.

## Receive future PlainRoots improvements

Because the private repository is an independent duplicate, GitHub's **Sync
fork** button does not apply. The fetch-only `upstream` remote lets Copilot
inspect new public PlainRoots commits without exposing private changes.

From the private working copy, ask:

```text
Fetch the public PlainRoots upstream and identify reusable improvements that
are newer than my last integration. Do not push, merge, or copy any private
family data. Show me a plan and ask for approval before changing files.
```

Public improvements may conflict with private family changes. Always review
the proposed diff and rerun all repository checks before committing.

## If the repository was accidentally public

Stop adding data immediately. Changing visibility does not guarantee that
information was never copied, cached, emailed, indexed, or retained in Git
history.

1. Change the repository to private in GitHub settings.
2. Revoke exposed credentials immediately; deleting them from a commit is not
   enough.
3. Review repository access, forks, clones, Actions logs, releases, and Git
   history.
4. Ask affected family members before taking further action.
5. Follow GitHub's
   [guidance for removing sensitive data](https://docs.github.com/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Official documentation

- [Visibility of forks](https://docs.github.com/pull-requests/collaborating-with-pull-requests/working-with-forks/about-permissions-and-visibility-of-forks)
- [Duplicating a repository](https://docs.github.com/repositories/creating-and-managing-repositories/duplicating-a-repository)
- [Creating a new repository](https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [Managing repository settings](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings)
- [Removing sensitive data](https://docs.github.com/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
