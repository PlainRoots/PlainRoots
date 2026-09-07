import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countNarrativeFields,
  countPeopleWithNarratives,
  loadLocalizedPeople,
  loadLocalizedProjectResearchNotes,
  localizeResearchNoteStatus
} from "./narrative-translations.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const localeId = "mx-ES";
const people = await loadLocalizedPeople(projectRoot, localeId);
const projectNotes = await loadLocalizedProjectResearchNotes(
  projectRoot,
  localeId
);
const locale = JSON.parse(
  await readFile(path.join(projectRoot, "locales", `${localeId}.json`), "utf8")
);

for (const note of projectNotes.notes) {
  localizeResearchNoteStatus(note.status, locale);
}

console.log(
  `Checked ${localeId} translations for ${countNarrativeFields(people)} narrative field(s) across ${countPeopleWithNarratives(people)} people and ${projectNotes.notes.length} project research note(s).`
);
