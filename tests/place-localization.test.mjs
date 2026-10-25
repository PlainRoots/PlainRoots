import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { loadLocale } from "../scripts/locales.mjs";
import { formatRelationshipEvents } from "../scripts/relationship-events.mjs";
import { renderTextTree } from "../scripts/text-tree.mjs";
import { renderPersonCard } from "../templates/person-card-html.mjs";

const run = promisify(execFile);

test("reuses one place entry across cards, text views, and printable event facts", async (context) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "plainroots-places-"));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));
  for (const directory of ["scripts", "templates"]) {
    await cp(
      new URL(`../${directory}/`, import.meta.url),
      path.join(projectRoot, directory),
      { recursive: true }
    );
  }
  await mkdir(path.join(projectRoot, "locales"));
  await writeJson(path.join(projectRoot, "supported-locales.json"), {
    additionalLocales: ["es-MX"]
  });
  await writeJson(path.join(projectRoot, "research-notes.json"), { notes: [] });
  await writeJson(path.join(projectRoot, "research-notes.translations.json"), {
    "es-MX": {}
  });

  const place = "Example city";
  const people = new Map(
    ["first", "second"].map((id) => [
      id,
      {
        id,
        name: `${id} Example`,
        givenNames: id,
        surnames: "Example",
        sex: "unknown",
        maidenName: null,
        initials: "EX",
        occupation: "Unknown",
        birthDate: "1900",
        birthPlace: place,
        lifeStatus: "deceased",
        deathDate: "1980",
        deathPlace: place,
        photo: null
      }
    ])
  );
  const events = [{ type: "married", date: "1920", place }];
  const tree = {
    title: "Example family",
    people: [...people.keys()],
    families: [{
      id: "example",
      partners: [...people.keys()],
      children: [],
      relationship: "married",
      relationshipEvents: events
    }]
  };
  await writeJson(path.join(projectRoot, "tree.json"), tree);
  for (const [id, person] of people) {
    const directory = path.join(projectRoot, "people", id);
    await mkdir(directory, { recursive: true });
    await writeJson(path.join(directory, "person.json"), person);
  }

  const locales = new Map();
  for (const [id, translation] of [
    ["en-US", "Example city"],
    ["es-MX", "Ciudad de ejemplo"]
  ]) {
    const locale = JSON.parse(
      await readFile(new URL(`../locales/${id}.json`, import.meta.url), "utf8")
    );
    locale.places = { [place]: translation };
    await writeJson(path.join(projectRoot, "locales", `${id}.json`), locale);
    locales.set(id, translation);
  }

  for (const [id, translation] of locales) {
    const locale = await loadLocale(projectRoot, id);
    const card = renderPersonCard(people.get("first"), { locale });
    assert.equal(card.split(translation).length - 1, 2);

    const text = renderTextTree(tree, people, locale).join("\n");
    assert.equal(text.split(`[${translation}]`).length - 1, 2);
    assert.ok(
      formatRelationshipEvents(events, locale, { includePlaces: true })
        .includes(translation)
    );
    assert.ok(
      !formatRelationshipEvents(events, locale).includes(translation)
    );

    await run(process.execPath, [
      path.join(projectRoot, "scripts", "print-report.mjs"),
      "--locale", id
    ]);
    const report = await readFile(
      path.join(projectRoot, `print-report${id === "en-US" ? "" : `.${id}`}.html`),
      "utf8"
    );
    assert.equal(report.split(translation).length - 1, 6);
    if (translation !== place) {
      assert.ok(!card.includes(place));
      assert.ok(!text.includes(place));
      assert.ok(!report.includes(place));
    }

    await run(process.execPath, [
      path.join(projectRoot, "scripts", "generate.mjs"),
      "--view", "immediate-family", "--person", "first", "--locale", id
    ]);
    await run(process.execPath, [
      path.join(projectRoot, "scripts", "generate.mjs"),
      "--view", "immediate-family", "--person", "first", "--locale", id,
      "--check"
    ]);
    const chart = await readFile(
      path.join(projectRoot, `index.immediate-family${id === "en-US" ? "" : `.${id}`}.html`),
      "utf8"
    );
    assert.equal((chart.match(/data-person-id="/g) ?? []).length, 2);
    const relationship = chart.match(/<div class="relationship[^"]*"[^>]*>([\s\S]*?)<\/div>/)[1];
    assert.ok(relationship.includes("1920"));
    assert.ok(!relationship.includes(translation));
    assert.ok(chart.includes(
      locale.strings.immediateFamilyTreeTitle.replace("{person}", "first Example")
    ));
  }
});

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
