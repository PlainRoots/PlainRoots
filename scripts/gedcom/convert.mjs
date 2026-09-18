import {
  child,
  children,
  childValue,
  recordText
} from "./parser.mjs";
import { convertGedcomDate } from "./dates.mjs";

const SEX_VALUES = Object.freeze({
  M: "male",
  F: "female",
  X: "intersex",
  U: "unknown",
  N: "not-recorded"
});
const NAME_TYPE_MAP = Object.freeze({
  aka: "documented-variant",
  immigrant: "documented-variant",
  married: "married-name"
});
const KNOWN_INDIVIDUAL_TAGS = new Set([
  "NAME",
  "SEX",
  "BIRT",
  "DEAT",
  "OCCU",
  "FAMS",
  "FAMC"
]);
const KNOWN_FAMILY_TAGS = new Set([
  "HUSB",
  "WIFE",
  "CHIL",
  "MARR",
  "DIV"
]);

export function convertGedcomToStaging(document, sourceFile) {
  const issues = [...document.diagnostics];
  const unresolved = [];
  const personRecords = document.records.filter((record) => record.tag === "INDI");
  const familyRecords = document.records.filter((record) => record.tag === "FAM");
  const { idsByPointer, idsByRecord } = assignPersonIds(personRecords);
  const people = personRecords.map((record) =>
    convertIndividual(
      record,
      idsByRecord.get(record),
      issues,
      unresolved
    )
  );
  const families = [];
  const siblingGroups = [];
  const guardianshipCandidates = [];
  const pedigreeCandidates = [];

  for (const record of familyRecords) {
    convertFamily(record, {
      idsByPointer,
      people,
      families,
      siblingGroups,
      guardianshipCandidates,
      pedigreeCandidates,
      issues,
      unresolved
    });
  }

  for (const record of document.records) {
    if (!["HEAD", "INDI", "FAM", "TRLR"].includes(record.tag)) {
      unresolved.push({
        reason: "unsupported-top-level-record",
        record: serializeNode(record)
      });
    }
  }

  const proposedPeople = people.map(({ proposedPerson }) => proposedPerson);
  const proposedTree = {
    title: deriveTreeTitle(document, sourceFile),
    people: proposedPeople.map((person) => person.id),
    families,
    ...(siblingGroups.length > 0 ? { siblingGroups } : {})
  };

  return {
    manifest: {
      format: "PlainRoots GEDCOM import staging",
      formatVersion: 1,
      sourceFile,
      sourceSystem: childValue(document.header, "SOUR"),
      sourceLanguage: childValue(document.header, "LANG"),
      sourceFileName: childValue(document.header, "FILE"),
      gedcomVersion: document.version,
      declaredEncoding: document.declaredEncoding,
      detectedEncoding: document.detectedEncoding,
      physicalLineCount: document.physicalLineCount,
      counts: {
        individuals: personRecords.length,
        families: familyRecords.length,
        proposedFamilies: families.length,
        proposedSiblingGroups: siblingGroups.length,
        guardianshipCandidates: guardianshipCandidates.length,
        pedigreeCandidates: pedigreeCandidates.length,
        issues: issues.length,
        unresolvedRecords: unresolved.length
      },
      archiveModified: false
    },
    proposedTree,
    people,
    guardianshipCandidates,
    pedigreeCandidates,
    issues,
    unresolved
  };
}

function convertIndividual(record, id, issues, unresolved) {
  const personIssues = [];
  if (!record.xref) {
    personIssues.push(
      "INDI record has no cross-reference; family pointers cannot refer to it"
    );
  }
  const nameRecords = children(record, "NAME");
  const primaryName = nameRecords[0] ?? null;
  const parsedPrimaryName = parseName(primaryName);
  const givenNames = parsedPrimaryName.givenNames || "Unknown";
  const surnames = parsedPrimaryName.surnames || "Unknown";
  const displayName =
    parsedPrimaryName.displayName ||
    [givenNames, surnames].filter((value) => value !== "Unknown").join(" ") ||
    "Unknown";

  if (!primaryName) {
    personIssues.push("Missing GEDCOM NAME record");
  }
  if (!parsedPrimaryName.givenNames) {
    personIssues.push("Missing structured given names");
  }
  if (!parsedPrimaryName.surnames) {
    personIssues.push("Missing structured surnames");
  }

  const sexCode = childValue(record, "SEX")?.toUpperCase() ?? "U";
  const sex = SEX_VALUES[sexCode] ?? "unknown";
  if (!SEX_VALUES[sexCode]) {
    personIssues.push(`Unsupported GEDCOM SEX value "${sexCode}"`);
  }

  const birthRecords = children(record, "BIRT");
  const deathRecords = children(record, "DEAT");
  const birth = convertEvent(birthRecords, "birth", personIssues);
  const death = convertEvent(deathRecords, "death", personIssues);
  if (death.estimated) {
    personIssues.push(
      "death: an approximate date was reduced to its date value because PlainRoots has no deathDateEstimated field"
    );
  }
  const occupationValues = children(record, "OCCU")
    .map((occupation) => recordText(occupation).trim())
    .filter(Boolean);
  if (occupationValues.length > 1) {
    personIssues.push(
      `Multiple occupations found; only the first was proposed (${occupationValues.join(", ")})`
    );
  }

  const alternateNames = [];
  let maidenName = null;
  for (const nameRecord of nameRecords.slice(1)) {
    const parsedName = parseName(nameRecord);
    const type = childValue(nameRecord, "TYPE")?.toLowerCase() ?? "aka";
    if (type === "maiden" && parsedName.surnames) {
      if (maidenName) {
        personIssues.push("Multiple maiden names require review");
      } else {
        maidenName = parsedName.surnames;
      }
      continue;
    }
    if (!parsedName.displayName) {
      personIssues.push("An alternate NAME record had no usable value");
      continue;
    }
    alternateNames.push({
      name: parsedName.displayName,
      language: "und",
      type: NAME_TYPE_MAP[type] ?? "documented-variant",
      evidence: `Imported from ${record.xref} NAME${type ? ` TYPE ${type}` : ""}; source evidence requires review.`
    });
    if (!NAME_TYPE_MAP[type] && type !== "aka") {
      personIssues.push(
        `GEDCOM NAME.TYPE "${type}" was reduced to documented-variant`
      );
    }
  }

  const nickname = primaryName ? childValue(primaryName, "NICK") : null;
  if (nickname) {
    alternateNames.push({
      name: nickname,
      language: "und",
      type: "nickname",
      evidence: `Imported from ${record.xref} NAME.NICK; source evidence requires review.`
    });
  }

  const proposedPerson = {
    id,
    name: displayName,
    givenNames,
    surnames,
    sex,
    maidenName,
    ...(alternateNames.length > 0 ? { alternateNames } : {}),
    initials: initialsFor(givenNames, surnames),
    occupation: occupationValues[0] ?? "Unknown",
    birthDate: birth.date ?? "Unknown",
    birthPlace: birth.place ?? "Unknown",
    ...(birth.estimated ? { birthDateEstimated: true } : {}),
    deathDate: death.date,
    ...(death.place ? { deathPlace: death.place } : {}),
    lifeStatus: deathRecords.length > 0 ? "deceased" : "unknown",
    photo: null
  };

  for (const unsupported of record.children.filter(
    (candidate) => !KNOWN_INDIVIDUAL_TAGS.has(candidate.tag)
  )) {
    unresolved.push({
      reason: "unsupported-individual-structure",
      owner: record.xref,
      record: serializeNode(unsupported)
    });
  }
  inventoryIndividualDetails(record, unresolved);

  for (const message of personIssues) {
    issues.push({
      severity: "warning",
      code: "person-conversion",
      record: record.xref,
      line: record.line,
      message
    });
  }

  return {
    sourcePointer: record.xref,
    proposedPerson,
    issues: personIssues,
    sourceRecord: serializeNode(record),
    sourceNode: record
  };
}

function convertFamily(record, context) {
  const {
    idsByPointer,
    people,
    families,
    siblingGroups,
    guardianshipCandidates,
    pedigreeCandidates,
    issues,
    unresolved
  } = context;
  const partnerPointers = [
    ...children(record, "HUSB"),
    ...children(record, "WIFE")
  ].map((partner) => partner.rawValue);
  const childPointers = children(record, "CHIL").map(
    (childRecord) => childRecord.rawValue
  );
  const partners = resolvePointers(
    partnerPointers,
    idsByPointer,
    record,
    "partner",
    issues
  );
  const familyChildren = resolvePointers(
    childPointers,
    idsByPointer,
    record,
    "child",
    issues
  );
  const familyId = uniqueFamilyId(record, partners, familyChildren, families, siblingGroups);
  const pedigreeLinks = findPedigreeLinks(record, people, idsByPointer);
  const fosterLinks = pedigreeLinks.filter((link) => link.type === "foster");
  const otherPedigreeLinks = pedigreeLinks.filter(
    (link) => link.type !== "foster" && link.type !== "birth"
  );
  const nonBirthChildren = new Set(
    pedigreeLinks
      .filter((link) => link.type !== "birth")
      .map((link) => link.child)
  );
  const ordinaryChildren = familyChildren.filter(
    (childId) => !nonBirthChildren.has(childId)
  );

  if (fosterLinks.length > 0) {
    for (const link of fosterLinks) {
      guardianshipCandidates.push({
        id: `${link.child}-raised-by-${partners.join("-") || "unknown-guardians"}`,
        sourceFamilyPointer: record.xref,
        child: link.child,
        guardians: link.parents ?? partners,
        relationship: "raised-by",
        startingAge: null,
        evidence: null,
        reviewRequired: true,
        issues: [
          "GEDCOM foster pedigree does not establish the PlainRoots startingAge or evidence fields"
        ]
      });
    }
    if (
      fosterLinks.length > 1 ||
      ordinaryChildren.length > 0 ||
      otherPedigreeLinks.length > 0
    ) {
      issues.push({
        severity: "warning",
        code: "mixed-foster-family",
        record: record.xref,
        line: record.line,
        message:
          "Family contains foster and non-foster child links; review before applying any relationship"
      });
    }
  }
  for (const link of otherPedigreeLinks) {
    pedigreeCandidates.push({
      sourceFamilyPointer: record.xref,
      child: link.child,
      parents: link.parents ?? partners,
      pedigree: link.type,
      reviewRequired: true
    });
    issues.push({
      severity: "warning",
      code: "non-birth-pedigree",
      record: record.xref,
      line: record.line,
      message: `${link.child} has pedigree ${link.type}; the relationship was not proposed as ordinary parentage`
    });
  }

  const hasIndependentPartnership =
    partners.length === 2 &&
    (child(record, "MARR") ||
      child(record, "DIV") ||
      hasUnmarriedPartnershipEvent(record));
  if (partners.length === 0 && ordinaryChildren.length >= 2) {
    siblingGroups.push({
      id: familyId,
      partners: [],
      children: ordinaryChildren
    });
  } else if (
    partners.length === 0 &&
    ordinaryChildren.length < 2 &&
    pedigreeLinks.length === 0
  ) {
    unresolved.push({
      reason: "family-without-partners-or-sibling-group",
      record: serializeNode(record)
    });
  } else if (
    partners.length > 0 &&
    (ordinaryChildren.length > 0 ||
      familyChildren.length === 0 ||
      hasIndependentPartnership)
  ) {
    const relationship =
      partners.length === 2
        ? child(record, "DIV")
          ? "divorced"
          : child(record, "MARR")
            ? "married"
            : hasUnmarriedPartnershipEvent(record)
              ? "partnered"
              : "unknown"
        : null;
    const proposedFamily = {
      id: familyId,
      partners,
      children: ordinaryChildren
    };
    if (relationship) {
      proposedFamily.relationship = relationship;
    }
    families.push(proposedFamily);
  }

  for (const unsupported of record.children.filter(
    (candidate) =>
      !KNOWN_FAMILY_TAGS.has(candidate.tag) &&
      !isUnmarriedPartnershipEvent(candidate)
  )) {
    unresolved.push({
      reason: "unsupported-family-structure",
      owner: record.xref,
      record: serializeNode(unsupported)
    });
  }
  inventoryFamilyDetails(record, unresolved);
}

function assignPersonIds(records) {
  const idsByPointer = new Map();
  const idsByRecord = new Map();
  const used = new Set();
  for (const record of records) {
    const parsedName = parseName(child(record, "NAME"));
    const base =
      slug(
        [parsedName.givenNames, parsedName.surnames]
          .filter(Boolean)
          .join(" ")
      ) || "gedcom-person";
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    idsByRecord.set(record, candidate);
    if (record.xref) {
      idsByPointer.set(record.xref, candidate);
    }
  }
  return { idsByPointer, idsByRecord };
}

function parseName(nameRecord) {
  if (!nameRecord) {
    return { displayName: null, givenNames: null, surnames: null };
  }
  const rawName = recordText(nameRecord).trim();
  const explicitGiven = childValue(nameRecord, "GIVN")?.trim() || null;
  const explicitSurname = childValue(nameRecord, "SURN")?.trim() || null;
  const slashMatch = /^(.*?)\s*\/(.*?)\/(?:\s*(.*))?$/.exec(rawName);
  const givenNames =
    explicitGiven || slashMatch?.[1]?.trim() || (explicitSurname ? null : rawName);
  const surnames = explicitSurname || slashMatch?.[2]?.trim() || null;
  const displayName =
    [givenNames, surnames].filter(Boolean).join(" ") || rawName || null;
  return { displayName, givenNames, surnames };
}

function convertEvent(eventRecords, label, issues) {
  if (eventRecords.length === 0) {
    return { date: null, place: null, estimated: false };
  }

  const dateEntries = eventRecords
    .map((eventRecord) => {
      const original = childValue(eventRecord, "DATE")?.trim() || null;
      return original
        ? { original, result: convertGedcomDate(original) }
        : null;
    })
    .filter(Boolean);
  for (const { result } of dateEntries) {
    if (result.loss) {
      issues.push(`${label}: ${result.loss}`);
    }
  }

  const dateResult = reconcileEventDates(dateEntries, label, issues);
  return {
    date: dateResult.value,
    place:
      eventRecords
        .map((eventRecord) => childValue(eventRecord, "PLAC")?.trim())
        .find(Boolean) ?? null,
    estimated: dateResult.estimated
  };
}

function reconcileEventDates(dateEntries, label, issues) {
  if (dateEntries.length === 0) {
    return { value: null, estimated: false };
  }

  const uniqueOriginals = [
    ...new Set(dateEntries.map(({ original }) => original.toUpperCase()))
  ];
  if (uniqueOriginals.length === 1) {
    return dateEntries[0].result;
  }
  if (dateEntries.some(({ result }) => !result.value)) {
    issues.push(conflictingDatesMessage(label, dateEntries));
    return { value: null, estimated: false };
  }

  const uniqueValues = [
    ...new Set(dateEntries.map(({ result }) => result.value))
  ];
  if (uniqueValues.length === 1) {
    return {
      value: uniqueValues[0],
      estimated: dateEntries.some(({ result }) => result.estimated)
    };
  }

  const sharedPrecision = sharedDatePrecision(uniqueValues);
  if (sharedPrecision) {
    issues.push(
      `${label}: compatible GEDCOM dates (${dateEntries
        .map(({ original }) => `"${original}"`)
        .join(", ")}) were reduced to shared precision ${sharedPrecision}`
    );
    return {
      value: sharedPrecision,
      estimated: dateEntries.some(({ result }) => result.estimated)
    };
  }

  issues.push(conflictingDatesMessage(label, dateEntries));
  return { value: null, estimated: false };
}

function conflictingDatesMessage(label, dateEntries) {
  return `${label}: conflicting GEDCOM dates (${dateEntries
    .map(({ original }) => `"${original}"`)
    .join(", ")}); no date was proposed`;
}

function sharedDatePrecision(values) {
  const leastPrecise = [...values].sort(
    (left, right) => left.length - right.length
  )[0];
  return values.every(
    (value) => value === leastPrecise || value.startsWith(`${leastPrecise}-`)
  )
    ? leastPrecise
    : null;
}

function inventoryIndividualDetails(record, unresolved) {
  for (const nameRecord of children(record, "NAME")) {
    inventoryUnsupportedChildren(
      nameRecord,
      new Set(["TYPE", "GIVN", "SURN", "NICK", "CONC", "CONT"]),
      "unsupported-name-detail",
      record.xref,
      unresolved
    );
  }
  for (const eventTag of ["BIRT", "DEAT"]) {
    for (const eventRecord of children(record, eventTag)) {
      inventoryUnsupportedChildren(
        eventRecord,
        new Set(["DATE", "PLAC"]),
        "unsupported-individual-event-detail",
        record.xref,
        unresolved
      );
    }
  }
  for (const occupation of children(record, "OCCU")) {
    inventoryUnsupportedChildren(
      occupation,
      new Set(["CONC", "CONT"]),
      "unsupported-occupation-detail",
      record.xref,
      unresolved
    );
  }
  for (const familyLink of [
    ...children(record, "FAMC"),
    ...children(record, "FAMS")
  ]) {
    inventoryUnsupportedChildren(
      familyLink,
      familyLink.tag === "FAMC" ? new Set(["PEDI"]) : new Set(),
      "unsupported-family-link-detail",
      record.xref,
      unresolved
    );
  }
}

function inventoryFamilyDetails(record, unresolved) {
  for (const childRecord of children(record, "CHIL")) {
    inventoryUnsupportedChildren(
      childRecord,
      new Set(["_FREL", "_MREL"]),
      "unsupported-family-child-detail",
      record.xref,
      unresolved
    );
  }
  for (const eventTag of ["MARR", "DIV"]) {
    for (const eventRecord of children(record, eventTag)) {
      inventoryUnsupportedChildren(
        eventRecord,
        new Set(),
        "unsupported-family-event-detail",
        record.xref,
        unresolved
      );
    }
  }
  for (const eventRecord of children(record, "EVEN").filter(
    isUnmarriedPartnershipEvent
  )) {
    inventoryUnsupportedChildren(
      eventRecord,
      new Set(["TYPE"]),
      "unsupported-family-event-detail",
      record.xref,
      unresolved
    );
  }
}

function hasUnmarriedPartnershipEvent(record) {
  return children(record, "EVEN").some(isUnmarriedPartnershipEvent);
}

function isUnmarriedPartnershipEvent(record) {
  return (
    record?.tag === "EVEN" &&
    childValue(record, "TYPE")?.trim().toLowerCase() ===
      "unmarried partnership"
  );
}

function inventoryUnsupportedChildren(
  record,
  supportedTags,
  reason,
  owner,
  unresolved
) {
  for (const detail of record.children) {
    if (!supportedTags.has(detail.tag)) {
      unresolved.push({
        reason,
        owner,
        record: serializeNode(detail)
      });
    }
  }
}

function resolvePointers(pointerValues, idsByPointer, record, role, issues) {
  const resolved = [];
  for (const pointer of pointerValues) {
    const id = idsByPointer.get(pointer);
    if (!id) {
      issues.push({
        severity: "error",
        code: "unresolved-family-person",
        record: record.xref,
        line: record.line,
        message: `${role} pointer ${pointer ?? "(missing)"} could not be resolved`
      });
    } else if (!resolved.includes(id)) {
      resolved.push(id);
    }
  }
  return resolved;
}

function findPedigreeLinks(familyRecord, people, idsByPointer) {
  const matchesByChild = new Map();
  for (const person of people) {
    const links = person.sourceNode.children.filter(
      (candidate) =>
        candidate.tag === "FAMC" &&
        candidate.rawValue === familyRecord.xref
    );
    for (const link of links) {
      const pedigreeRecord = link.children.find(
        (detail) => detail.tag === "PEDI"
      );
      matchesByChild.set(person.proposedPerson.id, {
        child: person.proposedPerson.id,
        type: normalizedPedigree(pedigreeRecord?.value) ?? "birth",
        explicit: Boolean(pedigreeRecord)
      });
    }
  }

  const fatherIds = resolveKnownPointers(
    children(familyRecord, "HUSB").map((record) => record.rawValue),
    idsByPointer
  );
  const motherIds = resolveKnownPointers(
    children(familyRecord, "WIFE").map((record) => record.rawValue),
    idsByPointer
  );
  for (const childRecord of children(familyRecord, "CHIL")) {
    const childId = idsByPointer.get(childRecord.rawValue);
    if (!childId || matchesByChild.get(childId)?.explicit) {
      continue;
    }
    const fatherPedigree = normalizedPedigree(
      childValue(childRecord, "_FREL")
    );
    const motherPedigree = normalizedPedigree(
      childValue(childRecord, "_MREL")
    );
    if (!fatherPedigree && !motherPedigree) {
      continue;
    }

    if (
      fatherPedigree &&
      motherPedigree &&
      fatherPedigree === motherPedigree
    ) {
      matchesByChild.set(childId, {
        child: childId,
        type: fatherPedigree,
        parents: [...fatherIds, ...motherIds]
      });
      continue;
    }

    const parentSpecificLinks = [
      ...pedigreeLinksForParents(childId, fatherPedigree, fatherIds),
      ...pedigreeLinksForParents(childId, motherPedigree, motherIds)
    ];
    matchesByChild.delete(childId);
    parentSpecificLinks.forEach((link, index) => {
      matchesByChild.set(`${childId}:${index}`, link);
    });
  }

  return [...matchesByChild.values()];
}

function pedigreeLinksForParents(childId, pedigree, parents) {
  if (!pedigree) {
    return [];
  }
  return [
    {
      child: childId,
      type: pedigree,
      parents
    }
  ];
}

function normalizedPedigree(value) {
  return value?.trim().toLowerCase() || null;
}

function resolveKnownPointers(pointerValues, idsByPointer) {
  return pointerValues
    .map((pointer) => idsByPointer.get(pointer))
    .filter((id, index, values) => id && values.indexOf(id) === index);
}

function uniqueFamilyId(record, partners, familyChildren, families, siblingGroups) {
  const base =
    slug(partners.join(" ")) ||
    slug(`${familyChildren.slice(0, 2).join(" ")} siblings`) ||
    slug(record.xref?.replaceAll("@", "")) ||
    "gedcom-family";
  const used = new Set([
    ...families.map((family) => family.id),
    ...siblingGroups.map((group) => group.id)
  ]);
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function deriveTreeTitle(document, sourceFile) {
  const headerNote = childValue(document.header, "NOTE");
  if (headerNote) {
    return headerNote;
  }
  const name = sourceFile.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return name ? `Imported ${name}` : "Imported GEDCOM family";
}

function initialsFor(givenNames, surnames) {
  const initials = [
    ...givenNames.split(/\s+/).slice(0, 2),
    ...surnames.split(/\s+/).slice(0, 2)
  ]
    .filter((part) => part && part !== "Unknown")
    .map((part) => Array.from(part)[0]?.toUpperCase())
    .join("");
  return initials || "U";
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function serializeNode(node) {
  return {
    level: node.level,
    ...(node.xref ? { xref: node.xref } : {}),
    tag: node.tag,
    ...(node.value !== null ? { value: node.value } : {}),
    line: node.line,
    ...(node.children.length > 0
      ? { children: node.children.map(serializeNode) }
      : {})
  };
}
