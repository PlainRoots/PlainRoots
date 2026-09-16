import { readFile } from "node:fs/promises";
import path from "node:path";
import { ALTERNATE_NAME_TYPES } from "./alternate-names.mjs";

export const CANONICAL_LOCALE_ID = "en-US";
const TRANSLATION_SECTIONS = [
  "strings",
  "alternateNameTypes",
  "familyRelationships",
  "familyChildren",
  "researchNoteStatuses",
  "occupations",
  "birthPlaces",
  "deathPlaces"
];

export async function loadSupportedLocaleIds(projectRoot) {
  const source = "supported-locales.json";
  const manifest = await readJson(path.join(projectRoot, source), source);
  if (
    !manifest ||
    typeof manifest !== "object" ||
    Array.isArray(manifest) ||
    !Array.isArray(manifest.additionalLocales)
  ) {
    throw new Error(
      `${source}: "additionalLocales" must be an array of locale IDs`
    );
  }
  const unsupportedFields = Object.keys(manifest).filter(
    (field) => field !== "additionalLocales"
  );
  if (unsupportedFields.length > 0) {
    throw new Error(
      `${source}: unsupported field "${unsupportedFields[0]}"`
    );
  }

  const additionalLocales = manifest.additionalLocales;
  for (const [index, localeId] of additionalLocales.entries()) {
    validateLocaleId(localeId, `${source}: additionalLocales[${index}]`);
    if (localeId === CANONICAL_LOCALE_ID) {
      throw new Error(
        `${source}: "${CANONICAL_LOCALE_ID}" is always supported and must not appear in "additionalLocales"`
      );
    }
  }
  if (new Set(additionalLocales).size !== additionalLocales.length) {
    throw new Error(`${source}: "additionalLocales" contains duplicates`);
  }

  const localeIds = [CANONICAL_LOCALE_ID, ...additionalLocales];
  const canonicalLocale = await loadLocaleData(
    projectRoot,
    CANONICAL_LOCALE_ID
  );
  for (const localeId of additionalLocales) {
    const locale = await loadLocaleData(projectRoot, localeId);
    validateLocaleParity(locale, canonicalLocale);
  }
  return localeIds;
}

export async function loadLocale(projectRoot, localeId) {
  const supportedLocaleIds = await loadSupportedLocaleIds(projectRoot);
  if (!supportedLocaleIds.includes(localeId)) {
    throw new Error(
      `Unsupported locale "${localeId}". Supported locales: ${supportedLocaleIds.join(", ")}`
    );
  }
  return loadLocaleData(projectRoot, localeId);
}

export function localeSuffix(localeId) {
  return localeId === CANONICAL_LOCALE_ID ? "" : `.${localeId}`;
}

export function validateLocaleId(localeId, source = "locale ID") {
  if (typeof localeId !== "string" || localeId.trim() === "") {
    throw new Error(`${source} must be a non-empty string`);
  }

  let canonicalLocaleId;
  try {
    [canonicalLocaleId] = Intl.getCanonicalLocales(localeId);
  } catch {
    throw new Error(`${source} "${localeId}" is not a valid locale ID`);
  }
  if (canonicalLocaleId !== localeId) {
    throw new Error(
      `${source} "${localeId}" must use canonical casing "${canonicalLocaleId}"`
    );
  }
}

async function loadLocaleData(projectRoot, localeId) {
  const source = path.join("locales", `${localeId}.json`);
  const locale = await readJson(path.join(projectRoot, source), source);
  if (
    !locale ||
    locale.id !== localeId ||
    locale.languageTag !== localeId ||
    TRANSLATION_SECTIONS.some(
      (section) =>
        !locale[section] ||
        typeof locale[section] !== "object" ||
        Array.isArray(locale[section])
    )
  ) {
    throw new Error(
      `${source}: locale data is incomplete or does not match "${localeId}"`
    );
  }
  for (const section of TRANSLATION_SECTIONS) {
    for (const [key, value] of Object.entries(locale[section])) {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(
          `${source}: "${section}.${key}" must be a non-empty string`
        );
      }
    }
  }
  validateAlternateNameTypeLabels(locale, source);
  return locale;
}

function validateAlternateNameTypeLabels(locale, source) {
  const labels = locale.alternateNameTypes;
  const labelKeys = new Set(Object.keys(labels));
  const missingType = ALTERNATE_NAME_TYPES.find(
    (type) => !labelKeys.has(type)
  );
  if (missingType) {
    throw new Error(
      `${source}: missing required "alternateNameTypes.${missingType}" translation`
    );
  }
  const supportedTypes = new Set(ALTERNATE_NAME_TYPES);
  const unsupportedType = [...labelKeys].find(
    (type) => !supportedTypes.has(type)
  );
  if (unsupportedType) {
    throw new Error(
      `${source}: unsupported "alternateNameTypes.${unsupportedType}" translation`
    );
  }
}

function validateLocaleParity(locale, canonicalLocale) {
  const source = path.join("locales", `${locale.id}.json`);
  for (const section of TRANSLATION_SECTIONS) {
    const canonicalKeys = Object.keys(canonicalLocale[section]);
    const localeKeys = new Set(Object.keys(locale[section]));
    const missingKey = canonicalKeys.find((key) => !localeKeys.has(key));
    if (missingKey) {
      throw new Error(
        `${source}: missing required "${section}.${missingKey}" translation`
      );
    }
    const canonicalKeySet = new Set(canonicalKeys);
    const unsupportedKey = [...localeKeys].find(
      (key) => !canonicalKeySet.has(key)
    );
    if (unsupportedKey) {
      throw new Error(
        `${source}: unsupported "${section}.${unsupportedKey}" translation`
      );
    }
  }
}

async function readJson(filePath, source) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${source}: invalid or missing JSON (${error.message})`);
  }
}
