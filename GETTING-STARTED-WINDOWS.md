# Getting started with PlainRoots on Windows

This guide is for people who are comfortable using a web browser but have
little or no software-development experience. It uses Windows and free GitHub
options. The same PlainRoots repository also works on macOS and Linux, but the
installation commands are different.

You will:

1. Create a free GitHub account and enable Copilot Free.
2. Install GitHub Copilot CLI.
3. Ask Copilot to install the remaining free tools and download PlainRoots.
4. Confirm that Copilot sees the repository skills.
5. Render Diego García's ancestry chart.

> [!IMPORTANT]
> PlainRoots is public. Do not add private family information, photographs,
> recordings, addresses, credentials, or other sensitive material while
> learning how it works.

## Understand the two GitHub command-line tools

This guide uses two separate tools:

| Tool | Command | Purpose |
| --- | --- | --- |
| GitHub CLI | `gh` | Signs in to GitHub and downloads the repository. |
| GitHub Copilot CLI | `copilot` | Reads the repository and helps you work with it through conversational prompts. |

Typing a request such as "render the ancestry chart for Diego" in `gh` will
not work. Prompts go into the interactive `copilot` application.

## 1. Create a free GitHub account

Skip this section if you already have a personal GitHub account.

1. Open [github.com/signup](https://github.com/signup).
2. Follow the prompts to create a personal account.
3. Choose the **GitHub Free** plan. You do not need a paid organization or
   trial for this guide.
4. Verify your email address using the message GitHub sends you.
5. Configure two-factor authentication when prompted. GitHub strongly
   recommends it, and it protects your account if your password is stolen.

Do not enter payment information or start a paid trial for this guide.

## 2. Enable Copilot Free

GitHub Copilot CLI requires an active Copilot plan. **Copilot Free** includes
Copilot CLI with a limited allowance of AI requests.

1. While signed in to GitHub, open
   [Copilot settings](https://github.com/settings/copilot).
2. If the page already shows **Copilot Free**, continue to the next section.
3. If GitHub asks you to choose a plan, choose **Copilot Free**.
4. Do not select Copilot Pro, Pro+, Max, Business, or Enterprise, and do not
   start a paid trial.

The free allowance is enough to try this workflow, but it is limited. Reaching
the allowance does not require you to upgrade; you can wait until free usage
is available again. An agentic task such as rendering a chart may consume more
than one request from that allowance.

## 3. Open a command-line window and install Copilot CLI

Copilot cannot install itself, so this is the only installation you must do
manually.

1. Open the Windows **Start** menu.
2. Search for **Terminal** and open **Windows Terminal**.
3. Select a **PowerShell** tab.

If Windows Terminal is not installed, search for and open **Windows
PowerShell**. Install PowerShell 7 when the current PowerShell version is older
than 6:

```powershell
winget install --id Microsoft.PowerShell --exact
```

Then install Copilot CLI. Run this command whether you started in Windows
Terminal or Windows PowerShell:

```powershell
winget install --id GitHub.Copilot --exact
```

These free packages install PowerShell 7 and GitHub Copilot CLI. If Windows
asks whether an installer may make changes, confirm only after checking that
the publisher and application name match the intended tool.

Close every terminal window after installation. Open **PowerShell 7** from the
Start menu and verify Copilot:

```powershell
$PSVersionTable.PSVersion
copilot --version
```

PowerShell must be version 6 or later. Each command should print a version.

Commands in this guide appear in boxes. Type or paste one command at a time,
then press <kbd>Enter</kbd>. Do not include the prompt characters that
PowerShell displays before the command.

## 4. Start Copilot CLI and ask it to finish setup

Create an empty folder dedicated to PlainRoots, move into it, and start
Copilot:

```powershell
$plainRoots = Join-Path $HOME "PlainRoots"
New-Item -ItemType Directory -Path $plainRoots
Set-Location $plainRoots
copilot
```

If PowerShell says the `PlainRoots` folder already exists, stop and inspect it
rather than overwriting it.

Copilot asks whether you trust this folder:

- Choose **Yes, proceed** to trust it for this session only.
- Choose **Yes, and remember this folder for future sessions** only if this
  folder will remain dedicated to PlainRoots.
- Choose **No, exit** if the folder or its contents are not what you expected.

If Copilot says you are not signed in, enter:

```text
/login
```

Follow the browser instructions, then return to Copilot CLI.

Now paste this setup prompt into Copilot:

```text
Set up this Windows computer to use the public PlainRoots repository, using
free options only.

1. Check whether Git, GitHub CLI, Git LFS, Node.js 20 or later, and a
   machine-wide Microsoft Edge or Google Chrome installation are available.
2. Use winget to install only the missing free tools. Use the package IDs
   Git.Git, GitHub.cli, GitHub.GitLFS, and OpenJS.NodeJS.LTS. Do not install
   paid plans, trials, prerelease software, or unrelated applications.
   If neither supported browser is present, stop and explain what is missing
   instead of installing a browser without permission.
3. Configure Git LFS for my Windows account before cloning.
4. Check whether GitHub CLI is authenticated. If it is not, guide me through
   its browser login for GitHub.com using HTTPS, then confirm the signed-in
   account. Never ask me to paste an access token into this chat or a file.
5. Confirm that the current folder is empty, then clone
   PlainRoots/PlainRoots directly into this folder. Do not overwrite or delete
   anything if the folder is not empty.
6. Confirm that the clone is on the main branch, report the installed tool
   versions, and tell me whether any step remains incomplete.

Ask for my approval before installing software, opening a browser, or running
a command that changes this computer. If a newly installed command is not
available until the terminal restarts, tell me exactly how to restart Copilot
in this same folder and resume the setup.
```

Copilot will inspect the computer, propose the needed commands, and ask for
permission before running them. Review each request instead of using
`/allow-all`. Complete any GitHub browser sign-in that Copilot opens.

When setup finishes, `clone` has downloaded a working copy that Git can keep
synchronized with GitHub. You can explore and modify it locally, but you cannot
publish directly to the official repository unless its maintainers grant
permission. To propose changes later, use GitHub's free **Fork** button to
create a copy under your account.

## 5. Confirm that Copilot sees the repository skills

PlainRoots contains project skills under `.github/skills`. Copilot discovers
and loads a relevant skill when your prompt matches the skill's description.
Because Copilot started before the repository was cloned, reload the skills
first:

Inside Copilot CLI, enter:

```text
/skills reload
/skills list
```

Look for skills such as `generate-family-tree`,
`manage-family-relationships`, and `verify-genealogy-data`. To inspect the
generation skill, enter:

```text
/skills info generate-family-tree
```

If the skills are missing, confirm that the clone completed in the current
folder before continuing.

Next, ask Copilot to read the important repository files without changing
anything:

```text
Read README.md, CONTRIBUTING.md, tree.json, and the project skills under
.github/skills. Summarize how PlainRoots works and identify the skill used to
generate family-tree charts. Do not change any files.
```

Copilot may ask permission to read files. Approve only paths inside the
PlainRoots folder. You do not need `/allow-all` for this guide.

## 6. Render Diego's ancestry chart

Enter this sample prompt inside Copilot CLI:

```text
Render the ancestry chart for Diego García.
```

The repository skill instructs Copilot to generate every supported locale,
confirm each PNG, and provide clickable links. Copilot should use the
`generate-family-tree` skill and create:

```text
diego-garcia.ancestry.en-US.png
diego-garcia.ancestry.es-MX.png
```

Approve the specific read and command permissions needed to generate the
charts. Review each request rather than enabling all permissions. When the task
finishes, open the English and Mexican Spanish links Copilot provides.

Generated previews are local files. Creating them does not automatically
publish them or send them to GitHub.

## Ready to create your own family archive?

Before entering real family information, follow
[Start your private family archive](START-YOUR-FAMILY-ARCHIVE.md) to create and
verify an independent private copy. GitHub cannot make a public fork private.

## Troubleshooting

### `winget` is not recognized

Install or update Microsoft's free **App Installer** from the Microsoft Store,
then reopen PowerShell.

### A newly installed command is not recognized

Close every terminal window, open PowerShell 7 again, and retry the version
command. To resume the same Copilot session from the setup folder, run
`copilot --continue`. Restart Windows if the command still cannot be found.

### `copilot` is not found after installation

Close every terminal window and open PowerShell 7 again. Run
`copilot --version`. If the command is still unavailable, ask Windows to
restart, then retry it before continuing.

### GitHub CLI is signed in to the wrong account

Run `gh auth status`, then use `gh auth switch` if the correct account is
already registered. Otherwise run `gh auth logout` followed by
`gh auth login --web --git-protocol https`.

### Copilot asks you to sign in

Enter `/login` inside Copilot CLI. Confirm that the same personal account has
Copilot Free enabled.

### Repository skills do not appear

Confirm that the setup prompt finished cloning PlainRoots into the current
folder. Inside Copilot, run `/cwd`, then `/skills reload` and `/skills list`.

### Chart rendering cannot find a browser

PlainRoots uses Microsoft Edge or Google Chrome to capture PNG previews.
The renderer detects machine-wide Edge and Chrome installations under
`C:\Program Files` or `C:\Program Files (x86)`. Windows normally includes Edge,
which is the most reliable option. Update Edge and retry the prompt; a Chrome
installation available only to your Windows user may not be detected.

## Official documentation

- [Creating a GitHub account](https://docs.github.com/get-started/start-your-journey/creating-an-account-on-github)
- [GitHub plans](https://github.com/pricing)
- [Installing GitHub CLI](https://github.com/cli/cli#installation)
- [GitHub CLI quickstart](https://docs.github.com/github-cli/github-cli/quickstart)
- [Copilot plans](https://docs.github.com/copilot/get-started/plans-for-github-copilot)
- [Installing GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- [Using GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
- [Using skills with GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [Git LFS](https://git-lfs.com/)
