import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countNarrativeFields,
  countPeopleWithNarratives,
  loadLocalizedPeople,
  loadLocalizedProjectResearchNotes,
  localizeResearchNoteStatus
} from "./narrative-translations.mjs";
import {
  CANONICAL_LOCALE_ID,
  loadLocale,
  loadSupportedLocaleIds
} from "./locales.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const localeIds = await loadSupportedLocaleIds(projectRoot);
await loadLocalizedPeople(projectRoot, CANONICAL_LOCALE_ID);
await loadLocalizedProjectResearchNotes(projectRoot, CANONICAL_LOCALE_ID);

for (const localeId of localeIds.filter(
  (candidate) => candidate !== CANONICAL_LOCALE_ID
)) {
  const people = await loadLocalizedPeople(projectRoot, localeId);
  const projectNotes = await loadLocalizedProjectResearchNotes(
    projectRoot,
    localeId
  );
  const locale = await loadLocale(projectRoot, localeId);

  for (const note of projectNotes.notes) {
    localizeResearchNoteStatus(note.status, locale);
  }

  console.log(
    `Checked ${localeId} translations for ${countNarrativeFields(people)} narrative field(s) across ${countPeopleWithNarratives(people)} people and ${projectNotes.notes.length} project research note(s).`
  );
}
