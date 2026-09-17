import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { serializeGedcom } from "../scripts/gedcom.mjs";
import { convertGedcomToStaging } from "../scripts/gedcom/convert.mjs";
import { parseGedcomBuffer } from "../scripts/gedcom/parser.mjs";

const execFileAsync = promisify(execFile);

test("parses GEDCOM 5.5 through 5.5.5 with continuations", () => {
  for (const version of ["5.5", "5.5.1", "5.5.5"]) {
    const document = parseGedcomBuffer(
      Buffer.from(
        gedcom(version, [
          "0 @I1@ INDI",
          "1 NAME Alex /Rivera/",
          "2 GIVN Alex",
          "2 SURN Rivera",
          "1 NOTE First",
          "2 CONC  second",
          "2 CONT next line"
        ])
      )
    );

    assert.equal(document.version, version);
    const note = document.records
      .find((record) => record.xref === "@I1@")
      .children.find((record) => record.tag === "NOTE");
    assert.equal(note.value, "First");
    assert.equal(note.children.length, 2);
  }
});

test("detects UTF-16 little-endian and big-endian files", () => {
  const source = gedcom("5.5.5", ["0 @I1@ INDI", "1 NAME Sofía /García/"]).replace(
    "1 CHAR UTF-8",
    "1 CHAR UNICODE"
  );
  const littleEndian = Buffer.concat([
    Buffer.from([0xff, 0xfe]),
    Buffer.from(source, "utf16le")
  ]);
  const bigEndianContent = Buffer.from(source, "utf16le");
  bigEndianContent.swap16();
  const bigEndian = Buffer.concat([
    Buffer.from([0xfe, 0xff]),
    bigEndianContent
  ]);

  assert.equal(
    parseGedcomBuffer(littleEndian).detectedEncoding,
    "UTF-16LE"
  );
  assert.equal(parseGedcomBuffer(bigEndian).detectedEncoding, "UTF-16BE");
});

test("rejects ANSEL and unsupported GEDCOM versions", () => {
  assert.throws(
    () =>
      parseGedcomBuffer(
        Buffer.from(gedcom("5.5.1", []).replace("1 CHAR UTF-8", "1 CHAR ANSEL"))
      ),
    /ANSEL encoding is not supported/
  );
  assert.throws(
    () => parseGedcomBuffer(Buffer.from(gedcom("7.0", []))),
    /Unsupported GEDCOM version/
  );
});

test("stages duplicate same-sex partner tags and foster candidates", () => {
  const source = gedcom("5.5.5", [
    "0 @I1@ INDI",
    "1 NAME Alex /Rivera/",
    "2 GIVN Alex",
    "2 SURN Rivera",
    "1 SEX F",
    "1 FAMS @F1@",
    "0 @I2@ INDI",
    "1 NAME Sam /Morgan/",
    "2 GIVN Sam",
    "2 SURN Morgan",
    "1 SEX F",
    "1 FAMS @F1@",
    "0 @I3@ INDI",
    "1 NAME Casey /Rivera/",
    "2 GIVN Casey",
    "2 SURN Rivera",
    "1 SEX U",
    "1 FAMC @F2@",
    "2 PEDI foster",
    "0 @I4@ INDI",
    "1 NAME Taylor /Lee/",
    "2 GIVN Taylor",
    "2 SURN Lee",
    "1 SEX M",
    "1 FAMS @F2@",
    "0 @F1@ FAM",
    "1 WIFE @I1@",
    "1 WIFE @I2@",
    "1 MARR Y",
    "0 @F2@ FAM",
    "1 HUSB @I4@",
    "1 CHIL @I3@"
  ]);

  const staging = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(source)),
    "example.ged"
  );

  assert.deepEqual(staging.proposedTree.families[0].partners, [
    "alex-rivera",
    "sam-morgan"
  ]);
  assert.equal(staging.proposedTree.families[0].relationship, "married");
  assert.equal(staging.guardianshipCandidates.length, 1);
  assert.equal(staging.guardianshipCandidates[0].child, "casey-rivera");
  assert.deepEqual(staging.guardianshipCandidates[0].guardians, ["taylor-lee"]);
});

test("preserves unsupported records and broken-pointer diagnostics", () => {
  const source = gedcom("5.5.5", [
    "0 @I1@ INDI",
    "1 NAME Example /Person/",
    "2 GIVN Example",
    "2 SURN Person",
    "1 FAMS @F404@",
    "1 _CUSTOM preserved",
    "0 @S1@ SOUR",
    "1 TITL Source title"
  ]);

  const staging = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(source)),
    "unsupported.ged"
  );

  assert.ok(
    staging.issues.some((issue) => issue.code === "broken-pointer")
  );
  assert.ok(
    staging.unresolved.some(
      (item) => item.reason === "unsupported-individual-structure"
    )
  );
  assert.ok(
    staging.unresolved.some(
      (item) => item.reason === "unsupported-top-level-record"
    )
  );
});

test("does not invent relationship status for a single-parent family", () => {
  const source = gedcom("5.5.5", [
    "0 @I1@ INDI",
    "1 NAME Parent /Person/",
    "2 GIVN Parent",
    "2 SURN Person",
    "0 @I2@ INDI",
    "1 NAME Child /Person/",
    "2 GIVN Child",
    "2 SURN Person",
    "0 @F1@ FAM",
    "1 WIFE @I1@",
    "1 CHIL @I2@"
  ]);
  const staging = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(source)),
    "single-parent.ged"
  );

  assert.equal(staging.proposedTree.families.length, 1);
  assert.equal(
    Object.hasOwn(staging.proposedTree.families[0], "relationship"),
    false
  );
});

test("inventories family event details that PlainRoots cannot store", () => {
  const source = gedcom("5.5.5", [
    "0 @I1@ INDI",
    "1 NAME Alex /Rivera/",
    "2 GIVN Alex",
    "2 SURN Rivera",
    "0 @I2@ INDI",
    "1 NAME Sam /Morgan/",
    "2 GIVN Sam",
    "2 SURN Morgan",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
    "1 MARR",
    "2 DATE 1 JAN 2000",
    "2 PLAC Austin, Texas, USA"
  ]);
  const staging = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(source)),
    "family-event.ged"
  );

  assert.equal(
    staging.unresolved.filter(
      (item) => item.reason === "unsupported-family-event-detail"
    ).length,
    2
  );
});

test("keeps adopted children out of ordinary parentage proposals", () => {
  const source = gedcom("5.5.5", [
    "0 @I1@ INDI",
    "1 NAME Parent /Person/",
    "2 GIVN Parent",
    "2 SURN Person",
    "0 @I2@ INDI",
    "1 NAME Child /Person/",
    "2 GIVN Child",
    "2 SURN Person",
    "1 FAMC @F1@",
    "2 PEDI adopted",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 CHIL @I2@"
  ]);
  const staging = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(source)),
    "adopted.ged"
  );

  assert.equal(staging.proposedTree.families.length, 0);
  assert.equal(staging.pedigreeCandidates.length, 1);
  assert.equal(staging.pedigreeCandidates[0].pedigree, "adopted");
});

test("round trips the exported core graph into staging", () => {
  const people = new Map([
    ["alex", person("alex", "Alex", "Rivera", "female")],
    ["sam", person("sam", "Sam", "Morgan", "female")],
    ["casey", person("casey", "Casey", "Rivera", "unknown")]
  ]);
  const exported = serializeGedcom({
    tree: {
      title: "Example",
      people: ["alex", "sam", "casey"],
      families: [
        {
          id: "alex-sam",
          partners: ["alex", "sam"],
          children: ["casey"]
        }
      ]
    },
    people,
    fileName: "round-trip.ged",
    createdAt: new Date("2026-09-16T00:00:00Z")
  });

  const staged = convertGedcomToStaging(
    parseGedcomBuffer(Buffer.from(exported.content, "utf8")),
    "round-trip.ged"
  );

  assert.equal(staged.people.length, 3);
  assert.deepEqual(staged.proposedTree.families[0].partners, [
    "alex-rivera",
    "sam-morgan"
  ]);
  assert.deepEqual(staged.proposedTree.families[0].children, ["casey-rivera"]);
});

test("CLI writes an ignored review package without applying records", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "plainroots-gedcom-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const inputPath = path.join(temporaryRoot, "input.ged");
  const outputPath = path.join(temporaryRoot, "review");
  await writeFile(
    inputPath,
    gedcom("5.5.5", [
      "0 @I1@ INDI",
      "1 NAME Example /Person/",
      "2 GIVN Example",
      "2 SURN Person",
      "1 SEX U"
    ])
  );

  const result = await execFileAsync(
    process.execPath,
    [
      path.resolve("scripts/import-gedcom.mjs"),
      "--input",
      inputPath,
      "--output",
      outputPath
    ],
    { cwd: path.resolve(".") }
  );

  assert.match(result.stderr, /SENSITIVE FAMILY INFORMATION/);
  assert.match(result.stdout, /No PlainRoots family records were changed/);
  const manifest = JSON.parse(
    await readFile(path.join(outputPath, "import-manifest.json"), "utf8")
  );
  const report = await readFile(path.join(outputPath, "IMPORT-REPORT.md"), "utf8");
  assert.equal(manifest.archiveModified, false);
  assert.match(report, /Review gate/);

  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        path.resolve("scripts/import-gedcom.mjs"),
        "--input",
        inputPath,
        "--output",
        outputPath
      ],
      { cwd: path.resolve(".") }
    ),
    /already exists/
  );

  await execFileAsync(
    process.execPath,
    [
      path.resolve("scripts/import-gedcom.mjs"),
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--force"
    ],
    { cwd: path.resolve(".") }
  );
});

test("CLI refuses to force-replace an unrelated directory", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "plainroots-gedcom-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const inputPath = path.join(temporaryRoot, "input.ged");
  const unrelatedPath = path.join(temporaryRoot, "unrelated");
  await writeFile(inputPath, gedcom("5.5.5", []));
  await mkdir(unrelatedPath, { recursive: true });

  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        path.resolve("scripts/import-gedcom.mjs"),
        "--input",
        inputPath,
        "--output",
        unrelatedPath,
        "--force"
      ],
      { cwd: path.resolve(".") }
    ),
    /not a recognized PlainRoots import staging package/
  );
});

function gedcom(version, records) {
  return [
    "0 HEAD",
    "1 GEDC",
    `2 VERS ${version}`,
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
    "1 SOUR Test",
    ...records,
    "0 TRLR",
    ""
  ].join("\r\n");
}

function person(id, givenNames, surnames, sex) {
  return {
    id,
    name: `${givenNames} ${surnames}`,
    givenNames,
    surnames,
    sex,
    maidenName: null,
    initials: `${givenNames[0]}${surnames[0]}`,
    occupation: "Researcher",
    birthDate: "1990-05-10",
    birthPlace: "Austin, Texas, USA",
    deathDate: null,
    lifeStatus: "living",
    photo: null
  };
}
