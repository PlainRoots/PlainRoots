import assert from "node:assert/strict";
import test from "node:test";
import { formatGedcomDate, serializeGedcom } from "../scripts/gedcom.mjs";
import { validateTree } from "../scripts/tree-data.mjs";

test("exports living people, same-sex families, siblings, and guardianships", () => {
  const people = new Map([
    [
      "alex",
      {
        ...person("alex", "Alex", "Rivera", "female"),
        alternateNames: [
          {
            name: "Lex",
            language: "en",
            type: "nickname",
            evidence: "Confirmed nickname."
          }
        ]
      }
    ],
    ["sam", person("sam", "Sam", "Morgan", "female")],
    ["child", person("child", "Casey", "Rivera", "unknown")],
    ["sibling", person("sibling", "Jordan", "Rivera", "intersex")],
    ["guardian", person("guardian", "Taylor", "Lee", "male")]
  ]);
  const tree = {
    title: "Example",
    people: ["alex", "sam", "child", "sibling", "guardian"],
    families: [
      {
        id: "alex-sam",
        partners: ["alex", "sam"],
        relationship: "married",
        children: ["child"]
      }
    ],
    siblingGroups: [
      {
        id: "unknown-parents",
        partners: [],
        children: ["child", "sibling"]
      }
    ],
    guardianships: [
      {
        id: "child-raised-by-guardian",
        child: "child",
        guardians: ["guardian"],
        relationship: "raised-by",
        startingAge: 4,
        evidence: "family-account"
      }
    ]
  };

  const result = serializeGedcom({
    tree,
    people,
    fileName: "example.ged",
    createdAt: new Date("2026-09-16T00:00:00Z")
  });

  assert.ok(result.content.startsWith("\uFEFF0 HEAD\r\n"));
  assert.match(
    result.content,
    /1 NAME Alex \/Rivera\/\r\n2 GIVN Alex\r\n2 SURN Rivera\r\n2 NICK Lex\r\n1 SEX F\r\n/
  );
  assert.match(result.content, /2 DATE 10 MAY 1990\r\n/);
  assert.match(result.content, /1 NAME Jordan \/Rivera\/[\s\S]*?1 SEX X\r\n/);
  assert.match(
    result.content,
    /0 @F1@ FAM\r\n1 WIFE @I1@\r\n1 WIFE @I2@\r\n1 CHIL @I3@\r\n1 MARR Y\r\n/
  );
  assert.match(
    result.content,
    /0 @F2@ FAM\r\n1 CHIL @I3@\r\n1 CHIL @I4@\r\n/
  );
  assert.match(
    result.content,
    /1 FAMC @F3@\r\n2 PEDI foster\r\n/
  );
  assert.match(
    result.content,
    /0 @F3@ FAM\r\n1 HUSB @I5@\r\n1 CHIL @I3@\r\n/
  );
  assert.match(
    result.warnings.join("\n"),
    /duplicate WIFE records for a same-sex family/
  );
  assert.equal(result.stats.individuals, 5);
  assert.equal(result.stats.families, 3);
});

test("formats supported PlainRoots dates", () => {
  assert.equal(formatGedcomDate("1968-05-11"), "11 MAY 1968");
  assert.equal(formatGedcomDate("1968-05"), "MAY 1968");
  assert.equal(formatGedcomDate("1968"), "1968");
  assert.equal(formatGedcomDate("1968", true), "ABT 1968");
  assert.equal(formatGedcomDate("Unknown"), null);
  assert.throws(() => formatGedcomDate("1968-02-31"), /Invalid/);
  assert.throws(() => formatGedcomDate("1968-13"), /Invalid/);
  assert.throws(() => formatGedcomDate("May 1968"), /Invalid/);
});

test("exports partnered and unknown relationships without asserting marriage", () => {
  const people = new Map([
    ["alex", person("alex", "Alex", "Rivera", "male")],
    ["sam", person("sam", "Sam", "Morgan", "female")],
    ["casey", person("casey", "Casey", "Rivera", "unknown")],
    ["jamie", person("jamie", "Jamie", "Lee", "male")],
    ["taylor", person("taylor", "Taylor", "Diaz", "female")],
    ["jordan", person("jordan", "Jordan", "Lee", "unknown")]
  ]);
  const tree = {
    title: "Example",
    people: [...people.keys()],
    families: [
      {
        id: "rivera",
        partners: ["alex", "sam"],
        relationship: "partnered",
        children: ["casey"]
      },
      {
        id: "lee",
        partners: ["jamie", "taylor"],
        relationship: "unknown",
        children: ["jordan"]
      }
    ]
  };

  assert.doesNotThrow(() => validateTree(tree));

  const result = serializeGedcom({
    tree,
    people,
    createdAt: new Date("2026-09-16T00:00:00Z")
  });

  assert.match(
    result.content,
    /0 @F1@ FAM\r\n1 HUSB @I1@\r\n1 WIFE @I2@\r\n1 CHIL @I3@\r\n1 EVEN\r\n2 TYPE Unmarried partnership\r\n/
  );
  assert.match(
    result.content,
    /0 @F2@ FAM\r\n1 HUSB @I4@\r\n1 WIFE @I5@\r\n1 CHIL @I6@\r\n0 TRLR\r\n/
  );
  assert.doesNotMatch(
    result.content,
    /0 @F[12]@ FAM[\s\S]*?1 MARR Y/
  );
});

test("defaults an omitted two-partner relationship to unknown", () => {
  const people = new Map([
    ["alex", person("alex", "Alex", "Rivera", "male")],
    ["sam", person("sam", "Sam", "Morgan", "female")]
  ]);

  const result = serializeGedcom({
    tree: {
      title: "Example",
      people: [...people.keys()],
      families: [
        {
          id: "rivera",
          partners: ["alex", "sam"],
          children: []
        }
      ]
    },
    people,
    createdAt: new Date("2026-09-16T00:00:00Z")
  });

  assert.match(
    result.content,
    /0 @F1@ FAM\r\n1 HUSB @I1@\r\n1 WIFE @I2@\r\n0 TRLR\r\n/
  );
  assert.doesNotMatch(result.content, /1 MARR|1 DIV|1 EVEN/);
});

test("rejects GEDCOM lines that exceed the format limit", () => {
  const oversized = person("person", "Example", "Person", "unknown");
  oversized.occupation = "x".repeat(250);

  assert.throws(
    () =>
      serializeGedcom({
        tree: {
          title: "Example",
          people: ["person"],
          families: []
        },
        people: new Map([["person", oversized]]),
        createdAt: new Date("2026-09-16T00:00:00Z")
      }),
    /exceeds 255 code units/
  );
});

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
