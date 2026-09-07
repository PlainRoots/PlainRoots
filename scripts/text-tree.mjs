export function renderTextTree(
  treeData,
  peopleById,
  localeData,
  options = {}
) {
  const lines = [];
  const renderedPeople = new Set();
  const renderedFamilies = new Set();
  const groupingFamilies = treeData.groupingFamilies ?? treeData.families;
  const siblingGroups = groupingFamilies.filter(
    (family) =>
      family.partners.length === 0 &&
      family.appearance !== "unconnected"
  );
  const displayFamilies = mergeSiblingGroupsIntoFamilies(
    treeData.families,
    siblingGroups,
    new Set(treeData.people)
  );
  const standaloneGroups = groupingFamilies.filter(
    (family) =>
      family.partners.length === 0 &&
      family.appearance === "unconnected"
  );
  const groupedPeople = new Set(
    standaloneGroups.flatMap((group) => group.children)
  );

  for (const group of standaloneGroups) {
    lines.push(
      group.titleKey
        ? localeData.strings[group.titleKey]
        : formatFamilyName(group.id)
    );
    group.children.forEach((personId) => {
      appendBranch(
        lines,
        renderPersonBranch(
          personId,
          displayFamilies,
          peopleById,
          localeData,
          renderedPeople,
          renderedFamilies,
          options
        ),
        ""
      );
    });
    lines.push("");
  }

  const children = new Set(
    displayFamilies.flatMap((family) => family.children)
  );
  const groupedPartners = new Set();
  for (const family of displayFamilies) {
    if (family.partners.some((id) => groupedPeople.has(id))) {
      for (const partnerId of family.partners) {
        groupedPartners.add(partnerId);
      }
    }
  }
  const roots = treeData.people.filter(
    (personId) =>
      !children.has(personId) &&
      !groupedPeople.has(personId) &&
      !groupedPartners.has(personId)
  );
  if (treeData.focusPersonId) {
    roots.sort((left, right) => {
      if (left === treeData.focusPersonId) {
        return -1;
      }
      if (right === treeData.focusPersonId) {
        return 1;
      }
      return 0;
    });
  }

  roots.forEach((personId, index) => {
    if (renderedPeople.has(personId)) {
      return;
    }
    lines.push(
      ...renderPersonBranch(
        personId,
        displayFamilies,
        peopleById,
        localeData,
        renderedPeople,
        renderedFamilies,
        options
      )
    );
    if (index < roots.length - 1) {
      lines.push("");
    }
  });

  while (lines.at(-1) === "") {
    lines.pop();
  }
  return lines;
}

function mergeSiblingGroupsIntoFamilies(
  families,
  siblingGroups,
  includedPeople
) {
  const displayFamilies = families.map((family) => ({
    ...family,
    partners: [...family.partners],
    children: [...family.children]
  }));

  for (const group of siblingGroups) {
    const groupChildren = group.children.filter((id) =>
      includedPeople.has(id)
    );
    const parentFamily = displayFamilies
      .filter((family) =>
        family.children.some((id) => groupChildren.includes(id))
      )
      .sort(
        (left, right) =>
          countOverlap(right.children, groupChildren) -
          countOverlap(left.children, groupChildren)
      )[0];

    if (!parentFamily) {
      continue;
    }

    parentFamily.children = [
      ...groupChildren,
      ...parentFamily.children.filter((id) => !groupChildren.includes(id))
    ];
  }

  return displayFamilies;
}

function countOverlap(left, right) {
  return left.filter((id) => right.includes(id)).length;
}

export function renderTextGuardianships(
  treeData,
  peopleById,
  localeData,
  options = {}
) {
  const includedPeople = new Set(treeData.people);
  const guardianships = (treeData.guardianships ?? []).filter(
    (guardianship) =>
      includedPeople.has(guardianship.child) &&
      guardianship.guardians.every((id) => includedPeople.has(id))
  );
  if (guardianships.length === 0) {
    return [];
  }

  const lines = [localeData.strings.asciiGuardianshipTitle];
  guardianships.forEach((guardianship) => {
    const child = formatTextPerson(
      guardianship.child,
      peopleById,
      localeData,
      options
    );
    const guardians = guardianship.guardians
      .map((id) => formatTextPerson(id, peopleById, localeData, options))
      .join(" <--> ");
    const relationship = localeData.strings.asciiRaisedByFromAge.replace(
      "{age}",
      String(guardianship.startingAge)
    );
    lines.push(`+-- ${child}`);
    lines.push(`|   ${relationship}: ${guardians}`);
  });
  return lines;
}

export function formatTextTitle(
  view,
  treeData,
  peopleById,
  localeData
) {
  const template = localeData.strings[view.titleKey];
  if (!view.requiresPerson) {
    return template;
  }
  return template.replace(
    "{person}",
    peopleById.get(treeData.focusPersonId).name
  );
}

function renderPersonBranch(
  personId,
  families,
  peopleById,
  localeData,
  renderedPeople,
  renderedFamilies,
  options
) {
  renderedPeople.add(personId);
  const partnerships = families.filter(
    (family) =>
      family.partners.includes(personId) &&
      !renderedFamilies.has(family.id)
  );
  if (partnerships.length === 0) {
    return [formatTextPerson(personId, peopleById, localeData, options)];
  }

  const lines = [];
  partnerships.forEach((family, familyIndex) => {
    renderedFamilies.add(family.id);
    const otherPartnerIds = family.partners.filter((id) => id !== personId);
    const partners = [personId, ...otherPartnerIds].map((id) => {
      renderedPeople.add(id);
      return formatTextPerson(id, peopleById, localeData, options);
    });
    lines.push(
      familyIndex === 0
        ? partners.join(" <--> ")
        : `${localeData.strings.asciiWith} ${otherPartnerIds.map((id) => formatTextPerson(id, peopleById, localeData, options)).join(" <--> ")}`
    );
    family.children.forEach((childId) => {
      appendBranch(
        lines,
        renderPersonBranch(
          childId,
          families,
          peopleById,
          localeData,
          renderedPeople,
          renderedFamilies,
          options
        ),
        ""
      );
    });
  });
  return lines;
}

function appendBranch(target, branchLines, prefix) {
  const connector = "+-- ";
  const continuation = "|   ";
  branchLines.forEach((line, index) => {
    target.push(
      index === 0
        ? `${prefix}${connector}${line}`
        : `${prefix}${continuation}${line}`
    );
  });
}

function formatTextPerson(personId, peopleById, localeData, options) {
  const person = peopleById.get(personId);
  if (options.minimal) {
    return person.name;
  }
  const formattedBirthYear = formatYear(
    person.birthDate,
    localeData.strings.unknown
  );
  const birthYear = person.birthDateEstimated
    ? `${formattedBirthYear} (${localeData.strings.estimated})`
    : formattedBirthYear;
  const deathYear =
    person.lifeStatus === "living" || person.lifeStatus === undefined
      ? localeData.strings.living
      : formatYear(person.deathDate, localeData.strings.unknown);
  const birthplace =
    person.birthPlace === "Unknown"
      ? localeData.strings.asciiUnknownBirthplace
      : localeData.birthPlaces[person.birthPlace] ?? person.birthPlace;
  return `${person.name} (${localeData.strings.asciiBirthAbbreviation} ${birthYear}; ${localeData.strings.asciiDeathAbbreviation} ${deathYear}) [${birthplace}]`;
}

function formatYear(date, unknownLabel) {
  if (!date || date === "Unknown") {
    return `[${unknownLabel}]`;
  }
  return date.slice(0, 4);
}

function formatFamilyName(familyId) {
  return familyId.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
