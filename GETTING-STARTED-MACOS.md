# Getting started with PlainRoots on macOS

This guide is for people who are comfortable using a web browser but have
little or no software-development experience. It uses free GitHub options.

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

## 3. Open Terminal and install Copilot CLI

Copilot cannot install itself, so this is the only installation you must do
manually.

1. Open **Finder**.
2. Open **Applications**, then **Utilities**.
3. Open **Terminal**.

Commands in this guide appear in boxes. Type or paste one command at a time,
then press <kbd>Return</kbd>. Do not include the prompt characters that
Terminal displays before the command.

Install Copilot CLI using GitHub's official macOS and Linux install script:

```shell
curl -fsSL https://gh.io/copilot-install | bash
```

Review the command before running it. It downloads and runs GitHub's installer.
Do not use a similar command from an untrusted website.

Close Terminal after installation and open it again. Verify Copilot:

```shell
copilot --version
```

If the command is not found, see the troubleshooting section before
continuing.

## 4. Start Copilot CLI and ask it to finish setup

Create an empty folder dedicated to PlainRoots, move into it, and start
Copilot:

```shell
mkdir ~/PlainRoots
cd ~/PlainRoots
copilot
```

If Terminal says the `PlainRoots` folder already exists, stop and inspect it
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
Set up this Mac to use the public PlainRoots repository, using free options
only.

1. Check the macOS version and processor architecture. Check whether Homebrew,
   Git, GitHub CLI, Git LFS, Node.js 20 or later, and Microsoft Edge or Google
   Chrome are available.
2. Use Homebrew to install only the missing free command-line tools: git, gh,
   git-lfs, and node. If Homebrew is missing, explain that its official
   installer comes from https://brew.sh, ask for permission before running it,
   follow the post-install shell configuration printed by Homebrew with my
   approval, and verify it afterward. If neither Edge nor Chrome is installed,
   explain that Safari is not supported and ask whether I want to install the
   free Microsoft Edge or Google Chrome Homebrew cask. Do not install paid
   plans, trials, prerelease software, unrelated applications, or a browser
   without my explicit approval.
3. Configure Git LFS for my macOS account before cloning.
4. Check whether GitHub CLI is authenticated. If it is not, guide me through
   its browser login for GitHub.com using HTTPS, then confirm the signed-in
   account. Never ask me to paste an access token into this chat or a file.
5. Confirm that the current folder is empty, then clone
   PlainRoots/PlainRoots directly into this folder. Do not overwrite or delete
   anything if the folder is not empty.
6. Confirm that the clone is on the main branch, report the installed tool
   versions, and tell me whether any step remains incomplete.

Ask for my approval before installing software, opening a browser, requesting
administrator access, or running a command that changes this Mac. If a newly
installed command is not available until Terminal restarts, tell me exactly
how to restart Copilot in this same folder and resume the setup.
```

Copilot will inspect the Mac, propose the needed commands, and ask for
permission before running them. Review each request instead of using
`/allow-all`. Complete any GitHub browser sign-in that Copilot opens. If macOS
asks for an administrator password while installing an approved tool, enter it
only into the macOS or Terminal password prompt; never put it in Copilot chat.

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

### `copilot` is not found after installation

Close Terminal and open it again. If the command is still unavailable, the
installer may have placed it in `$HOME/.local/bin`. Run:

```shell
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
copilot --version
```

This adds the user-local application folder to the command search path for
future Terminal sessions.

### A newly installed command is not recognized

Close Terminal, reopen it, enter `cd ~/PlainRoots`, and run
`copilot --continue` to resume the most recent session. Restart the Mac if the
command still cannot be found.

### Homebrew was installed but `brew` is not found

The Homebrew installer prints platform-specific commands under **Next steps**.
Ask Copilot to review those instructions and, with your approval, add the
recommended `brew shellenv` command to `~/.zprofile`. Close Terminal, reopen
it, and run `brew --version`.

### GitHub CLI is signed in to the wrong account

Ask Copilot to run `gh auth status`. If the correct account is already
registered, ask it to use `gh auth switch`. Otherwise ask it to run
`gh auth logout` followed by `gh auth login --web --git-protocol https`.

### Copilot asks you to sign in

Enter `/login` inside Copilot CLI. Confirm that the same personal account has
Copilot Free enabled.

### Repository skills do not appear

Confirm that the setup prompt finished cloning PlainRoots into the current
folder. Inside Copilot, run `/cwd`, then `/skills reload` and `/skills list`.

### Chart rendering cannot find a browser

PlainRoots uses Microsoft Edge or Google Chrome to capture PNG previews. Ask
Copilot to confirm that one is installed under the system-wide or user-specific
`Applications` folder. PlainRoots detects:

```text
/Applications/Microsoft Edge.app
/Applications/Google Chrome.app
~/Applications/Microsoft Edge.app
~/Applications/Google Chrome.app
```

Do not let Copilot install a browser without your approval.

## Official documentation

- [Creating a GitHub account](https://docs.github.com/get-started/start-your-journey/creating-an-account-on-github)
- [GitHub plans](https://github.com/pricing)
- [Homebrew](https://brew.sh/)
- [Installing GitHub CLI](https://github.com/cli/cli#installation)
- [GitHub CLI quickstart](https://docs.github.com/github-cli/github-cli/quickstart)
- [Copilot plans](https://docs.github.com/copilot/get-started/plans-for-github-copilot)
- [Installing GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- [Using GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
- [Using skills with GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [Git LFS](https://git-lfs.com/)
