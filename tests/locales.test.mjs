import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CANONICAL_LOCALE_ID,
  loadLocale,
  loadSupportedLocaleIds
} from "../scripts/locales.mjs";
import { ALTERNATE_NAME_TYPES } from "../scripts/alternate-names.mjs";
import { loadLocalizedPeople } from "../scripts/narrative-translations.mjs";

test("always includes English before configured additional locales", async (context) => {
  const projectRoot = await createProject(context, ["es-MX"]);
  await writeLocale(projectRoot, "es-MX");

  assert.deepEqual(await loadSupportedLocaleIds(projectRoot), [
    CANONICAL_LOCALE_ID,
    "es-MX"
  ]);
});

test("rejects English and non-canonical locale IDs in the manifest", async (context) => {
  const projectRoot = await createProject(context, ["en-US"]);
  await assert.rejects(
    loadSupportedLocaleIds(projectRoot),
    /always supported/
  );

  await writeJson(path.join(projectRoot, "supported-locales.json"), {
    additionalLocales: ["es-mx"]
  });
  await assert.rejects(
    loadSupportedLocaleIds(projectRoot),
    /canonical casing "es-MX"/
  );
});

test("does not generate an inactive locale", async (context) => {
  const projectRoot = await createProject(context, []);
  await writeLocale(projectRoot, "es-MX");

  await assert.rejects(
    loadLocale(projectRoot, "es-MX"),
    /Unsupported locale "es-MX"/
  );
});

test("requires active locale resources to match English keys", async (context) => {
  const projectRoot = await createProject(context, ["es-MX"]);
  await writeLocale(projectRoot, "en-US", { greeting: "Hello" });
  await writeLocale(projectRoot, "es-MX");

  await assert.rejects(
    loadSupportedLocaleIds(projectRoot),
    /missing required "strings.greeting" translation/
  );
});

test("requires a label for every alternate-name type", async (context) => {
  const projectRoot = await createProject(context, ["es-MX"]);
  const incompleteLabels = alternateNameTypeLabels();
  delete incompleteLabels["likely-original-spelling"];
  await writeLocale(projectRoot, "es-MX", {}, incompleteLabels);

  await assert.rejects(
    loadSupportedLocaleIds(projectRoot),
    /missing required "alternateNameTypes\.likely-original-spelling" translation/
  );
});

test("preserves structurally valid inactive translations without requiring new fields", async (context) => {
  const projectRoot = await createProject(context, []);
  const personRoot = path.join(projectRoot, "people", "example");
  await mkdir(personRoot, { recursive: true });
  await writeJson(path.join(personRoot, "person.json"), {
    id: "example",
    name: "Example Person",
    givenNames: "Example",
    surnames: "Person",
    maidenName: null,
    initials: "EP",
    occupation: "Unknown",
    birthDate: "Unknown",
    birthPlace: "Unknown",
    deathDate: null,
    photo: null,
    remarks: "Existing English remarks",
    researchNotes: "New English research notes"
  });
  await writeJson(path.join(personRoot, "translations.json"), {
    "es-MX": {
      remarks: "Comentarios existentes en español"
    }
  });

  const people = await loadLocalizedPeople(projectRoot, "en-US");
  assert.equal(people.get("example").researchNotes, "New English research notes");
});

test("requires every current field when a locale is active", async (context) => {
  const projectRoot = await createProject(context, ["es-MX"]);
  await writeLocale(projectRoot, "es-MX");
  const personRoot = path.join(projectRoot, "people", "example");
  await mkdir(personRoot, { recursive: true });
  await writeJson(path.join(personRoot, "person.json"), {
    id: "example",
    name: "Example Person",
    givenNames: "Example",
    surnames: "Person",
    maidenName: null,
    initials: "EP",
    occupation: "Unknown",
    birthDate: "Unknown",
    birthPlace: "Unknown",
    deathDate: null,
    photo: null,
    remarks: "English remarks",
    researchNotes: "English research notes"
  });
  await writeJson(path.join(personRoot, "translations.json"), {
    "es-MX": {
      remarks: "Comentarios en español"
    }
  });

  await assert.rejects(
    loadLocalizedPeople(projectRoot, "es-MX"),
    /missing required es-MX translation for "researchNotes"/
  );
});

test("rejects malformed inactive translations", async (context) => {
  const projectRoot = await createProject(context, []);
  const personRoot = path.join(projectRoot, "people", "example");
  await mkdir(personRoot, { recursive: true });
  await writeJson(path.join(personRoot, "person.json"), {
    id: "example",
    name: "Example Person",
    givenNames: "Example",
    surnames: "Person",
    maidenName: null,
    initials: "EP",
    occupation: "Unknown",
    birthDate: "Unknown",
    birthPlace: "Unknown",
    deathDate: null,
    photo: null,
    remarks: "English remarks"
  });
  await writeJson(path.join(personRoot, "translations.json"), {
    "es-MX": {
      remarks: " "
    }
  });

  await assert.rejects(
    loadLocalizedPeople(projectRoot, "en-US"),
    /must be a non-empty string/
  );
});

async function createProject(context, additionalLocales) {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "family-locales-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  await mkdir(path.join(projectRoot, "locales"), { recursive: true });
  await mkdir(path.join(projectRoot, "people"), { recursive: true });
  await writeJson(path.join(projectRoot, "supported-locales.json"), {
    additionalLocales
  });
  await writeLocale(projectRoot, CANONICAL_LOCALE_ID);
  return projectRoot;
}

async function writeLocale(
  projectRoot,
  localeId,
  strings = {},
  alternateNameTypes = alternateNameTypeLabels()
) {
  await writeJson(path.join(projectRoot, "locales", `${localeId}.json`), {
    id: localeId,
    languageTag: localeId,
    strings,
    alternateNameTypes,
    familyRelationships: {},
    familyChildren: {},
    researchNoteStatuses: {},
    occupations: {},
    birthPlaces: {},
    deathPlaces: {}
  });
}

function alternateNameTypeLabels() {
  return Object.fromEntries(
    ALTERNATE_NAME_TYPES.map((type) => [type, `Label for ${type}`])
  );
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
