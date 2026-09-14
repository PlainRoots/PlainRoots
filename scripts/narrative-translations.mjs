import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { validatePerson } from "../templates/person-card-html.mjs";
import { validatePersonStories } from "./person-stories.mjs";
import {
  RESEARCH_NOTE_STATUSES,
  validateResearchNotes
} from "./research-notes-data.mjs";
import {
  CANONICAL_LOCALE_ID,
  loadSupportedLocaleIds,
  validateLocaleId
} from "./locales.mjs";

const PERSON_NARRATIVE_FIELDS = ["remarks", "researchNotes"];
const PERSON_TRANSLATION_FIELDS = [
  ...PERSON_NARRATIVE_FIELDS,
  "alternateNames"
];
const PROJECT_NOTE_FIELDS = ["title", "note", "implications", "provenance"];

export async function loadLocalizedPeople(projectRoot, localeId) {
  const supportedLocaleIds = await loadSupportedLocaleIds(projectRoot);
  validateSupportedLocale(localeId, supportedLocaleIds);

  const peopleRoot = path.join(projectRoot, "people");
  const entries = await readdir(peopleRoot, { withFileTypes: true });
  const people = new Map();
  const translationsByPerson = new Map();

  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const personPath = path.join(peopleRoot, entry.name, "person.json");
    const translationPath = path.join(
      peopleRoot,
      entry.name,
      "translations.json"
    );
    const hasPerson = await fileExists(personPath);
    const hasTranslations = await fileExists(translationPath);

    if (!hasPerson) {
      if (hasTranslations) {
        throw new Error(
          `${relative(projectRoot, translationPath)}: unknown person ID "${entry.name}"`
        );
      }
      throw new Error(
        `${relative(projectRoot, personPath)}: missing person source file`
      );
    }

    const person = await readJson(personPath, projectRoot);
    validatePerson(person, relative(projectRoot, personPath));
    validatePersonStories(person, relative(projectRoot, personPath));
    if (person.id !== entry.name) {
      throw new Error(
        `${relative(projectRoot, personPath)}: person ID "${person.id}" does not match directory "${entry.name}"`
      );
    }
    if (people.has(person.id)) {
      throw new Error(`Duplicate person ID "${person.id}"`);
    }

    people.set(person.id, person);
    if (hasTranslations) {
      const translationSource = relative(projectRoot, translationPath);
      const translations = await readJson(translationPath, projectRoot);
      validateTranslationRoot(translations, translationSource);
      for (const [translationLocaleId, translation] of Object.entries(
        translations
      )) {
        validatePersonTranslationShape(
          translation,
          translationLocaleId,
          translationSource
        );
      }
      translationsByPerson.set(person.id, {
        source: translationSource,
        translations
      });
    }
  }

  if (localeId === CANONICAL_LOCALE_ID) {
    return people;
  }

  const localizedPeople = new Map();
  for (const [personId, person] of people) {
    const sourceFields = populatedTranslationFields(person);
    const translationData = translationsByPerson.get(personId);

    if (sourceFields.length === 0) {
      if (translationData?.translations[localeId]) {
        throw new Error(
          `${translationData.source}: "${localeId}" translations are not allowed because "${personId}" has no populated translatable fields`
        );
      }
      localizedPeople.set(personId, person);
      continue;
    }

    if (!translationData?.translations[localeId]) {
      throw new Error(
        `people/${personId}/translations.json: missing required ${localeId} translations for ${sourceFields.join(", ")}`
      );
    }

    validatePersonTranslations(
      translationData.translations,
      person,
      localeId,
      translationData.source
    );
    const localizedPerson = {
      ...person,
      ...translationData.translations[localeId]
    };
    if (translationData.translations[localeId].alternateNames) {
      localizedPerson.alternateNames = person.alternateNames.map(
        (alternateName, index) => ({
          ...alternateName,
          evidence:
            translationData.translations[localeId].alternateNames[index]
              .evidence
        })
      );
    }
    localizedPeople.set(personId, localizedPerson);
  }

  return localizedPeople;
}

export async function loadLocalizedProjectResearchNotes(
  projectRoot,
  localeId
) {
  const supportedLocaleIds = await loadSupportedLocaleIds(projectRoot);
  validateSupportedLocale(localeId, supportedLocaleIds);

  const sourcePath = path.join(projectRoot, "research-notes.json");
  const source = await readJson(sourcePath, projectRoot);
  validateResearchNotes(source, relative(projectRoot, sourcePath));

  const translationPath = path.join(
    projectRoot,
    "research-notes.translations.json"
  );
  if (!(await fileExists(translationPath))) {
    if (localeId === CANONICAL_LOCALE_ID) {
      return source;
    }
    throw new Error(
      `${relative(projectRoot, translationPath)}: missing required ${localeId} project-note translations`
    );
  }

  const translations = await readJson(translationPath, projectRoot);
  const translationSource = relative(projectRoot, translationPath);
  validateTranslationRoot(translations, translationSource);
  for (const [translationLocaleId, translation] of Object.entries(
    translations
  )) {
    validateProjectNoteTranslationShape(
      translation,
      translationLocaleId,
      translationSource
    );
  }

  if (localeId === CANONICAL_LOCALE_ID) {
    return source;
  }

  validateProjectNoteTranslations(
    translations,
    source,
    localeId,
    translationSource
  );

  return {
    ...source,
    notes: source.notes.map((note) => ({
      ...note,
      ...translations[localeId][note.id]
    }))
  };
}

export function localizeResearchNoteStatus(status, localeData) {
  const labels = localeData.researchNoteStatuses;
  if (!labels || typeof labels !== "object") {
    throw new Error(
      `locales/${localeData.id}.json: "researchNoteStatuses" must be an object`
    );
  }

  const unknownStatuses = Object.keys(labels).filter(
    (candidate) => !RESEARCH_NOTE_STATUSES.has(candidate)
  );
  if (unknownStatuses.length > 0) {
    throw new Error(
      `locales/${localeData.id}.json: unsupported research-note status "${unknownStatuses[0]}"`
    );
  }

  for (const requiredStatus of RESEARCH_NOTE_STATUSES) {
    if (
      typeof labels[requiredStatus] !== "string" ||
      labels[requiredStatus].trim() === ""
    ) {
      throw new Error(
        `locales/${localeData.id}.json: missing non-empty label for research-note status "${requiredStatus}"`
      );
    }
  }

  return labels[status];
}

export function countNarrativeFields(people) {
  return [...people.values()].reduce(
    (count, person) =>
      count +
      populatedNarrativeFields(person).length +
      (person.alternateNames?.length ?? 0),
    0
  );
}

export function countPeopleWithNarratives(people) {
  return [...people.values()].filter(
    (person) => populatedTranslationFields(person).length > 0
  ).length;
}

function validatePersonTranslations(
  translations,
  person,
  localeId,
  source
) {
  const localeTranslations = translations[localeId];
  if (!localeTranslations) {
    throw new Error(
      `${source}: missing required locale translation "${localeId}"`
    );
  }
  if (
    typeof localeTranslations !== "object" ||
    Array.isArray(localeTranslations)
  ) {
    throw new Error(`${source}: "${localeId}" must be an object`);
  }

  const sourceFields = populatedTranslationFields(person);
  for (const field of Object.keys(localeTranslations)) {
    if (!PERSON_TRANSLATION_FIELDS.includes(field)) {
      throw new Error(
        `${source}: unsupported translated person field "${field}"`
      );
    }
    if (!sourceFields.includes(field)) {
      throw new Error(
        `${source}: translated field "${field}" is absent or empty in person.json`
      );
    }
  }

  for (const field of sourceFields) {
    if (!Object.hasOwn(localeTranslations, field)) {
      throw new Error(
        `${source}: missing required ${localeId} translation for "${field}"`
      );
    }
    if (field === "alternateNames") {
      validateAlternateNameTranslations(
        localeTranslations[field],
        person.alternateNames,
        localeId,
        source
      );
    } else if (
      typeof localeTranslations[field] !== "string" ||
      localeTranslations[field].trim() === ""
    ) {
      throw new Error(
        `${source}: "${localeId}.${field}" must be a non-empty string`
      );
    }
  }
}

function validateProjectNoteTranslations(
  translations,
  sourceNotes,
  localeId,
  source
) {
  const localeTranslations = translations[localeId];
  if (
    !localeTranslations ||
    typeof localeTranslations !== "object" ||
    Array.isArray(localeTranslations)
  ) {
    throw new Error(
      `${source}: missing required locale translation object "${localeId}"`
    );
  }

  const notesById = new Map(sourceNotes.notes.map((note) => [note.id, note]));
  for (const noteId of Object.keys(localeTranslations)) {
    if (!notesById.has(noteId)) {
      throw new Error(`${source}: unknown project note ID "${noteId}"`);
    }
  }

  for (const note of sourceNotes.notes) {
    const translation = localeTranslations[note.id];
    if (!translation) {
      throw new Error(
        `${source}: missing required ${localeId} translation for project note "${note.id}"`
      );
    }
    if (typeof translation !== "object" || Array.isArray(translation)) {
      throw new Error(
        `${source}: "${localeId}.${note.id}" must be an object`
      );
    }

    for (const field of Object.keys(translation)) {
      if (!PROJECT_NOTE_FIELDS.includes(field)) {
        throw new Error(
          `${source}: unsupported project-note translation field "${field}" for "${note.id}"`
        );
      }
    }
    for (const field of PROJECT_NOTE_FIELDS) {
      if (!Object.hasOwn(translation, field)) {
        throw new Error(
          `${source}: missing required ${localeId} translation for "${note.id}.${field}"`
        );
      }
    }

    for (const field of ["title", "note", "provenance"]) {
      if (
        typeof translation[field] !== "string" ||
        translation[field].trim() === ""
      ) {
        throw new Error(
          `${source}: "${localeId}.${note.id}.${field}" must be a non-empty string`
        );
      }
    }
    if (
      !Array.isArray(translation.implications) ||
      translation.implications.some(
        (implication) =>
          typeof implication !== "string" || implication.trim() === ""
      )
    ) {
      throw new Error(
        `${source}: "${localeId}.${note.id}.implications" must contain non-empty strings`
      );
    }
    if (translation.implications.length !== note.implications.length) {
      throw new Error(
        `${source}: "${localeId}.${note.id}.implications" has ${translation.implications.length} item(s); expected ${note.implications.length}`
      );
    }
  }
}

function validateTranslationRoot(translations, source) {
  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  ) {
    throw new Error(
      `${source}: translations must be an object indexed by locale`
    );
  }
  for (const localeId of Object.keys(translations)) {
    validateLocaleId(localeId, `${source}: translation locale`);
    if (localeId === CANONICAL_LOCALE_ID) {
      throw new Error(
        `${source}: canonical English content belongs in the source record, not "${localeId}" translations`
      );
    }
  }
}

function validateSupportedLocale(localeId, supportedLocaleIds) {
  if (!supportedLocaleIds.includes(localeId)) {
    throw new Error(
      `Unsupported narrative translation locale "${localeId}". Supported locales: ${supportedLocaleIds.join(", ")}`
    );
  }
}

function validatePersonTranslationShape(translation, localeId, source) {
  if (
    !translation ||
    typeof translation !== "object" ||
    Array.isArray(translation)
  ) {
    throw new Error(`${source}: "${localeId}" must be an object`);
  }
  for (const [field, value] of Object.entries(translation)) {
    if (!PERSON_TRANSLATION_FIELDS.includes(field)) {
      throw new Error(
        `${source}: unsupported translated person field "${field}"`
      );
    }
    if (field === "alternateNames") {
      validateAlternateNameTranslationShape(value, localeId, source);
    } else if (typeof value !== "string" || value.trim() === "") {
      throw new Error(
        `${source}: "${localeId}.${field}" must be a non-empty string`
      );
    }
  }
}

function validateProjectNoteTranslationShape(translation, localeId, source) {
  if (
    !translation ||
    typeof translation !== "object" ||
    Array.isArray(translation)
  ) {
    throw new Error(`${source}: "${localeId}" must be an object`);
  }
  for (const [noteId, note] of Object.entries(translation)) {
    if (!note || typeof note !== "object" || Array.isArray(note)) {
      throw new Error(`${source}: "${localeId}.${noteId}" must be an object`);
    }
    for (const [field, value] of Object.entries(note)) {
      if (!PROJECT_NOTE_FIELDS.includes(field)) {
        throw new Error(
          `${source}: unsupported project-note translation field "${field}" for "${noteId}"`
        );
      }
      if (field === "implications") {
        if (
          !Array.isArray(value) ||
          value.some((item) => typeof item !== "string" || item.trim() === "")
        ) {
          throw new Error(
            `${source}: "${localeId}.${noteId}.implications" must contain non-empty strings`
          );
        }
      } else if (typeof value !== "string" || value.trim() === "") {
        throw new Error(
          `${source}: "${localeId}.${noteId}.${field}" must be a non-empty string`
        );
      }
    }
  }
}

function populatedNarrativeFields(person) {
  return PERSON_NARRATIVE_FIELDS.filter(
    (field) =>
      typeof person[field] === "string" && person[field].trim() !== ""
  );
}

function populatedTranslationFields(person) {
  const fields = populatedNarrativeFields(person);
  if (person.alternateNames) {
    fields.push("alternateNames");
  }
  return fields;
}

function validateAlternateNameTranslations(
  translations,
  alternateNames,
  localeId,
  source
) {
  if (!Array.isArray(translations)) {
    throw new Error(
      `${source}: "${localeId}.alternateNames" must be an array`
    );
  }
  if (translations.length !== alternateNames.length) {
    throw new Error(
      `${source}: "${localeId}.alternateNames" has ${translations.length} item(s); expected ${alternateNames.length}`
    );
  }
  for (const [index, translation] of translations.entries()) {
    validateAlternateNameTranslation(translation, localeId, source, index);
  }
}

function validateAlternateNameTranslationShape(translations, localeId, source) {
  if (!Array.isArray(translations)) {
    throw new Error(
      `${source}: "${localeId}.alternateNames" must be an array`
    );
  }
  for (const [index, translation] of translations.entries()) {
    validateAlternateNameTranslation(translation, localeId, source, index);
  }
}

function validateAlternateNameTranslation(
  translation,
  localeId,
  source,
  index
) {
  if (
    !translation ||
    typeof translation !== "object" ||
    Array.isArray(translation) ||
    Object.keys(translation).some((field) => field !== "evidence") ||
    typeof translation.evidence !== "string" ||
    translation.evidence.trim() === ""
  ) {
    throw new Error(
      `${source}: "${localeId}.alternateNames[${index}]" must contain only a non-empty evidence string`
    );
  }
}

async function readJson(filePath, projectRoot) {
  const source = relative(projectRoot, filePath);
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${source}: invalid JSON (${error.message})`);
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function relative(projectRoot, filePath) {
  return path.relative(projectRoot, filePath);
}
