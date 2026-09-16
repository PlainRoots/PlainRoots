import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escapeAttribute, escapeHtml } from "../templates/person-card-html.mjs";
import { calculateLevels } from "./tree-layout.mjs";
import {
  formatTextTitle,
  renderTextGuardianships,
  renderTextTree
} from "./text-tree.mjs";
import { parseViewArguments, selectViewTree } from "./views.mjs";
import {
  loadLocalizedPeople,
  loadLocalizedProjectResearchNotes,
  localizeResearchNoteStatus
} from "./narrative-translations.mjs";
import { resolvePersonPhoto } from "./person-photo.mjs";
import { resolvePersonStories } from "./person-stories.mjs";
import { renderPrintStories } from "../templates/print-stories-html.mjs";
import { alternateNameTypeLabel } from "./alternate-names.mjs";
import {
  CANONICAL_LOCALE_ID,
  loadLocale,
  localeSuffix
} from "./locales.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const localeId = argumentValue(args, "--locale") ?? CANONICAL_LOCALE_ID;
const { view, personId, highlightMissing } = parseViewArguments(args);
const locale = await loadLocale(projectRoot, localeId);
const completeTree = await readJson(path.join(projectRoot, "tree.json"));
const projectResearchNotes = await loadLocalizedProjectResearchNotes(
  projectRoot,
  localeId
);
const people = await loadLocalizedPeople(projectRoot, localeId);
for (const person of people.values()) {
  const personDirectory = path.join(projectRoot, "people", person.id);
  const resolvedPhotoPath = await resolvePersonPhoto(
    person,
    personDirectory,
    projectRoot
  );
  if (resolvedPhotoPath) {
    person.photo = path.basename(resolvedPhotoPath);
  }
  person.stories = await resolvePersonStories(
    person,
    personDirectory,
    projectRoot,
    locale.languageTag
  );
}
const tree = selectViewTree(view, completeTree, personId);
const localizedSuffix = localeSuffix(localeId);
const modeSuffix = highlightMissing ? ".highlight-missing" : "";
const viewSuffix = view.id === "full" ? "" : `.${view.id}`;
const outputStem = view.requiresPerson
  ? `${personId}.print-report.${view.id}`
  : `print-report${viewSuffix}`;
const outputLocaleSuffix = view.requiresPerson
  ? `.${localeId}`
  : localizedSuffix;
const outputPath = path.join(
  projectRoot,
  `${outputStem}${modeSuffix}${outputLocaleSuffix}.html`
);

await emit(
  outputPath,
  renderPrintReport(
    tree,
    completeTree,
    people,
    locale,
    view,
    projectResearchNotes,
    { highlightMissing }
  )
);

console.log(
  `${checkOnly ? "Checked" : "Generated"} ${localeId} printable ${view.id} report${personId ? ` for ${personId}` : ""} with ${tree.people.length} people: ${outputPath}`
);

function renderPrintReport(
  treeData,
  relationshipTree,
  peopleById,
  localeData,
  viewData,
  projectNotes,
  options
) {
  const strings = localeData.strings;
  const title = formatTextTitle(
    viewData,
    treeData,
    peopleById,
    localeData
  );
  const generatedDate = new Intl.DateTimeFormat(localeData.languageTag, {
    dateStyle: "long"
  }).format(new Date());
  const outlineLines = [
    strings.asciiMinimalLegend,
    "",
    ...renderTextTree(treeData, peopleById, localeData, { minimal: true })
  ];
  const guardianshipLines = renderTextGuardianships(
    treeData,
    peopleById,
    localeData,
    { minimal: true }
  );
  if (guardianshipLines.length > 0) {
    outlineLines.push("", ...guardianshipLines);
  }

  return `<!doctype html>
<html lang="${escapeAttribute(localeData.languageTag)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(strings.printReport)}</title>
  <style>
${printStyles()}
  </style>
</head>
<body${options.highlightMissing ? ' class="highlight-missing"' : ""}>
  <header class="report-header">
    <p class="eyebrow">${escapeHtml(strings.familyArchive)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(strings[viewData.descriptionKey])}</p>
    <p class="metadata">${escapeHtml(strings.printReport)} · ${treeData.people.length} ${escapeHtml(strings.printPeople)} · ${escapeHtml(strings.printGenerated)} ${escapeHtml(generatedDate)}</p>
  </header>
  <main>
    ${viewData.id === "person" ? "" : `<section class="outline">
      <h2>${escapeHtml(strings.printOutline)}</h2>
      <pre>${escapeHtml(outlineLines.join("\n"))}</pre>
    </section>`}
    <section class="people-details">
      <h2>${escapeHtml(strings.printPeopleDetails)}</h2>
${renderPeopleByGeneration(
  treeData,
  relationshipTree,
  peopleById,
  localeData,
  options
)}
    </section>
    ${viewData.id === "person" ? "" : renderProjectResearchNotes(projectNotes, localeData)}
  </main>
</body>
</html>
`;
}

function renderPeopleByGeneration(
  treeData,
  relationshipTree,
  peopleById,
  localeData,
  options
) {
  const levels = calculateLevels(treeData);
  const generationNumbers = [
    ...new Set(treeData.people.map((personId) => levels.get(personId) ?? 0))
  ].sort((left, right) => left - right);

  return generationNumbers
    .map((level) => {
      const peopleAtLevel = treeData.people.filter(
        (personId) => (levels.get(personId) ?? 0) === level
      );
      return `      <section class="generation">
        <h3>${escapeHtml(localeData.strings.generation)} ${level + 1}</h3>
${peopleAtLevel
  .map((personId) =>
    renderPersonRecord(
      personId,
      treeData,
      relationshipTree,
      peopleById,
      localeData,
      options
    )
  )
  .join("\n")}
      </section>`;
    })
    .join("\n");
}

function renderPersonRecord(
  personId,
  treeData,
  relationshipTree,
  peopleById,
  localeData,
  options
) {
  const person = peopleById.get(personId);
  const strings = localeData.strings;
  const relationships = collectRelationships(personId, relationshipTree);
  const classes = ["person-record"];
  if (personId === treeData.focusPersonId) {
    classes.push("focus-person");
  } else if (treeData.directAncestorIds?.includes(personId)) {
    classes.push("direct-ancestor");
  }

  const facts = [
    renderFact(
      strings.printPersonId,
      person.id,
      false,
      localeData,
      options
    ),
    renderFact(
      strings.printGivenNames,
      person.givenNames,
      false,
      localeData,
      options
    ),
    renderFact(
      strings.printSurnames,
      person.surnames,
      false,
      localeData,
      options
    ),
    person.maidenName
      ? renderFact(
          strings.printMaidenName,
          person.maidenName,
          false,
          localeData,
          options
        )
      : "",
    renderFact(
      strings.occupation,
      localizeValue(
        localeData.occupations,
        person.occupation,
        strings.unknown
      ),
      person.occupation === "Unknown",
      localeData,
      options
    ),
    renderFact(
      strings.born,
      formatBirthDate(person, localeData),
      person.birthDate === "Unknown",
      localeData,
      options
    ),
    renderFact(
      strings.birthplace,
      localizeValue(
        localeData.birthPlaces,
        person.birthPlace,
        strings.unknown
      ),
      person.birthPlace === "Unknown",
      localeData,
      options
    ),
    renderFact(
      strings.status,
      lifeStatus(person, localeData),
      person.lifeStatus === "unknown",
      localeData,
      options
    ),
    person.deathDate || person.lifeStatus === "deceased"
      ? renderFact(
          strings.died,
          person.deathDate
            ? formatDate(person.deathDate, localeData)
            : strings.unknown,
          !person.deathDate,
          localeData,
          options
        )
      : "",
    person.deathDate || person.deathPlace || person.lifeStatus === "deceased"
      ? renderFact(
          strings.deathplace,
          localizeValue(
            localeData.deathPlaces,
            person.deathPlace ?? "Unknown",
            strings.unknown
          ),
          !person.deathPlace || person.deathPlace === "Unknown",
          localeData,
          options
        )
      : "",
    person.familyStatus
      ? renderFact(
          strings.family,
          formatFamilyStatus(person.familyStatus, localeData),
          person.familyStatus.relationship === "unknown" ||
            person.familyStatus.children === "unknown",
          localeData,
          options
        )
      : "",
    ...(person.alternateNames ?? []).map((alternateName) =>
      renderFact(
        alternateNameTypeLabel(localeData, alternateName.type),
        alternateName.transliteration
          ? `${alternateName.name} (${alternateName.transliteration}; ${alternateName.language})`
          : `${alternateName.name} (${alternateName.language})`,
        false,
        localeData,
        options
      )
    )
  ]
    .filter(Boolean)
    .join("\n");

  return `        <article class="${classes.join(" ")}">
          <div class="person-record-header">
${renderPrintPortrait(person)}
            <div class="person-record-summary">
              <h4>${escapeHtml(person.name)}</h4>
              <dl class="facts">
${facts}
              </dl>
            </div>
          </div>
${renderRelationships(relationships, peopleById, localeData)}
${renderNarrative(strings.printRemarks, person.remarks)}
${renderNarrative(strings.printResearchNotes, person.researchNotes)}
${renderPrintStories(person, localeData, formatDate)}
        </article>`;
}

function renderPrintPortrait(person) {
  const content = person.photo
    ? `<img src="${escapeAttribute(`people/${person.id}/${person.photo}`)}" alt="${escapeAttribute(person.name)}" />`
    : `<span aria-hidden="true">${escapeHtml(person.initials)}</span>`;
  const photoClass = person.photo ? " has-photo" : "";
  return `            <div class="print-portrait${photoClass}">
              ${content}
            </div>`;
}

function renderFact(
  label,
  value,
  missing,
  localeData,
  options
) {
  const className =
    options.highlightMissing && missing ? ' class="missing-information"' : "";
  return `            <div${className}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? localeData.strings.unknown)}</dd></div>`;
}

function collectRelationships(personId, treeData) {
  const parents = new Set();
  const partners = new Set();
  const children = new Set();
  const siblings = new Set();
  const guardians = [];
  const raisedChildren = new Set();

  for (const family of treeData.families) {
    if (family.children.includes(personId)) {
      family.partners.forEach((id) => parents.add(id));
      family.children
        .filter((id) => id !== personId)
        .forEach((id) => siblings.add(id));
    }
    if (family.partners.includes(personId)) {
      family.partners
        .filter((id) => id !== personId)
        .forEach((id) => partners.add(id));
      family.children.forEach((id) => children.add(id));
    }
  }

  for (const group of treeData.siblingGroups ?? []) {
    if (
      group.partners.length === 0 &&
      group.appearance !== "unconnected" &&
      group.children.includes(personId)
    ) {
      group.children
        .filter((id) => id !== personId)
        .forEach((id) => siblings.add(id));
    }
  }

  for (const guardianship of treeData.guardianships ?? []) {
    if (guardianship.child === personId) {
      guardians.push(guardianship);
    }
    if (guardianship.guardians.includes(personId)) {
      raisedChildren.add(guardianship.child);
    }
  }

  return {
    parents: [...parents],
    partners: [...partners],
    children: [...children],
    siblings: [...siblings],
    guardians,
    raisedChildren: [...raisedChildren]
  };
}

function renderRelationships(relationships, peopleById, localeData) {
  const strings = localeData.strings;
  const rows = [
    relationshipRow(strings.printParents, relationships.parents, peopleById),
    relationshipRow(
      strings.printPartners,
      relationships.partners,
      peopleById
    ),
    relationshipRow(strings.printChildren, relationships.children, peopleById),
    relationshipRow(strings.printSiblings, relationships.siblings, peopleById),
    relationshipRow(
      strings.printRaisedChildren,
      relationships.raisedChildren,
      peopleById
    ),
    ...relationships.guardians.map((guardianship) => {
      const names = namesFor(guardianship.guardians, peopleById);
      const detail = strings.asciiRaisedByFromAge.replace(
        "{age}",
        String(guardianship.startingAge)
      );
      return `              <li><strong>${escapeHtml(strings.printGuardians)}:</strong> ${escapeHtml(names)} — ${escapeHtml(detail)}</li>`;
    })
  ].filter(Boolean);

  if (rows.length === 0) {
    return "";
  }

  return `          <section class="relationships">
            <h5>${escapeHtml(strings.printRelationships)}</h5>
            <ul>
${rows.join("\n")}
            </ul>
          </section>`;
}

function relationshipRow(label, ids, peopleById) {
  if (ids.length === 0) {
    return "";
  }
  return `              <li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(namesFor(ids, peopleById))}</li>`;
}

function namesFor(ids, peopleById) {
  return ids.map((id) => peopleById.get(id)?.name ?? id).join(", ");
}

function renderNarrative(title, value) {
  if (!value) {
    return "";
  }
  return `          <section class="narrative">
            <h5>${escapeHtml(title)}</h5>
            <p>${escapeHtml(value)}</p>
          </section>`;
}

function renderProjectResearchNotes(projectNotes, localeData) {
  if (projectNotes.notes.length === 0) {
    return "";
  }
  const strings = localeData.strings;
  return `<section class="project-notes">
      <h2>${escapeHtml(strings.printProjectResearch)}</h2>
${projectNotes.notes
  .map(
    (note) => `      <article>
        <h3>${escapeHtml(note.title)}</h3>
        <p><strong>${escapeHtml(strings.status)}:</strong> ${escapeHtml(localizeResearchNoteStatus(note.status, localeData))}</p>
        <p>${escapeHtml(note.note)}</p>
        <h4>${escapeHtml(strings.printImplications)}</h4>
        <ul>
${note.implications
  .map((implication) => `          <li>${escapeHtml(implication)}</li>`)
  .join("\n")}
        </ul>
        <p><strong>${escapeHtml(strings.printProvenance)}:</strong> ${escapeHtml(note.provenance)}</p>
      </article>`
  )
  .join("\n")}
    </section>`;
}

function formatBirthDate(person, localeData) {
  const date = formatDate(person.birthDate, localeData);
  return person.birthDateEstimated
    ? `${date} (${localeData.strings.estimated})`
    : date;
}

function formatDate(value, localeData) {
  if (!value || value === "Unknown") {
    return localeData.strings.unknown;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Intl.DateTimeFormat(localeData.languageTag, {
    dateStyle: "long",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function lifeStatus(person, localeData) {
  return {
    deceased: localeData.strings.deceased,
    living: localeData.strings.living,
    unknown: localeData.strings.unknown
  }[person.lifeStatus ?? "living"];
}

function formatFamilyStatus(familyStatus, localeData) {
  return localeData.strings.familyStatusFormat
    .replace(
      "{relationship}",
      localeData.familyRelationships[familyStatus.relationship]
    )
    .replace(
      "{children}",
      localeData.familyChildren[familyStatus.children]
    );
}

function localizeValue(dictionary, value, unknown) {
  return value === "Unknown" ? unknown : dictionary[value] ?? value;
}

async function emit(filePath, content) {
  if (checkOnly) {
    await access(filePath, constants.F_OK);
    const current = await readFile(filePath, "utf8");
    if (current !== content) {
      throw new Error(
        `${path.relative(projectRoot, filePath)} is out of date. Regenerate printable reports.`
      );
    }
    return;
  }
  await writeFile(filePath, content, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function argumentValue(cliArgs, name) {
  const index = cliArgs.indexOf(name);
  const value = index === -1 ? null : cliArgs[index + 1];
  return !value || value.startsWith("--") ? null : value;
}

function printStyles() {
  return `    @page {
      size: Letter;
    margin: 0.75in;
    }
    :root {
      color-scheme: light;
      font-family: Georgia, "Times New Roman", serif;
      color: #17212b;
      background: #fff;
    }
    * {
      box-sizing: border-box;
    }
    body {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.4in;
      font-size: 9.5pt;
      line-height: 1.42;
    }
    h1, h2, h3, h4, h5, p {
      margin-top: 0;
    }
    h1 {
      margin-bottom: 0.12in;
      font-size: 24pt;
    }
    h2 {
      margin-top: 0.28in;
      padding-bottom: 0.05in;
      border-bottom: 2px solid #234f66;
      font-size: 16pt;
    }
    h3 {
      margin-top: 0.22in;
      font-size: 13pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h4 {
      margin-bottom: 0.08in;
      font-size: 13pt;
    }
    h5 {
      margin-bottom: 0.04in;
      font-size: 9.5pt;
    }
    .report-header {
      padding-bottom: 0.18in;
      border-bottom: 3px solid #234f66;
    }
    .eyebrow {
      margin-bottom: 0.04in;
      color: #855022;
      font: 700 8pt Arial, sans-serif;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .metadata {
      margin-bottom: 0;
      color: #58636d;
      font: 9pt Arial, sans-serif;
    }
    pre {
      padding: 0.15in;
      overflow-wrap: anywhere;
      border: 1px solid #a9b6bd;
      background: #f7f8f6;
      font: 9.5pt/1.35 Consolas, "Courier New", monospace;
      white-space: pre-wrap;
    }
    .generation {
      break-before: auto;
    }
    .person-record {
      margin: 0 0 0.18in;
      padding: 0.13in 0.16in;
      break-inside: avoid-page;
      border: 1px solid #a9b6bd;
      border-left: 4px solid #607f8f;
    }
    .person-record.focus-person {
      border-left-color: #173f57;
      box-shadow: inset 0 0 0 1px #173f57;
    }
    .person-record.direct-ancestor {
      border-left-color: #2f6a82;
    }
    .person-record-header {
      display: grid;
      grid-template-columns: 151.2px minmax(0, 1fr);
      gap: 0.14in;
      align-items: start;
      margin-bottom: 0.09in;
    }
    .person-record-summary {
      min-width: 0;
    }
    .print-portrait {
      display: grid;
      width: 151.2px;
      height: 267.624px;
      place-items: center;
      overflow: hidden;
      border: 1px solid #8ca0aa;
      border-radius: 0.06in;
      color: #234f66;
      background: #e8eef0;
      font: 700 21.168pt Arial, sans-serif;
      letter-spacing: 0.04em;
    }
    .print-portrait img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
    .facts {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.04in 0.18in;
      margin: 0 0 0.09in;
    }
    .facts div {
      display: grid;
      grid-template-columns: 1.3in minmax(0, 1fr);
      gap: 0.05in;
    }
    dt {
      padding: 0.02in 0.04in;
      background: #eef1f2;
      font-weight: 700;
    }
    dd {
      margin: 0;
    }
    .relationships ul,
    .stories ul,
    .project-notes ul {
      margin: 0.03in 0 0.08in;
      padding-left: 0.2in;
    }
    .stories > ul {
      margin-bottom: 0;
      list-style: none;
      padding-left: 0;
    }
    .stories {
      margin-top: 0.12in;
      padding: 0.12in 0.14in;
      border: 1px solid #c98a4b;
      border-left: 4px solid #855022;
      border-radius: 0.1in;
      background: #fff6e8;
    }
    .stories > h5 {
      margin-top: 0;
      color: #855022;
    }
    .story {
      margin-bottom: 0.06in;
    }
    .story:last-child {
      margin-bottom: 0;
    }
    .story h6 {
      margin: 0 0 0.02in;
      font-size: 10pt;
    }
    .story-details,
    .story-file {
      display: block;
    }
    .story-details {
      color: #58636d;
      font: 8.5pt Arial, sans-serif;
    }
    .story-content {
      margin: 0.05in 0;
    }
    .story-content p {
      margin: 0 0 0.06in;
    }
    .story figure {
      margin: 0.08in 0;
      break-inside: avoid-page;
    }
    .story figure img {
      display: block;
      max-width: 100%;
      max-height: 5.5in;
    }
    .story figcaption {
      margin-top: 0.03in;
      color: #58636d;
      font: 8.5pt Arial, sans-serif;
    }
    .story-file code {
      overflow-wrap: anywhere;
      font-size: 8pt;
    }
    .narrative p {
      margin-bottom: 0.08in;
      white-space: pre-wrap;
    }
    .missing-information dd {
      background: #fff1a8;
    }
    .project-notes article {
      break-inside: avoid-page;
      margin-bottom: 0.18in;
    }
    @media print {
      body {
        max-width: none;
        padding: 0;
      }
      .outline {
        break-after: page;
      }
    }`;
}
