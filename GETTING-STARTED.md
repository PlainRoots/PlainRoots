# Getting started with PlainRoots

PlainRoots can use GitHub Copilot CLI to guide most of its own setup. Choose
the guide for your computer:

- [Windows setup](GETTING-STARTED-WINDOWS.md)
- [macOS setup](GETTING-STARTED-MACOS.md)

Both guides are written for people with little or no software-development
experience. They use free GitHub options and finish with the same example:

```text
Render the ancestry chart for Diego García.
```

> [!IMPORTANT]
> PlainRoots is public. Do not add private family information, photographs,
> recordings, addresses, credentials, or other sensitive material while
> learning how it works.

## Generate and render family-tree views

Complete the Windows or macOS setup first. Run all commands from the
`PlainRoots` repository folder.

PlainRoots has two local ways to generate views:

1. Ask GitHub Copilot CLI in natural language. This is recommended for people
   who are new to command-line tools.
2. Run the repository's `npm` commands directly.

### Ask Copilot CLI

Start Copilot from the repository folder:

```text
copilot
```

Example prompts:

```text
Generate the complete family tree.
Render the complete family tree.
Render the ancestry chart for Diego García.
Generate the printable report for Diego García.
Show Diego García's ancestry as a text report.
Check all source data, translations, stories, and generated outputs.
```

The `generate-family-tree` skill tells Copilot to process canonical English and
every additional locale listed in `supported-locales.json`. It also tells
Copilot to confirm generated files and provide clickable links to PNG charts
and printable HTML reports.

Copilot asks permission before reading, writing, or executing tools. Review
each request and approve only the repository paths and commands needed for the
task. You do not need `/allow-all`.

### Run commands directly

Open PowerShell or Terminal in the repository folder. These commands operate
on every configured locale unless their name includes a specific locale:

| Goal | Command |
| --- | --- |
| Choose a view interactively | `npm start` |
| Generate the full HTML tree and person cards | `npm run generate` |
| Render full-tree PNG previews | `npm run render` |
| Generate full printable HTML reports | `npm run report` |
| Validate source data, translations, LFS rules, and generated HTML | `npm run check` |
| Run automated tests | `npm test` |
| Validate research notes | `npm run check:notes` |
| Validate printable reports without rewriting them | `npm run check:report` |

The current sample includes stable person IDs such as
`sofia-garcia-smith`, `daniel-garcia-smith`, and `diego-garcia`. Pass a person
ID after `--` for person-focused commands:

| Goal | Example |
| --- | --- |
| Generate one person's HTML view and card | `npm run generate:person -- diego-garcia` |
| Render an ancestry PNG | `npm run render:ancestry -- diego-garcia` |
| Render strict direct ancestry | `npm run render:ancestry-strict -- diego-garcia` |
| Render maternal ancestry | `npm run render:ancestry-maternal -- diego-garcia` |
| Render paternal ancestry | `npm run render:ancestry-paternal -- diego-garcia` |
| Render descendants | `npm run render:descendants -- diego-garcia` |
| Render blood relatives | `npm run render:blood-relatives -- diego-garcia` |
| Generate a person's printable report | `npm run report:person -- diego-garcia` |
| Show ancestry as a terminal text report | `npm run view:ascii -- --view ancestry --person diego-garcia` |

Replace `render` with `generate` or `check` in a person-focused script name
when you need HTML generation or validation instead of a PNG. For example:

```text
npm run generate:ancestry -- diego-garcia
npm run check:ancestry -- diego-garcia
```

Add `--highlight-missing` after the person ID to create a separate
research-gap view:

```text
npm run render:ancestry -- diego-garcia --highlight-missing
```

### Generated files

Common outputs include:

```text
index.html
index.es-MX.html
people/diego-garcia/card.html
people/diego-garcia/card.es-MX.html
diego-garcia.ancestry.en-US.png
diego-garcia.ancestry.es-MX.png
diego-garcia.print-report.person.en-US.html
diego-garcia.print-report.person.es-MX.html
```

Open generated HTML files in a web browser. PNG previews and printable reports
are ignored by Git and remain local unless you deliberately share them.
Generated source-tree HTML and person cards are tracked; do not edit generated
files manually.

To generate only one locale, use a locale-specific command such as
`npm run generate:es-MX`, `npm run render:es-MX`, or
`npm run report:es-MX`. The standard commands remain preferred because they
keep every configured locale synchronized.

## Ready to create your own family archive?

Once you understand the fictional example and are ready to add your own family
data, do not put it in the public PlainRoots checkout. Follow
[Start your private family archive](START-YOUR-FAMILY-ARCHIVE.md) to create and
verify an independent private copy first. After its privacy and locales are
configured, continue with
[Add data to your family archive](ADD-FAMILY-DATA.md).
