import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializeGedcom } from "./gedcom.mjs";
import { CANONICAL_LOCALE_ID } from "./locales.mjs";
import { loadLocalizedPeople } from "./narrative-translations.mjs";
import { validateReferences, validateTree } from "./tree-data.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const { outputPath, force } = parseArguments(process.argv.slice(2));
const tree = JSON.parse(
  await readFile(path.join(projectRoot, "tree.json"), "utf8")
);
const people = await loadLocalizedPeople(projectRoot, CANONICAL_LOCALE_ID);

validateTree(tree);
validateReferences(tree, people);

const { content, warnings, stats } = serializeGedcom({
  tree,
  people,
  fileName: path.basename(outputPath)
});

try {
  await writeFile(outputPath, content, {
    encoding: "utf8",
    flag: force ? "w" : "wx"
  });
} catch (error) {
  if (error?.code === "EEXIST") {
    throw new Error(
      `${path.relative(projectRoot, outputPath)} already exists. Pass --force to replace it.`
    );
  }
  throw error;
}

console.warn("");
console.warn("============================================================");
console.warn("SENSITIVE FAMILY INFORMATION");
console.warn(
  "This GEDCOM file includes full details for living people. Review it before sharing."
);
console.warn("============================================================");
console.warn("");

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

console.log(
  `Exported ${stats.individuals} individuals and ${stats.families} family records to ${path.relative(projectRoot, outputPath)}.`
);

function parseArguments(args) {
  let output = path.join(projectRoot, "family-tree.ged");
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--force") {
      force = true;
    } else if (argument === "--output") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--output requires a file path");
      }
      output = path.resolve(projectRoot, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument "${argument}"`);
    }
  }

  if (path.extname(output).toLowerCase() !== ".ged") {
    throw new Error("GEDCOM output must use the .ged file extension");
  }

  return { outputPath: output, force };
}
