export function validateTree(value) {
  if (!value || typeof value !== "object") {
    throw new Error("tree.json must contain an object");
  }
  if (typeof value.title !== "string" || value.title.trim() === "") {
    throw new Error('tree.json: "title" must be a non-empty string');
  }
  if (!Array.isArray(value.people) || !Array.isArray(value.families)) {
    throw new Error('tree.json: "people" and "families" must be arrays');
  }
  if (
    value.siblingGroups !== undefined &&
    !Array.isArray(value.siblingGroups)
  ) {
    throw new Error('tree.json: "siblingGroups" must be an array');
  }
  if (
    value.guardianships !== undefined &&
    !Array.isArray(value.guardianships)
  ) {
    throw new Error('tree.json: "guardianships" must be an array');
  }
  if (new Set(value.people).size !== value.people.length) {
    throw new Error("tree.json: people contains duplicate ids");
  }

  const familyIds = new Set();
  for (const family of value.families) {
    if (
      !family ||
      typeof family.id !== "string" ||
      !Array.isArray(family.partners) ||
      !Array.isArray(family.children)
    ) {
      throw new Error(
        'tree.json: each family needs an "id", "partners", and "children"'
      );
    }
    if (familyIds.has(family.id)) {
      throw new Error(`tree.json: duplicate family id "${family.id}"`);
    }
    if (family.partners.length < 1 || family.partners.length > 2) {
      throw new Error(
        `tree.json: family "${family.id}" must have one or two partners`
      );
    }
    if (
      family.relationship !== undefined &&
      !["married", "divorced"].includes(family.relationship)
    ) {
      throw new Error(
        `tree.json: family "${family.id}" has invalid relationship "${family.relationship}"`
      );
    }
    if (new Set(family.partners).size !== family.partners.length) {
      throw new Error(
        `tree.json: family "${family.id}" contains duplicate partners`
      );
    }
    if (new Set(family.children).size !== family.children.length) {
      throw new Error(
        `tree.json: family "${family.id}" contains duplicate children`
      );
    }
    familyIds.add(family.id);
  }

  for (const group of value.siblingGroups ?? []) {
    if (
      !group ||
      typeof group.id !== "string" ||
      !Array.isArray(group.children) ||
      group.children.length < 2
    ) {
      throw new Error(
        'tree.json: each sibling group needs an "id" and at least two "children"'
      );
    }
    if (familyIds.has(group.id)) {
      throw new Error(
        `tree.json: duplicate family or sibling group id "${group.id}"`
      );
    }
    if (new Set(group.children).size !== group.children.length) {
      throw new Error(
        `tree.json sibling group "${group.id}" contains duplicate children`
      );
    }
    familyIds.add(group.id);
  }

  const guardianshipIds = new Set();
  for (const guardianship of value.guardianships ?? []) {
    if (
      !guardianship ||
      typeof guardianship.id !== "string" ||
      typeof guardianship.child !== "string" ||
      !Array.isArray(guardianship.guardians) ||
      guardianship.guardians.length < 1 ||
      guardianship.guardians.length > 2 ||
      guardianship.relationship !== "raised-by" ||
      !Number.isInteger(guardianship.startingAge) ||
      guardianship.startingAge < 0 ||
      guardianship.evidence !== "family-account"
    ) {
      throw new Error(
        'tree.json: each guardianship needs an "id", "child", one or two "guardians", relationship "raised-by", non-negative integer "startingAge", and evidence "family-account"'
      );
    }
    if (guardianshipIds.has(guardianship.id)) {
      throw new Error(
        `tree.json: duplicate guardianship id "${guardianship.id}"`
      );
    }
    if (new Set(guardianship.guardians).size !== guardianship.guardians.length) {
      throw new Error(
        `tree.json guardianship "${guardianship.id}" contains duplicate guardians`
      );
    }
    if (guardianship.guardians.includes(guardianship.child)) {
      throw new Error(
        `tree.json guardianship "${guardianship.id}" cannot make its child a guardian`
      );
    }
    guardianshipIds.add(guardianship.id);
  }
}

export function validateReferences(treeData, peopleById) {
  for (const personId of treeData.people) {
    if (!peopleById.has(personId)) {
      throw new Error(`tree.json references unknown person "${personId}"`);
    }
  }

  const included = new Set(treeData.people);
  for (const family of treeData.families) {
    validatePersonReferences(
      family.id,
      [...family.partners, ...family.children],
      included,
      "family"
    );
  }
  for (const group of treeData.siblingGroups ?? []) {
    validatePersonReferences(group.id, group.children, included, "sibling group");
  }
  for (const guardianship of treeData.guardianships ?? []) {
    validatePersonReferences(
      guardianship.id,
      [guardianship.child, ...guardianship.guardians],
      included,
      "guardianship"
    );
  }
}

function validatePersonReferences(id, personIds, included, type) {
  for (const personId of personIds) {
    if (!included.has(personId)) {
      throw new Error(
        `tree.json ${type} "${id}" references "${personId}", which is not listed in people`
      );
    }
  }
}
