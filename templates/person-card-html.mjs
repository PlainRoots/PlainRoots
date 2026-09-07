const REQUIRED_FIELDS = [
  "id",
  "name",
  "givenNames",
  "surnames",
  "initials",
  "occupation",
  "birthDate",
  "birthPlace"
];

export function validatePerson(person, source) {
  for (const field of REQUIRED_FIELDS) {
    if (typeof person[field] !== "string" || person[field].trim() === "") {
      throw new Error(`${source}: "${field}" must be a non-empty string`);
    }
  }

  if (person.photo !== null && typeof person.photo !== "string") {
    throw new Error(`${source}: "photo" must be a file name or null`);
  }
  if (
    person.maidenName !== null &&
    (typeof person.maidenName !== "string" || person.maidenName.trim() === "")
  ) {
    throw new Error(`${source}: "maidenName" must be a non-empty string or null`);
  }
  if (
    person.deathDate !== null &&
    (typeof person.deathDate !== "string" || person.deathDate.trim() === "")
  ) {
    throw new Error(`${source}: "deathDate" must be a non-empty string or null`);
  }
  for (const field of ["remarks", "researchNotes"]) {
    if (
      person[field] !== undefined &&
      person[field] !== null &&
      (typeof person[field] !== "string" || person[field].trim() === "")
    ) {
      throw new Error(
        `${source}: "${field}" must be a non-empty string or null`
      );
    }
  }
  if (
    person.birthDateEstimated !== undefined &&
    typeof person.birthDateEstimated !== "boolean"
  ) {
    throw new Error(`${source}: "birthDateEstimated" must be a boolean`);
  }
  if (
    person.lifeStatus !== undefined &&
    !["living", "deceased", "unknown"].includes(person.lifeStatus)
  ) {
    throw new Error(
      `${source}: "lifeStatus" must be "living", "deceased", or "unknown"`
    );
  }
  if (person.alternateNames !== undefined) {
    if (
      !Array.isArray(person.alternateNames) ||
      person.alternateNames.length === 0
    ) {
      throw new Error(
        `${source}: "alternateNames" must be a non-empty array when present`
      );
    }
    for (const alternateName of person.alternateNames) {
      if (
        !alternateName ||
        typeof alternateName !== "object" ||
        !["name", "language", "transliteration", "type", "evidence"].every(
          (field) =>
            typeof alternateName[field] === "string" &&
            alternateName[field].trim() !== ""
        ) ||
        alternateName.type !== "likely-arabic-equivalent"
      ) {
        throw new Error(
          `${source}: each alternate name needs a name, language, transliteration, type "likely-arabic-equivalent", and descriptive evidence`
        );
      }
    }
  }
  if (person.familyStatus !== undefined) {
    const relationshipStatuses = [
      "married",
      "unmarried",
      "partnered",
      "divorced",
      "widowed",
      "unknown"
    ];
    const childrenStatuses = ["has-children", "no-children", "unknown"];
    if (
      !person.familyStatus ||
      typeof person.familyStatus !== "object" ||
      !relationshipStatuses.includes(person.familyStatus.relationship) ||
      !childrenStatuses.includes(person.familyStatus.children)
    ) {
      throw new Error(
        `${source}: "familyStatus" needs valid "relationship" and "children" values`
      );
    }
  }
}

export function renderPersonCard(person, options = {}) {
  const indent = options.indent ?? "";
  const photoPath = options.photoPath;
  const locale = options.locale;
  const dateStyle = options.compactDates ? "medium" : "long";
  const highlightMissing = options.highlightMissing === true;
  const className = options.className ? ` ${options.className}` : "";
  const strings = locale.strings;
  const familyStatus = renderFamilyStatus(person, locale, highlightMissing);
  const alternateNames = renderAlternateNames(
    person,
    locale,
    `${indent}      `
  );
  const displayName = formatDisplayName(person);
  const avatar = photoPath
    ? `<img src="${escapeAttribute(photoPath)}" alt="${escapeAttribute(displayName)}" />`
    : `<span aria-hidden="true">${escapeHtml(person.initials)}</span>`;
  const portraitClass = photoPath ? " has-photo" : "";

  return `${indent}<article class="person-card${escapeAttribute(className)}" id="person-${escapeAttribute(person.id)}" data-person-id="${escapeAttribute(person.id)}">
${indent}  <div class="portrait${portraitClass}">
${indent}    ${avatar}
${indent}  </div>
${indent}  <div class="person-details">
${indent}    <h3>
${indent}      <span class="given-names">${escapeHtml(person.givenNames)}</span>
${indent}      <span class="surnames">${escapeHtml(person.surnames)}${person.maidenName ? ` <small>(${escapeHtml(person.maidenName)})</small>` : ""}</span>
${indent}    </h3>
${indent}    <dl>
${alternateNames ? `${alternateNames}\n` : ""}${indent}      ${renderFact(strings.occupation, localizeValue(locale.occupations, person.occupation, strings.unknown), "", highlightMissing && person.occupation === "Unknown")}
${indent}      ${renderFact(strings.born, formatBirthDate(person, locale, dateStyle), "", highlightMissing && person.birthDate === "Unknown")}
${indent}      ${renderFact(strings.birthplace, localizeValue(locale.birthPlaces, person.birthPlace, strings.unknown), "", highlightMissing && person.birthPlace === "Unknown")}
${indent}      ${renderLifeStatus(person, locale, dateStyle, highlightMissing)}
${familyStatus ? `${indent}      ${familyStatus}\n` : ""}${indent}    </dl>
${indent}  </div>
${indent}</article>`;
}

export function renderStandalonePage(person, photoPath, locale, options = {}) {
  const displayName = formatDisplayName(person);
  return `<!doctype html>
<html lang="${escapeAttribute(locale.languageTag)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(displayName)}</title>
  <link rel="stylesheet" href="../../styles.css" />
</head>
<body class="standalone-page${options.highlightMissing ? " highlight-missing" : ""}">
  ${renderPersonCard(person, {
    photoPath,
    locale,
    highlightMissing: options.highlightMissing
  })}
</body>
</html>
`;
}

function renderFact(label, value, className = "", missing = false) {
  const classes = [className, missing ? "missing-information" : ""]
    .filter(Boolean)
    .join(" ");
  const attribute = classes ? ` class="${escapeAttribute(classes)}"` : "";
  return `<div${attribute}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function renderAlternateNames(person, locale, indent) {
  if (!person.alternateNames) {
    return "";
  }
  return person.alternateNames
    .map(
      (alternateName) =>
        `${indent}<div class="alternate-name"><dt>${escapeHtml(locale.strings.likelyArabicName)}</dt><dd><bdi lang="${escapeAttribute(alternateName.language)}" dir="rtl">${escapeHtml(alternateName.name)}</bdi> <span>(${escapeHtml(alternateName.transliteration)})</span></dd></div>`
    )
    .join("\n");
}

function renderLifeStatus(person, locale, dateStyle, highlightMissing) {
  const strings = locale.strings;
  if (person.deathDate) {
    return renderFact(
      strings.died,
      formatDate(
        person.deathDate,
        locale.languageTag,
        strings.unknown,
        dateStyle
      ),
      "",
      highlightMissing && person.deathDate === "Unknown"
    );
  }
  if (highlightMissing && person.lifeStatus === "deceased") {
    return renderFact(strings.died, strings.unknown, "", true);
  }

  const status = {
    deceased: strings.deceased,
    living: strings.living,
    unknown: strings.unknown
  }[person.lifeStatus ?? "living"];
  return renderFact(
    strings.status,
    status,
    "",
    highlightMissing && person.lifeStatus === "unknown"
  );
}

function renderFamilyStatus(person, locale, highlightMissing) {
  if (!person.familyStatus) {
    return "";
  }

  const relationship =
    locale.familyRelationships[person.familyStatus.relationship];
  const children = locale.familyChildren[person.familyStatus.children];
  const value = locale.strings.familyStatusFormat
    .replace("{relationship}", relationship)
    .replace("{children}", children);
  return renderFact(
    locale.strings.family,
    value,
    "family-fact",
    highlightMissing &&
      (person.familyStatus.relationship === "unknown" ||
        person.familyStatus.children === "unknown")
  );
}

function localizeValue(dictionary, value, unknown) {
  if (value === "Unknown") {
    return unknown;
  }
  return dictionary[value] ?? value;
}

function formatDate(value, languageTag, unknown, dateStyle = "long") {
  if (value === "Unknown") {
    return unknown;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Intl.DateTimeFormat(languageTag, {
    dateStyle,
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatBirthDate(person, locale, dateStyle) {
  const date = formatDate(
    person.birthDate,
    locale.languageTag,
    locale.strings.unknown,
    dateStyle
  );
  return person.birthDateEstimated
    ? `${date} (${locale.strings.estimated})`
    : date;
}

function formatDisplayName(person) {
  const maidenName = person.maidenName ? ` (${person.maidenName})` : "";
  return `${person.givenNames} ${person.surnames}${maidenName}`;
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}
