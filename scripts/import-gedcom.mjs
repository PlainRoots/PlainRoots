import {
  access,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { convertGedcomToStaging } from "./gedcom/convert.mjs";
import { parseGedcomBuffer } from "./gedcom/parser.mjs";
import { renderImportReport } from "./gedcom/report.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const { inputPath, outputPath, force } = parseArguments(process.argv.slice(2));
const sourceBuffer = await readFile(inputPath);
const document = parseGedcomBuffer(sourceBuffer);
const staging = convertGedcomToStaging(document, path.basename(inputPath));

await prepareOutputDirectory(outputPath, force);
await writeJson(path.join(outputPath, "import-manifest.json"), staging.manifest);
await writeJson(path.join(outputPath, "proposed-tree.json"), staging.proposedTree);
await writeJson(
  path.join(outputPath, "guardianship-candidates.json"),
  staging.guardianshipCandidates
);
await writeJson(
  path.join(outputPath, "pedigree-candidates.json"),
  staging.pedigreeCandidates
);
await writeJson(path.join(outputPath, "diagnostics.json"), staging.issues);
await writeJson(
  path.join(outputPath, "unresolved-records.json"),
  staging.unresolved
);
await mkdir(path.join(outputPath, "people"));
for (const person of staging.people) {
  const reviewRecord = {
    sourcePointer: person.sourcePointer,
    proposedPerson: person.proposedPerson,
    issues: person.issues,
    sourceRecord: person.sourceRecord
  };
  await writeJson(
    path.join(outputPath, "people", `${person.proposedPerson.id}.json`),
    reviewRecord
  );
}
await writeFile(
  path.join(outputPath, "IMPORT-REPORT.md"),
  `${renderImportReport(staging)}\n`,
  "utf8"
);

console.warn("");
console.warn("============================================================");
console.warn("SENSITIVE FAMILY INFORMATION");
console.warn(
  "The GEDCOM import staging package may include full details for living people."
);
console.warn("Review it locally and do not share it without a privacy review.");
console.warn("============================================================");
console.warn("");
console.log(
  `Staged ${staging.people.length} people, ${staging.proposedTree.families.length} families, and ${staging.proposedTree.siblingGroups?.length ?? 0} sibling groups in ${path.relative(projectRoot, outputPath)}.`
);
console.log(
  `Review ${path.relative(projectRoot, path.join(outputPath, "IMPORT-REPORT.md"))}. No PlainRoots family records were changed.`
);

function parseArguments(args) {
  let input = null;
  let output = null;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--input" || argument === "--output") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a path`);
      }
      if (argument === "--input") {
        input = path.resolve(projectRoot, value);
      } else {
        output = path.resolve(projectRoot, value);
      }
      index += 1;
    } else if (argument === "--force") {
      force = true;
    } else {
      throw new Error(`Unknown argument "${argument}"`);
    }
  }

  if (!input) {
    throw new Error("--input is required");
  }
  if (path.extname(input).toLowerCase() !== ".ged") {
    throw new Error("GEDCOM input must use the .ged file extension");
  }

  const stem = safeStem(path.basename(input, path.extname(input)));
  output ??= path.join(projectRoot, ".plainroots-import", stem);
  assertSafeOutputPath(output);
  return { inputPath: input, outputPath: output, force };
}

async function prepareOutputDirectory(outputPath, force) {
  const exists = await fileExists(outputPath);
  if (exists && !force) {
    throw new Error(
      `${path.relative(projectRoot, outputPath)} already exists. Pass --force to replace this staging package.`
    );
  }
  if (exists) {
    await assertExistingStagingPackage(outputPath);
    await rm(outputPath, { recursive: true });
  }
  await mkdir(outputPath, { recursive: true });
}

async function assertExistingStagingPackage(outputPath) {
  const outputStat = await stat(outputPath);
  if (!outputStat.isDirectory()) {
    throw new Error(
      `Refusing to replace ${outputPath}: import staging output must be a directory`
    );
  }
  const manifestPath = path.join(outputPath, "import-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    throw new Error(
      `Refusing to replace ${outputPath}: it is not a recognized PlainRoots import staging package`
    );
  }
  if (
    manifest?.format !== "PlainRoots GEDCOM import staging" ||
    manifest?.formatVersion !== 1
  ) {
    throw new Error(
      `Refusing to replace ${outputPath}: it is not a recognized PlainRoots import staging package`
    );
  }
}

function assertSafeOutputPath(outputPath) {
  const relativePath = path.relative(projectRoot, outputPath);
  if (
    outputPath === projectRoot ||
    outputPath === path.parse(outputPath).root ||
    relativePath === "" ||
    relativePath === ".."
  ) {
    throw new Error("Import staging output must be a specific subdirectory");
  }
}

function safeStem(value) {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "gedcom-import"
  );
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
