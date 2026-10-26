import assert from "node:assert/strict";
import test from "node:test";
import { loadLocale } from "../scripts/locales.mjs";
import { renderTextGuardianships } from "../scripts/text-tree.mjs";
import {
  calculateLevels,
  calculateViewLevels,
  selectAncestry,
  selectDescendants,
  selectImmediateFamily
} from "../scripts/tree-layout.mjs";

test("immediate family includes spouses and direct children only", () => {
  const tree = {
    title: "Test tree",
    people: [
      "focus-parent", "focus", "first-spouse", "first-child",
      "first-child-spouse", "grandchild", "second-spouse", "second-child",
      "focus-sibling"
    ],
    families: [
      { id: "parents", partners: ["focus-parent"], children: ["focus", "focus-sibling"] },
      { id: "first", partners: ["focus", "first-spouse"], children: ["first-child"] },
      { id: "child", partners: ["first-child", "first-child-spouse"], children: ["grandchild"] },
      { id: "second", partners: ["focus", "second-spouse"], children: ["second-child"] }
    ]
  };
  const immediateFamily = selectImmediateFamily(tree, "focus");

  assert.deepEqual(immediateFamily.people, [
    "focus", "first-spouse", "first-child", "second-spouse", "second-child"
  ]);
  assert.deepEqual(immediateFamily.spouseIds, ["first-spouse", "second-spouse"]);
  assert.deepEqual(immediateFamily.directDescendantIds, ["first-child", "second-child"]);
  assert.deepEqual(immediateFamily.families.map(({ id }) => id), ["first", "second"]);
  assert.deepEqual(immediateFamily.groupingFamilies, immediateFamily.families);
  assert.deepEqual(immediateFamily.guardianships, []);
  assert.deepEqual(immediateFamily.caregivingChildIds, []);
  assert.throws(() => selectImmediateFamily(tree, "missing"), /Unknown person/);
});

test("immediate family includes raised children without extending their branches", async () => {
  const tree = {
    title: "Test tree",
    people: [
      "focus", "spouse", "child", "raised-child", "co-caregiver",
      "raised-child-partner", "grandchild", "caregiving-grandchild",
      "spouse-raised-child", "focus-caregiver", "unrelated-child"
    ],
    families: [
      {
        id: "focus-family",
        partners: ["focus", "spouse"],
        children: ["child"]
      },
      {
        id: "raised-child-family",
        partners: ["raised-child", "raised-child-partner"],
        children: ["grandchild"]
      }
    ],
    guardianships: [
      {
        id: "raised-child-by-focus",
        child: "raised-child",
        guardians: ["focus", "co-caregiver"],
        relationship: "raised-by",
        startingAge: 8,
        evidence: "family-account"
      },
      {
        id: "child-by-focus",
        child: "child",
        guardians: ["focus", "spouse"],
        relationship: "raised-by",
        evidence: "family-account"
      },
      {
        id: "caregiving-grandchild-by-raised-child",
        child: "caregiving-grandchild",
        guardians: ["raised-child"],
        relationship: "raised-by",
        evidence: "family-account"
      },
      {
        id: "spouse-raised-child-by-spouse",
        child: "spouse-raised-child",
        guardians: ["spouse"],
        relationship: "raised-by",
        evidence: "family-account"
      },
      {
        id: "focus-by-caregiver",
        child: "focus",
        guardians: ["focus-caregiver"],
        relationship: "raised-by",
        evidence: "family-account"
      },
      {
        id: "unrelated-child-by-co-caregiver",
        child: "unrelated-child",
        guardians: ["co-caregiver"],
        relationship: "raised-by",
        evidence: "family-account"
      }
    ]
  };
  const original = structuredClone(tree);
  const immediateFamily = selectImmediateFamily(tree, "focus");

  assert.deepEqual(immediateFamily.people, [
    "focus", "spouse", "child", "raised-child", "co-caregiver"
  ]);
  assert.deepEqual(immediateFamily.directDescendantIds, ["child"]);
  assert.deepEqual(immediateFamily.caregivingChildIds, ["raised-child"]);
  assert.deepEqual(immediateFamily.spouseIds, ["spouse"]);
  assert.deepEqual(immediateFamily.guardianships, tree.guardianships.slice(0, 2));
  assert.deepEqual(immediateFamily.families, [tree.families[0]]);
  assert.deepEqual(immediateFamily.groupingFamilies, [tree.families[0]]);
  assert.deepEqual(tree, original);

  const relationshipLevels = calculateLevels(immediateFamily);
  const displayLevels = calculateViewLevels(immediateFamily);
  assert.equal(relationshipLevels.get("raised-child"), 0);
  assert.equal(displayLevels.get("raised-child"), displayLevels.get("child"));
  assert.equal(displayLevels.get("co-caregiver"), displayLevels.get("focus"));
  assert.equal(relationshipLevels.get("child"), 1);

  const people = new Map(
    immediateFamily.people.map((id) => [id, { id, name: id }])
  );
  for (const localeId of ["en-US", "es-MX"]) {
    const locale = await loadLocale(process.cwd(), localeId);
    const lines = renderTextGuardianships(immediateFamily, people, locale, {
      minimal: true
    });
    assert.ok(lines.includes(locale.strings.asciiGuardianshipTitle));
    assert.ok(lines.includes("+-- raised-child"));
    assert.ok(lines.some((line) => line.includes("focus <--> co-caregiver")));
    assert.ok(lines.some((line) => line.includes(
      locale.strings.asciiRaisedByFromAge.replace("{age}", "8")
    )));
    assert.ok(lines.every((line) => !line.includes("unrelated-child")));
  }
});

test("immediate family supports a single caregiver without a partnership", () => {
  const guardianship = {
    id: "child-by-focus",
    child: "raised-child",
    guardians: ["focus"],
    relationship: "raised-by",
    evidence: "family-account"
  };
  const tree = {
    title: "Test tree",
    people: ["focus", "raised-child"],
    families: [],
    guardianships: [
      guardianship,
      { ...guardianship, id: "second-raised-by-record" }
    ]
  };
  const immediateFamily = selectImmediateFamily(tree, "focus");

  assert.deepEqual(immediateFamily.people, tree.people);
  assert.deepEqual(immediateFamily.caregivingChildIds, ["raised-child"]);
  assert.deepEqual(immediateFamily.directDescendantIds, []);
  assert.deepEqual(immediateFamily.spouseIds, []);
  assert.deepEqual(immediateFamily.families, []);
  assert.deepEqual(immediateFamily.groupingFamilies, []);
  assert.deepEqual(immediateFamily.guardianships, tree.guardianships);
  assert.equal(calculateLevels(immediateFamily).get("raised-child"), 0);
  assert.equal(calculateViewLevels(immediateFamily).get("raised-child"), 1);
});

test("ancestry shows co-raised people separately from biological siblings", () => {
  const tree = {
    title: "Test tree",
    people: [
      "parent-one",
      "parent-two",
      "focus",
      "biological-sibling",
      "guardian-one",
      "guardian-two",
      "caregiving-peer"
    ],
    families: [
      {
        id: "biological-family",
        partners: ["parent-one", "parent-two"],
        children: ["focus", "biological-sibling"]
      },
      {
        id: "guardian-family",
        partners: ["guardian-one", "guardian-two"],
        children: []
      }
    ],
    guardianships: [
      {
        id: "focus-raised-by-guardians",
        child: "focus",
        guardians: ["guardian-one", "guardian-two"],
        relationship: "raised-by",
        evidence: "family-account"
      },
      {
        id: "peer-raised-by-guardians",
        child: "caregiving-peer",
        guardians: ["guardian-one", "guardian-two"],
        relationship: "raised-by",
        evidence: "family-account"
      }
    ]
  };

  const ancestry = selectAncestry(tree, "focus");
  const biologicalFamily = ancestry.groupingFamilies.find(
    (family) => family.id === "biological-family"
  );

  assert.ok(ancestry.people.includes("caregiving-peer"));
  assert.deepEqual(ancestry.caregivingPeerIds, ["caregiving-peer"]);
  assert.deepEqual(
    ancestry.guardianships.map((guardianship) => guardianship.id),
    ["focus-raised-by-guardians", "peer-raised-by-guardians"]
  );
  assert.deepEqual(biologicalFamily.children, [
    "focus",
    "biological-sibling"
  ]);

  const relationshipLevels = calculateLevels(ancestry);
  const displayLevels = calculateViewLevels(ancestry);
  assert.equal(relationshipLevels.get("caregiving-peer"), 0);
  assert.equal(displayLevels.get("caregiving-peer"), displayLevels.get("focus"));
});

test("descendants include raised-by children and their modeled branches", () => {
  const tree = {
    title: "Test tree",
    people: [
      "focus",
      "raised-child-spouse",
      "raised-child",
      "focus-spouse",
      "raised-grandchild"
    ],
    families: [
      {
        id: "focus-family",
        partners: ["focus", "focus-spouse"],
        children: []
      },
      {
        id: "raised-child-family",
        partners: ["raised-child", "raised-child-spouse"],
        children: ["raised-grandchild"]
      }
    ],
    guardianships: [
      {
        id: "raised-child-by-focus",
        child: "raised-child",
        guardians: ["focus", "focus-spouse"],
        relationship: "raised-by",
        evidence: "family-account"
      }
    ]
  };

  const descendants = selectDescendants(tree, "focus");

  assert.deepEqual(descendants.directDescendantIds, []);
  assert.deepEqual(descendants.caregivingDescendantIds, [
    "raised-child",
    "raised-grandchild"
  ]);
  assert.deepEqual(
    descendants.guardianships.map((guardianship) => guardianship.id),
    ["raised-child-by-focus"]
  );
  assert.ok(descendants.people.includes("raised-child"));
  assert.ok(descendants.people.includes("raised-child-spouse"));
  assert.ok(descendants.people.includes("raised-grandchild"));
  assert.deepEqual(descendants.people.slice(0, 4), [
    "focus",
    "focus-spouse",
    "raised-child",
    "raised-child-spouse"
  ]);
  assert.ok(
    descendants.families.some(
      (family) => family.id === "raised-child-family"
    )
  );
});
