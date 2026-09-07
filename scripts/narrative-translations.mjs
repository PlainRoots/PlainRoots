import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { validatePerson } from "../templates/person-card-html.mjs";
import {
  RESEARCH_NOTE_STATUSES,
  validateResearchNotes
} from "./research-notes-data.mjs";

const CANONICAL_LOCALE = "us-EN";
const TRANSLATED_LOCALES = new Set(["mx-ES"]);
const PERSON_NARRATIVE_FIELDS = ["remarks", "researchNotes"];
const PERSON_TRANSLATION_FIELDS = [
  ...PERSON_NARRATIVE_FIELDS,
  "alternateNames"
];
const PROJECT_NOTE_FIELDS = ["title", "note", "implications", "provenance"];

export async function loadLocalizedPeople(projectRoot, localeId) {
  validateLocale(localeId);

  const peopleRoot = path.join(projectRoot, "people");
  const entries = await readdir(peopleRoot, { withFileTypes: true });
  const people = new Map();
  const translationPaths = new Map();

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
      translationPaths.set(person.id, translationPath);
    }
  }

  if (localeId === CANONICAL_LOCALE) {
    return people;
  }

  const localizedPeople = new Map();
  for (const [personId, person] of people) {
    const sourceFields = populatedTranslationFields(person);
    const translationPath = translationPaths.get(personId);

    if (sourceFields.length === 0) {
      if (translationPath) {
        throw new Error(
          `${relative(projectRoot, translationPath)}: translations are not allowed because "${personId}" has no populated translatable fields`
        );
      }
      localizedPeople.set(personId, person);
      continue;
    }

    if (!translationPath) {
      throw new Error(
        `people/${personId}/translations.json: missing required ${localeId} translations for ${sourceFields.join(", ")}`
      );
    }

    const translations = await readJson(translationPath, projectRoot);
    validatePersonTranslations(
      translations,
      person,
      localeId,
      relative(projectRoot, translationPath)
    );
    const localizedPerson = {
      ...person,
      ...translations[localeId]
    };
    if (translations[localeId].alternateNames) {
      localizedPerson.alternateNames = person.alternateNames.map(
        (alternateName, index) => ({
          ...alternateName,
          evidence: translations[localeId].alternateNames[index].evidence
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
  validateLocale(localeId);

  const sourcePath = path.join(projectRoot, "research-notes.json");
  const source = await readJson(sourcePath, projectRoot);
  validateResearchNotes(source, relative(projectRoot, sourcePath));

  if (localeId === CANONICAL_LOCALE) {
    return source;
  }

  const translationPath = path.join(
    projectRoot,
    "research-notes.translations.json"
  );
  if (!(await fileExists(translationPath))) {
    throw new Error(
      `${relative(projectRoot, translationPath)}: missing required ${localeId} project-note translations`
    );
  }

  const translations = await readJson(translationPath, projectRoot);
  validateProjectNoteTranslations(
    translations,
    source,
    localeId,
    relative(projectRoot, translationPath)
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
  validateTranslationRoot(translations, source);
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
  validateTranslationRoot(translations, source);
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
    if (!TRANSLATED_LOCALES.has(localeId)) {
      throw new Error(`${source}: unsupported translation locale "${localeId}"`);
    }
  }
}

function validateLocale(localeId) {
  if (localeId !== CANONICAL_LOCALE && !TRANSLATED_LOCALES.has(localeId)) {
    throw new Error(`Unsupported narrative translation locale "${localeId}"`);
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
