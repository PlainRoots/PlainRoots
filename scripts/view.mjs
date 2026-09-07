import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { views } from "./views.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const localeId = argumentValue(process.argv.slice(2), "--locale") ?? "us-EN";
const highlightMissing = process.argv.includes("--highlight-missing");
const locale = JSON.parse(
  await readFile(path.join(projectRoot, "locales", `${localeId}.json`), "utf8")
);
const strings = locale.strings;
const prompt = createInterface({ input, output });

try {
  console.log(`\n${strings.cliWelcome}\n`);
  console.log(`${strings.cliAvailableViews}:`);
  views.forEach((view, index) => {
    console.log(`  ${index + 1}. ${strings[view.nameKey]}`);
    console.log(`     ${strings[view.descriptionKey]}`);
  });

  const view = await chooseNumber(`\n${strings.cliChooseView} `, views);
  let personId = null;

  if (view.requiresPerson) {
    const people = await loadPeople();
    console.log(`\n${strings.cliAvailablePeople}:`);
    people.forEach((person, index) => {
      console.log(`  ${index + 1}. ${person.name} (${person.id})`);
    });
    personId = (
      await chooseNumber(`\n${strings.cliChoosePerson} `, people)
    ).id;
  }

  console.log(
    `\n${formatMessage(strings.cliGenerating, {
      view: strings[view.nameKey]
    })}\n`
  );
  for (const localeId of ["us-EN", "mx-ES"]) {
    const args = [
      path.join(projectRoot, "scripts", "render.mjs"),
      "--view",
      view.id,
      "--locale",
      localeId
    ];
    if (personId) {
      args.push("--person", personId);
    }
    if (highlightMissing) {
      args.push("--highlight-missing");
    }
    await run(process.execPath, args);
  }
  console.log(`\n${strings.cliDone}`);
} finally {
  prompt.close();
}

async function chooseNumber(question, choices) {
  while (true) {
    const answer = (await prompt.question(question)).trim();
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && choices[index]) {
      return choices[index];
    }
    console.log(formatMessage(strings.cliEnterNumber, { count: choices.length }));
  }
}

async function loadPeople() {
  const peopleRoot = path.join(projectRoot, "people");
  const entries = await readdir(peopleRoot, { withFileTypes: true });
  const people = [];

  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const person = JSON.parse(
      await readFile(path.join(peopleRoot, entry.name, "person.json"), "utf8")
    );
    people.push({ id: person.id, name: person.name });
  }

  return people.sort((left, right) => left.name.localeCompare(right.name));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(command)} exited with code ${code}`));
      }
    });
  });
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  const value = index === -1 ? null : args[index + 1];
  return !value || value.startsWith("--") ? null : value;
}

function formatMessage(message, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message
  );
}
