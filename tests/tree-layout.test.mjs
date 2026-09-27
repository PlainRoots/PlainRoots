import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLevels,
  calculateViewLevels,
  selectAncestry,
  selectDescendants
} from "../scripts/tree-layout.mjs";

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
