import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseViewArguments,
  selectViewTree
} from "./views.mjs";
import {
  formatTextTitle,
  renderTextGuardianships,
  renderTextTree
} from "./text-tree.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const args = process.argv.slice(2);
const localeId = argumentValue(args, "--locale") ?? "us-EN";
const minimal = args.includes("--minimal");
const locale = await readJson(
  path.join(projectRoot, "locales", `${localeId}.json`)
);
const completeTree = await readJson(path.join(projectRoot, "tree.json"));
const people = await loadPeople();
const { view, personId } = parseViewArguments(args);
const tree = selectViewTree(view, completeTree, personId);

console.log(formatTextTitle(view, tree, people, locale));
console.log("=".repeat(72));
console.log(
  minimal ? locale.strings.asciiMinimalLegend : locale.strings.asciiLegend
);
console.log("");

for (const line of renderTextTree(tree, people, locale, { minimal })) {
  console.log(line);
}
const guardianshipLines = renderTextGuardianships(tree, people, locale, {
  minimal
});
if (guardianshipLines.length > 0) {
  console.log("");
  for (const line of guardianshipLines) {
    console.log(line);
  }
}

async function loadPeople() {
  const peopleRoot = path.join(projectRoot, "people");
  const entries = await readdir(peopleRoot, { withFileTypes: true });
  const people = new Map();
  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const person = await readJson(
      path.join(peopleRoot, entry.name, "person.json")
    );
    people.set(person.id, person);
  }
  return people;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function argumentValue(cliArgs, name) {
  const index = cliArgs.indexOf(name);
  const value = index === -1 ? null : cliArgs[index + 1];
  return !value || value.startsWith("--") ? null : value;
}
