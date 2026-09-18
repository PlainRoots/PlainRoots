import {
  alternateNameTypeLabel,
  isAlternateNameType
} from "../scripts/alternate-names.mjs";
import {
  isValidPlainRootsDate,
  parsePlainRootsDate
} from "../scripts/date-values.mjs";

const REQUIRED_FIELDS = [
  "id",
  "name",
  "givenNames",
  "surnames",
  "sex",
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
  if (
    !["male", "female", "intersex", "unknown", "not-recorded"].includes(
      person.sex
    )
  ) {
    throw new Error(
      `${source}: "sex" must be "male", "female", "intersex", "unknown", or "not-recorded"`
    );
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
    !isValidPlainRootsDate(person.deathDate)
  ) {
    throw new Error(
      `${source}: "deathDate" must be YYYY, YYYY-MM, YYYY-MM-DD, or null`
    );
  }
  if (
    person.birthDate !== "Unknown" &&
    !isValidPlainRootsDate(person.birthDate)
  ) {
    throw new Error(
      `${source}: "birthDate" must be YYYY, YYYY-MM, YYYY-MM-DD, or "Unknown"`
    );
  }
  if (
    person.deathPlace !== undefined &&
    person.deathPlace !== null &&
    (typeof person.deathPlace !== "string" ||
      person.deathPlace.trim() === "")
  ) {
    throw new Error(`${source}: "deathPlace" must be a non-empty string or null`);
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
        !["name", "language", "type", "evidence"].every(
          (field) =>
            typeof alternateName[field] === "string" &&
            alternateName[field].trim() !== ""
        ) ||
        (alternateName.transliteration !== undefined &&
          (typeof alternateName.transliteration !== "string" ||
            alternateName.transliteration.trim() === "")) ||
        !isAlternateNameType(alternateName.type)
      ) {
        throw new Error(
          `${source}: each alternate name needs a name, language, supported type, optional non-empty transliteration, and descriptive evidence`
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
  const portraitInitials = formatPortraitInitials(person);
  const avatar = photoPath
    ? `<img src="${escapeAttribute(photoPath)}" alt="${escapeAttribute(displayName)}" />`
    : `<span class="portrait-initials" aria-hidden="true">${portraitInitials
        .map(
          (initial) =>
            `<span class="portrait-initial">${escapeHtml(initial)}</span>`
        )
        .join("")}</span>`;
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
${indent}      ${renderFact(strings.born, formatLifeEvent(person.birthDate, person.birthPlace, locale.birthPlaces, locale, person.birthDateEstimated), "life-event", highlightMissing && (person.birthDate === "Unknown" || person.birthPlace === "Unknown"))}
${indent}      ${renderLifeStatus(person, locale, highlightMissing)}
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
    .map((alternateName) => {
      const transliteration = alternateName.transliteration
        ? ` <span>(${escapeHtml(alternateName.transliteration)})</span>`
        : "";
      const label = alternateNameTypeLabel(locale, alternateName.type);
      return `${indent}<div class="alternate-name"><dt>${escapeHtml(label)}</dt><dd><bdi lang="${escapeAttribute(alternateName.language)}" dir="auto">${escapeHtml(alternateName.name)}</bdi>${transliteration}</dd></div>`;
    })
    .join("\n");
}

function renderLifeStatus(person, locale, highlightMissing) {
  const strings = locale.strings;
  if (
    person.deathDate ||
    person.deathPlace ||
    person.lifeStatus === "deceased"
  ) {
    const deathDate = person.deathDate ?? "Unknown";
    const deathPlace = person.deathPlace ?? "Unknown";
    return renderFact(
      strings.died,
      formatLifeEvent(
        deathDate,
        deathPlace,
        locale.deathPlaces,
        locale
      ),
      "life-event",
      highlightMissing &&
        (deathDate === "Unknown" || deathPlace === "Unknown")
    );
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

function formatCardDate(value, languageTag, unknown) {
  if (!value || value === "Unknown") {
    return unknown;
  }
  const parsed = parsePlainRootsDate(value);
  if (!parsed || parsed.precision === "year") {
    return value;
  }
  if (parsed.precision === "month") {
    return new Intl.DateTimeFormat(languageTag, {
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })
      .format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)))
      .replace(/\.$/, "");
  }
  const date = new Date(`${value}T00:00:00Z`);
  const month = new Intl.DateTimeFormat(languageTag, {
    month: "short",
    timeZone: "UTC"
  })
    .format(date)
    .replace(/\.$/, "")
    .slice(0, 3);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function formatLifeEvent(
  dateValue,
  placeValue,
  places,
  locale,
  estimated = false
) {
  const dateUnknown = !dateValue || dateValue === "Unknown";
  const placeUnknown = !placeValue || placeValue === "Unknown";
  if (dateUnknown && placeUnknown) {
    return locale.strings.unknown;
  }

  const date = formatCardDate(
    dateValue,
    locale.languageTag,
    locale.strings.unknownDate
  );
  const displayedDate = estimated && !dateUnknown
    ? `${date} (${locale.strings.estimated})`
    : date;
  const place = localizeValue(
    places,
    placeValue ?? "Unknown",
    locale.strings.unknownLocation
  );
  return locale.strings.lifeEventFormat
    .replace("{date}", displayedDate)
    .replace("{place}", place);
}

function formatDisplayName(person) {
  const maidenName = person.maidenName ? ` (${person.maidenName})` : "";
  return `${person.givenNames} ${person.surnames}${maidenName}`;
}

function formatPortraitInitials(person) {
  return [
    ...firstInitials(person.givenNames, 2),
    ...firstInitials(person.surnames, 2)
  ];
}

function firstInitials(value, limit) {
  return value
    .trim()
    .split(/\s+/u)
    .slice(0, limit)
    .map((namePart) => [...namePart][0]);
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
