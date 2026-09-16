export function renderImportReport(staging) {
  const {
    manifest,
    proposedTree,
    people,
    guardianshipCandidates,
    pedigreeCandidates,
    issues,
    unresolved
  } = staging;
  const lines = [
    "# GEDCOM import review",
    "",
    "> This staging package contains sensitive family information. It has not",
    "> modified the PlainRoots archive and must be reviewed before any facts are",
    "> applied.",
    "",
    "## Source profile",
    "",
    `- Source file: \`${escapeCode(manifest.sourceFile)}\``,
    ...(manifest.sourceFileName
      ? [`- GEDCOM header file name: \`${escapeCode(manifest.sourceFileName)}\``]
      : []),
    ...(manifest.sourceSystem
      ? [`- Producing system: ${escapeMarkdown(manifest.sourceSystem)}`]
      : []),
    ...(manifest.sourceLanguage
      ? [`- Declared language: ${escapeMarkdown(manifest.sourceLanguage)}`]
      : []),
    `- GEDCOM version: ${manifest.gedcomVersion}`,
    `- Declared encoding: ${manifest.declaredEncoding}`,
    `- Detected encoding: ${manifest.detectedEncoding}`,
    `- Physical lines: ${manifest.physicalLineCount}`,
    `- Individual records: ${manifest.counts.individuals}`,
    `- Family records: ${manifest.counts.families}`,
    "",
    "## Proposed PlainRoots content",
    "",
    `- Proposed people: ${people.length}`,
    `- Proposed families: ${proposedTree.families.length}`,
    `- Proposed sibling groups: ${proposedTree.siblingGroups?.length ?? 0}`,
    `- Guardianship candidates requiring review: ${guardianshipCandidates.length}`,
    `- Other pedigree candidates requiring review: ${pedigreeCandidates.length}`,
    "",
    "The files under `people/` are proposals, not approved PlainRoots records.",
    "Generated IDs, names, relationships, dates, places, occupations, and life",
    "status must be compared with source evidence before application.",
    "",
    "## Proposed people",
    ""
  ];

  if (people.length === 0) {
    lines.push("No individual records were found.", "");
  } else {
    lines.push(
      "| GEDCOM pointer | Proposed ID | Name | Review issues |",
      "| --- | --- | --- | --- |"
    );
    for (const person of people) {
      lines.push(
        `| \`${escapeCode(person.sourcePointer ?? "(none)")}\` | \`${person.proposedPerson.id}\` | ${escapeTable(person.proposedPerson.name)} | ${escapeTable(person.issues.join("; ") || "None detected")} |`
      );
    }
    lines.push("");
  }

  lines.push("## Other pedigree candidates", "");
  if (pedigreeCandidates.length === 0) {
    lines.push("No non-birth, non-foster pedigree links were found.", "");
  } else {
    for (const candidate of pedigreeCandidates) {
      lines.push(
        `- ${escapeMarkdown(candidate.pedigree)} candidate: child \`${candidate.child}\`, parents ${list(candidate.parents)}, source family \`${escapeCode(candidate.sourceFamilyPointer)}\`.`
      );
    }
    lines.push("");
  }

  lines.push("## Relationship proposals", "");
  if (
    proposedTree.families.length === 0 &&
    (proposedTree.siblingGroups?.length ?? 0) === 0
  ) {
    lines.push("No directly applyable family or sibling-group proposals were produced.", "");
  } else {
    for (const family of proposedTree.families) {
      lines.push(
        `- Family \`${family.id}\`: partners ${list(family.partners)}; children ${list(family.children)}; relationship ${family.relationship ? `\`${family.relationship}\`` : "(not proposed)"}.`
      );
    }
    for (const group of proposedTree.siblingGroups ?? []) {
      lines.push(
        `- Sibling group \`${group.id}\`: children ${list(group.children)}; parents unknown.`
      );
    }
    lines.push("");
  }

  lines.push("## Guardianship candidates", "");
  if (guardianshipCandidates.length === 0) {
    lines.push("No `PEDI foster` links were found.", "");
  } else {
    for (const candidate of guardianshipCandidates) {
      lines.push(
        `- Candidate \`${candidate.id}\`: child \`${candidate.child}\`, guardians ${list(candidate.guardians)}. Starting age and evidence are unresolved.`
      );
    }
    lines.push("");
  }

  lines.push("## Diagnostics and conversion loss", "");
  if (issues.length === 0) {
    lines.push("No parser or conversion diagnostics were reported.", "");
  } else {
    for (const issue of issues) {
      const location = [
        issue.record ? `record ${issue.record}` : null,
        issue.line ? `line ${issue.line}` : null
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(
        `- **${issue.severity.toUpperCase()} ${issue.code}:** ${escapeMarkdown(issue.message)}${location ? ` (${escapeMarkdown(location)})` : ""}`
      );
    }
    lines.push("");
  }

  lines.push("## Unresolved GEDCOM records", "");
  if (unresolved.length === 0) {
    lines.push("No unsupported records were inventoried.", "");
  } else {
    const counts = new Map();
    for (const item of unresolved) {
      counts.set(item.reason, (counts.get(item.reason) ?? 0) + 1);
    }
    for (const [reason, count] of counts) {
      lines.push(`- ${reason}: ${count}`);
    }
    lines.push(
      "",
      "See `unresolved-records.json` for the original record hierarchy and line",
      "numbers. These records were preserved for review and were not silently",
      "converted."
    );
  }

  lines.push(
    "",
    "## Review gate",
    "",
    "No files in `tree.json`, `people/`, `locales/`, or the research-note",
    "sources were changed. Applying any proposal requires a separate evidence",
    "review and explicit approval.",
    ""
  );
  return lines.join("\n");
}

function list(values) {
  return values.length > 0
    ? values.map((value) => `\`${value}\``).join(", ")
    : "(none)";
}

function escapeTable(value) {
  return escapeMarkdown(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeMarkdown(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function escapeCode(value) {
  return escapeMarkdown(value).replaceAll("`", "&#96;");
}
