import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatResearchNotes,
  validateResearchNotes
} from "./research-notes-data.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const source = "research-notes.json";
const notes = JSON.parse(
  await readFile(path.join(projectRoot, source), "utf8")
);

validateResearchNotes(notes, source);

if (process.argv.includes("--check")) {
  console.log(`Checked ${notes.notes.length} project research note(s).`);
} else {
  console.log(formatResearchNotes(notes));
}
