import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  escapeAttribute,
  escapeHtml,
  renderPersonCard,
  renderStandalonePage,
  validatePerson
} from "../templates/person-card-html.mjs";
import { calculateLevels } from "./tree-layout.mjs";
import { parseViewArguments, selectViewTree } from "./views.mjs";
import { resolvePersonPhoto } from "./person-photo.mjs";
import { validateResearchNotes } from "./research-notes-data.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const peopleRoot = path.join(projectRoot, "people");
const checkOnly = process.argv.includes("--check");
const localeId = argumentValue("--locale") ?? "us-EN";
const { view, personId, highlightMissing } = parseViewArguments(
  process.argv.slice(2)
);
const locale = await readJson(
  path.join(projectRoot, "locales", `${localeId}.json`)
);
validateLocale(locale, localeId);
const localizedSuffix = localeId === "us-EN" ? "" : `.${localeId}`;
const modeSuffix = highlightMissing ? ".highlight-missing" : "";

const completeTree = await readJson(path.join(projectRoot, "tree.json"));
validateTree(completeTree);
const researchNotes = await readJson(
  path.join(projectRoot, "research-notes.json")
);
validateResearchNotes(researchNotes);

const people = await loadPeople();
validateReferences(completeTree, people);
const tree = selectViewTree(view, completeTree, personId);

await emit(
  path.join(
    projectRoot,
    `${view.htmlStem}${modeSuffix}${localizedSuffix}.html`
  ),
  renderTree(tree, people, locale, completeTree, view, { highlightMissing })
);

if (view.id === "full") {
  for (const person of people.values()) {
    const personDirectory = path.join(peopleRoot, person.id);
    const photoPath = await resolvePersonPhoto(
      person,
      personDirectory,
      projectRoot
    );
    await emit(
      path.join(
        personDirectory,
        `card${modeSuffix}${localizedSuffix}.html`
      ),
      renderStandalonePage(person, photoPath ? person.photo : null, locale, {
        highlightMissing
      })
    );
  }
}

console.log(
  view.requiresPerson
    ? `${checkOnly ? "Checked" : "Generated"} ${localeId} ${view.id} tree for ${personId} with ${tree.people.length} people.`
    : checkOnly
      ? `Checked ${people.size} people and all ${localeId} generated HTML files.`
      : `Generated ${localeId} tree and ${people.size} person card(s).`
);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function validateLocale(value, expectedId) {
  if (
    !value ||
    value.id !== expectedId ||
    typeof value.languageTag !== "string" ||
    !value.strings ||
    !value.familyRelationships ||
    !value.familyChildren ||
    !value.occupations ||
    !value.birthPlaces ||
    !value.deathPlaces
  ) {
    throw new Error(`locales/${expectedId}.json is invalid`);
  }
}

async function loadPeople() {
  const entries = await readdir(peopleRoot, { withFileTypes: true });
  const people = new Map();

  for (const entry of entries.filter((item) => item.isDirectory())) {
    const personPath = path.join(peopleRoot, entry.name, "person.json");
    const person = await readJson(personPath);
    validatePerson(person, path.relative(projectRoot, personPath));

    if (person.id !== entry.name) {
      throw new Error(
        `${path.relative(projectRoot, personPath)}: "id" must match its folder name`
      );
    }
    if (people.has(person.id)) {
      throw new Error(`Duplicate person id: ${person.id}`);
    }

    const resolvedPhotoPath = await resolvePersonPhoto(
      person,
      path.dirname(personPath),
      projectRoot
    );
    if (resolvedPhotoPath) {
      person.photo = path.basename(resolvedPhotoPath);
    }
    people.set(person.id, person);
  }

  return people;
}

function validateTree(value) {
  if (!value || typeof value !== "object") {
    throw new Error("tree.json must contain an object");
  }
  if (typeof value.title !== "string" || value.title.trim() === "") {
    throw new Error('tree.json: "title" must be a non-empty string');
  }
  if (!Array.isArray(value.people) || !Array.isArray(value.families)) {
    throw new Error('tree.json: "people" and "families" must be arrays');
  }
  if (
    value.siblingGroups !== undefined &&
    !Array.isArray(value.siblingGroups)
  ) {
    throw new Error('tree.json: "siblingGroups" must be an array');
  }
  if (
    value.guardianships !== undefined &&
    !Array.isArray(value.guardianships)
  ) {
    throw new Error('tree.json: "guardianships" must be an array');
  }
  if (new Set(value.people).size !== value.people.length) {
    throw new Error("tree.json: people contains duplicate ids");
  }

  const familyIds = new Set();
  for (const family of value.families) {
    if (
      !family ||
      typeof family.id !== "string" ||
      !Array.isArray(family.partners) ||
      !Array.isArray(family.children)
    ) {
      throw new Error(
        'tree.json: each family needs an "id", "partners", and "children"'
      );
    }
    if (familyIds.has(family.id)) {
      throw new Error(`tree.json: duplicate family id "${family.id}"`);
    }
    if (family.partners.length < 1 || family.partners.length > 2) {
      throw new Error(
        `tree.json: family "${family.id}" must have one or two partners`
      );
    }
    if (
      family.relationship !== undefined &&
      !["married", "divorced"].includes(family.relationship)
    ) {
      throw new Error(
        `tree.json: family "${family.id}" has invalid relationship "${family.relationship}"`
      );
    }
    if (new Set(family.partners).size !== family.partners.length) {
      throw new Error(
        `tree.json: family "${family.id}" contains duplicate partners`
      );
    }
    if (new Set(family.children).size !== family.children.length) {
      throw new Error(
        `tree.json: family "${family.id}" contains duplicate children`
      );
    }
    familyIds.add(family.id);
  }

  for (const group of value.siblingGroups ?? []) {
    if (
      !group ||
      typeof group.id !== "string" ||
      !Array.isArray(group.children) ||
      group.children.length < 2
    ) {
      throw new Error(
        'tree.json: each sibling group needs an "id" and at least two "children"'
      );
    }
    if (familyIds.has(group.id)) {
      throw new Error(`tree.json: duplicate family or sibling group id "${group.id}"`);
    }
    if (new Set(group.children).size !== group.children.length) {
      throw new Error(
        `tree.json sibling group "${group.id}" contains duplicate children`
      );
    }
    familyIds.add(group.id);
  }

  const guardianshipIds = new Set();
  for (const guardianship of value.guardianships ?? []) {
    if (
      !guardianship ||
      typeof guardianship.id !== "string" ||
      typeof guardianship.child !== "string" ||
      !Array.isArray(guardianship.guardians) ||
      guardianship.guardians.length < 1 ||
      guardianship.guardians.length > 2 ||
      guardianship.relationship !== "raised-by" ||
      !Number.isInteger(guardianship.startingAge) ||
      guardianship.startingAge < 0 ||
      guardianship.evidence !== "family-account"
    ) {
      throw new Error(
        'tree.json: each guardianship needs an "id", "child", one or two "guardians", relationship "raised-by", non-negative integer "startingAge", and evidence "family-account"'
      );
    }
    if (guardianshipIds.has(guardianship.id)) {
      throw new Error(
        `tree.json: duplicate guardianship id "${guardianship.id}"`
      );
    }
    if (new Set(guardianship.guardians).size !== guardianship.guardians.length) {
      throw new Error(
        `tree.json guardianship "${guardianship.id}" contains duplicate guardians`
      );
    }
    if (guardianship.guardians.includes(guardianship.child)) {
      throw new Error(
        `tree.json guardianship "${guardianship.id}" cannot make its child a guardian`
      );
    }
    guardianshipIds.add(guardianship.id);
  }
}

function validateReferences(treeData, peopleById) {
  for (const personId of treeData.people) {
    if (!peopleById.has(personId)) {
      throw new Error(`tree.json references unknown person "${personId}"`);
    }
  }

  const included = new Set(treeData.people);
  for (const family of treeData.families) {
    for (const personId of [...family.partners, ...family.children]) {
      if (!included.has(personId)) {
        throw new Error(
          `tree.json family "${family.id}" references "${personId}", which is not listed in people`
        );
      }
    }
  }
  for (const group of treeData.siblingGroups ?? []) {
    for (const personId of group.children) {
      if (!included.has(personId)) {
        throw new Error(
          `tree.json sibling group "${group.id}" references "${personId}", which is not listed in people`
        );
      }
    }
  }
  for (const guardianship of treeData.guardianships ?? []) {
    for (const personId of [
      guardianship.child,
      ...guardianship.guardians
    ]) {
      if (!included.has(personId)) {
        throw new Error(
          `tree.json guardianship "${guardianship.id}" references "${personId}", which is not listed in people`
        );
      }
    }
  }
}

function renderTree(
  treeData,
  peopleById,
  localeData,
  completeTreeData,
  view,
  options = {}
) {
  const strings = localeData.strings;
  const title = view.requiresPerson
    ? formatMessage(strings[view.titleKey], {
        person: peopleById.get(treeData.focusPersonId).name
      })
    : strings.treeTitle ?? treeData.title;
  const levels = calculateLevels(treeData);
  const rows = flattenLoneSiblingGroup(buildRows(treeData, levels));
  const ancestryChartClass = view.id.startsWith("ancestry")
    ? " ancestry-chart-page"
    : "";
  const generations = rows
    .map((row, level) => {
      return `      <section class="generation" data-generation="${level}">
        <div class="generation-label">
          <span>${escapeHtml(strings.generation)}</span>
          <strong>${level + 1}</strong>
        </div>
        <div class="generation-row">
${renderRow(
  row,
  peopleById,
  localeData,
  treeData,
  completeTreeData,
  options
)}
        </div>
      </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${escapeAttribute(localeData.languageTag)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="tree-page${treeData.focusPersonId ? " ancestry-page" : ""}${ancestryChartClass}${options.highlightMissing ? " highlight-missing" : ""}">
  <header class="site-header">
    <p class="eyebrow">${escapeHtml(strings.familyArchive)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(formatMessage(strings.peopleAcrossGenerations, {
      people: treeData.people.length,
      generations: rows.length
    }))}</p>
    <p class="preview-date" hidden></p>
  </header>

  <div class="tree-viewport">
    <main class="tree-canvas" id="family-tree">
      <svg class="connections" aria-hidden="true"></svg>
${generations}
    </main>
  </div>

  <script id="family-data" type="application/json">${escapeJsonForHtml(treeData.families)}</script>
  <script id="guardianship-data" type="application/json">${escapeJsonForHtml({
    guardianships: treeData.guardianships ?? [],
    label: strings.raisedBy
  })}</script>
  <script src="tree.js"></script>
</body>
</html>
`;
}

function renderRow(
  row,
  peopleById,
  localeData,
  treeData,
  completeTreeData,
  options
) {
  let siblingGroupIndex = 0;
  return row
    .map((token) => {
      if (token.type === "person") {
        return renderTreePerson(
          token.id,
          peopleById,
          localeData,
          treeData,
          completeTreeData,
          "          ",
          options
        );
      }

      if (token.type === "sibling-group") {
        const paletteIndex = siblingGroupIndex % 7;
        siblingGroupIndex += 1;
        const cards = token.items
          .map((item) => {
            if (item.type === "relationship") {
              return renderRelationship(
                item.family,
                localeData,
                "              "
              );
            }
            return renderTreePerson(
              item.id,
              peopleById,
              localeData,
              treeData,
              completeTreeData,
              "              ",
              options
            );
          })
          .join("\n");
        const groupTitle = formatSiblingGroupTitle(
          token.family,
          treeData,
          peopleById,
          localeData
        );
        const appearance = token.family.appearance
          ? ` data-appearance="${escapeAttribute(token.family.appearance)}"`
          : "";
        return `          <section class="sibling-group" data-sibling-family-id="${escapeAttribute(token.family.id)}" data-palette="${paletteIndex}"${appearance}>
            <h2>${escapeHtml(groupTitle)}</h2>
            <div class="sibling-group-row">
${cards}
            </div>
          </section>`;
      }

      const family = token.family;
      return renderRelationship(family, localeData, "          ");
    })
    .join("\n");
}

function renderRelationship(family, localeData, indent) {
  const label =
    family.partners.length === 2
      ? localeData.strings[family.relationship ?? "married"]
      : localeData.strings.parent;
  const childClass = family.children.length > 0 ? " has-children" : "";
  return `${indent}<div class="relationship${childClass}" data-family-id="${escapeAttribute(family.id)}">
${indent}  <span>${label}</span>
${indent}</div>`;
}

function flattenLoneSiblingGroup(rows) {
  const siblingGroupIds = new Set(
    rows
      .flat()
      .filter((token) => token.type === "sibling-group")
      .map((token) => token.family.id)
  );
  if (siblingGroupIds.size !== 1) {
    return rows;
  }

  return rows.map((row) =>
    row.flatMap((token) =>
      token.type === "sibling-group" ? token.items : token
    )
  );
}

function renderTreePerson(
  personId,
  peopleById,
  localeData,
  treeData,
  completeTreeData,
  indent,
  options
) {
  const sourcePerson = peopleById.get(personId);
  const personWithFamilyStatus =
    treeData.focusPersonId && treeData.deriveFamilyStatus !== false
      ? withDerivedFamilyStatus(sourcePerson, completeTreeData.families)
      : sourcePerson;
  const person =
    treeData.hideFamilyStatusForVisibleParents &&
    shouldHideFamilyStatus(personWithFamilyStatus, personId, treeData)
      ? withoutFamilyStatus(personWithFamilyStatus)
      : personWithFamilyStatus;
  const photoPath = person.photo
    ? `people/${person.id}/${person.photo}`
    : null;
  const classNames = [];
  if (personId === treeData.focusPersonId) {
    classNames.push("ancestry-focus");
  } else if (treeData.directAncestorIds?.includes(personId)) {
    classNames.push("direct-ancestor");
  } else if (treeData.directDescendantIds?.includes(personId)) {
    classNames.push("direct-descendant");
  }
  if (treeData.spouseIds?.includes(personId)) {
    classNames.push("blood-relative-spouse");
  }
  return renderPersonCard(person, {
    indent,
    photoPath,
    locale: localeData,
    compactDates: true,
    className: classNames.join(" "),
    highlightMissing: options.highlightMissing
  });
}

function shouldHideFamilyStatus(person, personId, treeData) {
  const visiblePeople = new Set(treeData.people);
  return treeData.families.some((family) => {
    if (!family.partners.includes(personId)) {
      return false;
    }

    const hasVisibleChildren = family.children.some((childId) =>
      visiblePeople.has(childId)
    );
    const hasVisibleSpouse =
      person.familyStatus?.relationship === "married" &&
      family.partners.length === 2 &&
      family.partners.every((partnerId) => visiblePeople.has(partnerId));
    return hasVisibleChildren || hasVisibleSpouse;
  });
}

function withDerivedFamilyStatus(person, families) {
  const modeledFamilies = families.filter((family) =>
    family.partners.includes(person.id)
  );
  const inferredRelationship = modeledFamilies.some(
    (family) => family.partners.length === 2
  )
    ? "married"
    : "unknown";
  const inferredChildren = modeledFamilies.some(
    (family) => family.children.length > 0
  )
    ? "has-children"
    : "unknown";
  const explicitStatus = person.familyStatus;
  const relationship =
    explicitStatus?.relationship !== undefined &&
    explicitStatus.relationship !== "unknown"
      ? explicitStatus.relationship
      : inferredRelationship;
  const children =
    explicitStatus?.children !== undefined &&
    explicitStatus.children !== "unknown"
      ? explicitStatus.children
      : inferredChildren;

  if (
    !explicitStatus &&
    relationship === "unknown" &&
    children === "unknown"
  ) {
    return person;
  }

  return {
    ...person,
    familyStatus: {
      relationship,
      children
    }
  };
}

function withoutFamilyStatus(person) {
  if (!person.familyStatus) {
    return person;
  }
  const result = { ...person };
  delete result.familyStatus;
  return result;
}

function formatMessage(message, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message
  );
}

function formatSiblingGroupTitle(
  family,
  treeData,
  peopleById,
  localeData
) {
  if (family.titleKey) {
    return localeData.strings[family.titleKey];
  }

  const visiblePeople = new Set(treeData.people);
  const surnames = [
    ...new Set(
      family.children
        .filter((personId) => visiblePeople.has(personId))
        .map((personId) => peopleById.get(personId)?.surnames)
        .filter(Boolean)
    )
  ];
  const sharedSurname = findSharedSurname(surnames);
  return formatMessage(localeData.strings.siblingGroupTitle, {
    surnames: sharedSurname ?? surnames.join(" / ")
  });
}

function findSharedSurname(surnames) {
  if (surnames.length === 0) {
    return null;
  }
  if (surnames.length === 1) {
    return surnames[0];
  }

  const surnameParts = surnames.map((surname) => surname.split(/[\s-]+/u));
  const sharedParts = surnameParts[0].filter((part) =>
    surnameParts.slice(1).every((parts) => parts.includes(part))
  );
  return sharedParts.length > 0 ? sharedParts.join(" ") : null;
}

function buildRows(treeData, levels) {
  const maxLevel = Math.max(...levels.values());
  const rows = [];

  for (let level = 0; level <= maxLevel; level += 1) {
    const peopleAtLevel = treeData.people.filter(
      (personId) => levels.get(personId) === level
    );
    rows.push(
      arrangeLevel(
        peopleAtLevel,
        treeData.groupingFamilies ?? treeData.families,
        treeData.families,
        new Set(treeData.directAncestorIds ?? []),
        new Map(Object.entries(treeData.directAncestorPaths ?? {})),
        treeData.focusPersonId,
        new Set(treeData.spouseGroupingLineageIds ?? []),
        treeData.groupLineageSpouses === true
      )
    );
  }
  return rows;
}

function arrangeLevel(
  peopleAtLevel,
  groupingFamilies,
  families,
  directAncestorIds,
  directAncestorPaths,
  focusPersonId,
  spouseGroupingLineageIds,
  groupLineageSpouses
) {
  const positions = new Map(
    peopleAtLevel.map((personId, index) => [personId, index])
  );
  const groupedPeople = new Set();
  const units = [];

  for (const family of groupingFamilies) {
    const siblingMembers = family.children.filter((personId) =>
      positions.has(personId)
    );
    const partnershipsByLineagePerson = new Map();
    if (groupLineageSpouses) {
      for (const personId of siblingMembers) {
        if (!spouseGroupingLineageIds.has(personId)) {
          continue;
        }
        const partnerships = families.filter(
          (candidate) =>
            candidate.partners.length === 2 &&
            candidate.partners.includes(personId) &&
            candidate.partners.every((partnerId) => positions.has(partnerId)) &&
            candidate.partners.some(
              (partnerId) => !spouseGroupingLineageIds.has(partnerId)
            )
        );
        if (partnerships.length > 0) {
          partnershipsByLineagePerson.set(personId, partnerships);
        }
      }
    }
    if (
      siblingMembers.length < 2 &&
      partnershipsByLineagePerson.size === 0
    ) {
      continue;
    }
    const directAncestors = siblingMembers.filter((personId) =>
      directAncestorIds.has(personId)
    );
    const collateralRelatives = siblingMembers.filter(
      (personId) => !directAncestorIds.has(personId)
    );
    const directAncestor = directAncestors[0];
    const ancestorPath = directAncestorPaths.get(directAncestor);
    const membersInDisplayOrder =
      ancestorPath?.endsWith("0")
        ? [...collateralRelatives, ...directAncestors]
        : ancestorPath?.endsWith("1")
          ? [...directAncestors, ...collateralRelatives]
          : siblingMembers;
    const embeddedPartnerships = [];
    const items = [];
    for (const personId of membersInDisplayOrder) {
      const partnerships = partnershipsByLineagePerson.get(personId) ?? [];
      const placeSpousesFirst =
        ancestorPath?.endsWith("0") ||
        (ancestorPath === undefined &&
          partnerships.some(
            (partnership) => partnership.partners.indexOf(personId) === 1
          ));
      const spouseItems = partnerships.map((partnership) => {
        const spouseId = partnership.partners.find(
          (partnerId) => partnerId !== personId
        );
        return {
          partnership,
          spouse: { type: "person", id: spouseId }
        };
      });
      const personItem = { type: "person", id: personId };
      if (placeSpousesFirst) {
        items.push(
          ...spouseItems.flatMap(({ partnership, spouse }) => [
            spouse,
            { type: "relationship", family: partnership }
          ]),
          personItem
        );
      } else {
        items.push(
          personItem,
          ...spouseItems.flatMap(({ partnership, spouse }) => [
            { type: "relationship", family: partnership },
            spouse
          ])
        );
      }
      embeddedPartnerships.push(...partnerships);
    }
    const members = items
      .filter((item) => item.type === "person")
      .map((item) => item.id);
    for (const personId of members) {
      groupedPeople.add(personId);
    }
    units.push({
      type: "sibling-group",
      family,
      members,
      items,
      embeddedPartnerships,
      lineagePath: ancestorPath,
      pinToEnd: family.pinToEnd === true,
      position: Math.min(
        ...siblingMembers.map((personId) => positions.get(personId))
      )
    });
  }

  for (const personId of peopleAtLevel) {
    if (!groupedPeople.has(personId)) {
      units.push({
        type: "person",
        id: personId,
        lineagePath:
          personId === focusPersonId
            ? ""
            : directAncestorPaths.get(personId),
        position: positions.get(personId)
      });
    }
  }

  units.sort((left, right) => {
    if (left.pinToEnd !== right.pinToEnd) {
      return left.pinToEnd ? 1 : -1;
    }
    if (
      left.lineagePath !== undefined &&
      right.lineagePath !== undefined
    ) {
      return left.lineagePath.localeCompare(right.lineagePath);
    }
    if (left.lineagePath !== undefined) {
      return -1;
    }
    if (right.lineagePath !== undefined) {
      return 1;
    }
    return left.position - right.position;
  });
  units.forEach((unit, index) => {
    unit.order = index;
  });

  const unitByPerson = new Map();
  for (const unit of units) {
    const members = unit.type === "sibling-group" ? unit.members : [unit.id];
    for (const personId of members) {
      unitByPerson.set(personId, unit);
    }
  }

  const relationshipsByUnit = new Map();
  for (const family of families) {
    if (!family.partners.every((personId) => positions.has(personId))) {
      continue;
    }
    const partnerUnits = family.partners.map((personId) =>
      unitByPerson.get(personId)
    );
    if (
      partnerUnits.every((unit) => unit === partnerUnits[0]) &&
      partnerUnits[0].embeddedPartnerships?.some(
        (partnership) => partnership.id === family.id
      )
    ) {
      continue;
    }
    const anchor = partnerUnits.reduce((earlier, candidate) =>
      candidate.order < earlier.order ? candidate : earlier
    );
    const relationships = relationshipsByUnit.get(anchor) ?? [];
    relationships.push({ type: "relationship", family });
    relationshipsByUnit.set(anchor, relationships);
  }

  return units.flatMap((unit) => [
    unit,
    ...(relationshipsByUnit.get(unit) ?? [])
  ]);
}

async function readJson(filePath) {
  let contents;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(
      `Could not read ${path.relative(projectRoot, filePath)}: ${error.message}`
    );
  }

  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${path.relative(projectRoot, filePath)}: ${error.message}`
    );
  }
}

async function emit(filePath, contents) {
  if (checkOnly) {
    let existing;
    try {
      existing = await readFile(filePath, "utf8");
    } catch {
      throw new Error(
        `${path.relative(projectRoot, filePath)} is missing; run npm run generate`
      );
    }
    if (existing !== contents) {
      throw new Error(
        `${path.relative(projectRoot, filePath)} is stale; run npm run generate`
      );
    }
    return;
  }

  await writeFile(filePath, contents, "utf8");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}
