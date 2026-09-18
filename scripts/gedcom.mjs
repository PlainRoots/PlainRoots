import { parsePlainRootsDate } from "./date-values.mjs";

const GEDCOM_VERSION = "5.5.5";
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC"
];
const SEX_VALUES = Object.freeze({
  male: "M",
  female: "F",
  intersex: "X",
  unknown: "U",
  "not-recorded": "N"
});

export function serializeGedcom({
  tree,
  people,
  fileName = "family-tree.ged",
  createdAt = new Date()
}) {
  const warnings = [];
  const lines = [];
  const personXrefs = new Map(
    tree.people.map((personId, index) => [personId, `@I${index + 1}@`])
  );
  const families = buildFamilies(tree);
  const familyXrefs = new Map(
    families.map((family, index) => [family.key, `@F${index + 1}@`])
  );
  const memberships = buildMemberships(families);

  addHeader(lines, fileName, createdAt);
  for (const personId of tree.people) {
    const person = people.get(personId);
    if (!person) {
      throw new Error(`Cannot export unknown person "${personId}"`);
    }
    addIndividual(
      lines,
      person,
      personXrefs.get(personId),
      memberships.get(personId) ?? [],
      familyXrefs,
      warnings
    );
  }
  for (const family of families) {
    addFamily(
      lines,
      family,
      familyXrefs.get(family.key),
      personXrefs,
      people,
      warnings
    );
  }
  lines.push(line(0, "TRLR"));

  return {
    content: `\uFEFF${lines.join("\r\n")}\r\n`,
    warnings,
    stats: {
      individuals: tree.people.length,
      families: families.length,
      siblingGroups: tree.siblingGroups?.length ?? 0,
      guardianships: tree.guardianships?.length ?? 0
    }
  };
}

export function formatGedcomDate(value, estimated = false) {
  if (value === null || value === undefined || value === "Unknown") {
    return null;
  }
  const parsed = parsePlainRootsDate(value);
  if (!parsed) {
    throw new Error(`Invalid PlainRoots date "${value}"`);
  }
  if (parsed.precision === "year") {
    return estimated ? `ABT ${value}` : value;
  }
  if (parsed.precision === "month") {
    const result = `${MONTHS[parsed.month - 1]} ${parsed.year}`;
    return estimated ? `ABT ${result}` : result;
  }

  const result = `${parsed.day} ${MONTHS[parsed.month - 1]} ${parsed.year}`;
  return estimated ? `ABT ${result}` : result;
}

function addHeader(lines, fileName, createdAt) {
  lines.push(
    line(0, "HEAD"),
    line(1, "GEDC"),
    line(2, "VERS", GEDCOM_VERSION),
    line(2, "FORM", "LINEAGE-LINKED"),
    line(3, "VERS", GEDCOM_VERSION),
    line(1, "CHAR", "UTF-8"),
    line(1, "SOUR", "PlainRoots"),
    line(2, "NAME", "PlainRoots"),
    line(2, "CORP", "PlainRoots"),
    line(3, "WWW", "https://github.com/PlainRoots/PlainRoots"),
    line(1, "DATE", formatHeaderDate(createdAt)),
    line(1, "FILE", fileName),
    line(1, "LANG", "English"),
    line(1, "SUBM", "@U1@", { rawValue: true }),
    line(0, "SUBM", null, { xref: "@U1@" }),
    line(1, "NAME", "PlainRoots export")
  );
}

function addIndividual(
  lines,
  person,
  xref,
  memberships,
  familyXrefs,
  warnings
) {
  lines.push(
    line(0, "INDI", null, { xref }),
    line(1, "NAME", personalName(person.givenNames, person.surnames)),
    line(2, "GIVN", person.givenNames),
    line(2, "SURN", person.surnames)
  );
  for (const alternateName of person.alternateNames ?? []) {
    if (alternateName.type === "nickname") {
      lines.push(line(2, "NICK", alternateName.name));
    }
  }
  lines.push(line(1, "SEX", sexValue(person.sex)));

  if (person.maidenName) {
    lines.push(
      line(1, "NAME", personalName(person.givenNames, person.maidenName)),
      line(2, "TYPE", "maiden"),
      line(2, "GIVN", person.givenNames),
      line(2, "SURN", person.maidenName)
    );
  }

  for (const alternateName of person.alternateNames ?? []) {
    if (alternateName.type !== "nickname") {
      warnings.push(
        `${person.id}: alternate name "${alternateName.name}" (${alternateName.type}) was not exported because PlainRoots does not store its GEDCOM name pieces.`
      );
    }
  }

  addEvent(lines, "BIRT", {
    date: formatGedcomDate(person.birthDate, person.birthDateEstimated),
    place: knownValue(person.birthPlace)
  });

  const deathDate = formatGedcomDate(person.deathDate);
  const deathPlace = knownValue(person.deathPlace);
  if (deathDate || deathPlace) {
    addEvent(lines, "DEAT", { date: deathDate, place: deathPlace });
  } else if (person.lifeStatus === "deceased") {
    lines.push(line(1, "DEAT", "Y"));
  }

  const occupation = knownValue(person.occupation);
  if (occupation) {
    lines.push(line(1, "OCCU", occupation));
  }

  for (const membership of memberships) {
    lines.push(
      line(
        1,
        membership.role,
        familyXrefs.get(membership.familyKey),
        { rawValue: true }
      )
    );
    if (membership.pedigree) {
      lines.push(line(2, "PEDI", membership.pedigree));
    }
  }

  for (const field of ["remarks", "researchNotes", "stories", "photo"]) {
    if (hasContent(person[field])) {
      warnings.push(
        `${person.id}: ${field} is not exported by the initial GEDCOM exporter.`
      );
    }
  }
}

function addFamily(lines, family, xref, personXrefs, people, warnings) {
  lines.push(line(0, "FAM", null, { xref }));

  const partnerTags = selectPartnerTags(family.partners, people);
  if (new Set(partnerTags).size < partnerTags.length) {
    warnings.push(
      `${family.id}: exported duplicate ${partnerTags[0]} records for a same-sex family. This PlainRoots compatibility extension exceeds strict GEDCOM 5.5.5 HUSB/WIFE cardinality.`
    );
  }
  for (let index = 0; index < family.partners.length; index += 1) {
    lines.push(
      line(1, partnerTags[index], personXrefs.get(family.partners[index]), {
        rawValue: true
      })
    );
  }
  for (const childId of family.children) {
    lines.push(line(1, "CHIL", personXrefs.get(childId), { rawValue: true }));
  }

  if (family.kind === "family" && family.partners.length === 2) {
    lines.push(line(1, "MARR", "Y"));
    if (family.relationship === "divorced") {
      lines.push(line(1, "DIV"));
    }
  } else if (family.kind === "guardian") {
    warnings.push(
      `${family.id}: exported the raised-by relationship with PEDI foster; startingAge and evidence have no direct GEDCOM 5.5.5 representation and were omitted.`
    );
  }
}

function buildFamilies(tree) {
  return [
    ...tree.families.map((family) => ({
      ...family,
      key: `family:${family.id}`,
      kind: "family"
    })),
    ...(tree.siblingGroups ?? []).map((group) => ({
      id: group.id,
      partners: [],
      children: group.children,
      key: `sibling:${group.id}`,
      kind: "sibling"
    })),
    ...(tree.guardianships ?? []).map((guardianship) => ({
      id: guardianship.id,
      partners: guardianship.guardians,
      children: [guardianship.child],
      startingAge: guardianship.startingAge,
      evidence: guardianship.evidence,
      key: `guardian:${guardianship.id}`,
      kind: "guardian"
    }))
  ];
}

function buildMemberships(families) {
  const memberships = new Map();
  for (const family of families) {
    for (const partnerId of family.partners) {
      addMembership(memberships, partnerId, {
        familyKey: family.key,
        role: "FAMS"
      });
    }
    for (const childId of family.children) {
      addMembership(memberships, childId, {
        familyKey: family.key,
        role: "FAMC",
        pedigree: family.kind === "guardian" ? "foster" : null
      });
    }
  }
  return memberships;
}

function addMembership(memberships, personId, membership) {
  const current = memberships.get(personId) ?? [];
  current.push(membership);
  memberships.set(personId, current);
}

function selectPartnerTags(partnerIds, people) {
  if (partnerIds.length === 0) {
    return [];
  }
  const sexes = partnerIds.map((personId) => people.get(personId)?.sex);
  if (sexes.every((sex) => sex === "male")) {
    return partnerIds.map(() => "HUSB");
  }
  if (sexes.every((sex) => sex === "female")) {
    return partnerIds.map(() => "WIFE");
  }
  if (partnerIds.length === 1) {
    return [sexes[0] === "female" ? "WIFE" : "HUSB"];
  }
  if (sexes[0] === "female" && sexes[1] === "male") {
    return ["WIFE", "HUSB"];
  }
  return ["HUSB", "WIFE"];
}

function addEvent(lines, tag, { date, place }) {
  if (!date && !place) {
    return;
  }
  lines.push(line(1, tag));
  if (date) {
    lines.push(line(2, "DATE", date));
  }
  if (place) {
    lines.push(line(2, "PLAC", place));
  }
}

function sexValue(value) {
  const result = SEX_VALUES[value];
  if (!result) {
    throw new Error(`Unsupported PlainRoots sex value "${value}"`);
  }
  return result;
}

function personalName(givenNames, surnames) {
  if (givenNames.includes("/") || surnames.includes("/")) {
    throw new Error("GEDCOM names cannot contain an unescaped slash");
  }
  return `${givenNames} /${surnames}/`;
}

function knownValue(value) {
  return value === null || value === undefined || value === "Unknown"
    ? null
    : value;
}

function hasContent(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0)
  );
}

function formatHeaderDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error("GEDCOM creation date must be a valid Date");
  }
  return `${value.getUTCDate()} ${MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

function line(level, tag, value = null, options = {}) {
  const prefix = options.xref
    ? `${level} ${options.xref} ${tag}`
    : `${level} ${tag}`;
  const encodedValue =
    value === null
      ? ""
      : ` ${options.rawValue ? value : encodeLineValue(String(value))}`;
  const result = `${prefix}${encodedValue}`;
  if (result.length > 255) {
    throw new Error(
      `GEDCOM line exceeds 255 code units: ${result.slice(0, 80)}...`
    );
  }
  return result;
}

function encodeLineValue(value) {
  if (/[\r\n]/.test(value)) {
    throw new Error("GEDCOM line values cannot contain newlines");
  }
  return value.replaceAll("@", "@@");
}
