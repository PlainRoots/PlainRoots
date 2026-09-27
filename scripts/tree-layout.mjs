export function selectFullTree(treeData) {
  const connectedPeople = new Set(
    [
      ...treeData.families.flatMap((family) => [
        ...family.partners,
        ...family.children
      ]),
      ...(treeData.siblingGroups ?? []).flatMap((group) => group.children)
    ]
  );
  const unconnectedPeople = treeData.people.filter(
    (personId) => !connectedPeople.has(personId)
  );

  if (unconnectedPeople.length === 0) {
    return treeData;
  }

  return {
    ...treeData,
    spouseGroupingLineageIds: (treeData.siblingGroups ?? []).flatMap(
      (group) => group.children
    ),
    groupLineageSpouses: true,
    groupingFamilies: [
      ...treeData.families,
      ...(treeData.siblingGroups ?? []),
      {
        id: "currently-unconnected",
        partners: [],
        children: unconnectedPeople,
        titleKey: "unconnectedGroupTitle",
        appearance: "unconnected",
        pinToEnd: true
      }
    ]
  };
}

export function selectPerson(treeData, personId) {
  if (!treeData.people.includes(personId)) {
    throw new Error(`Unknown person "${personId}"`);
  }

  return {
    ...treeData,
    focusPersonId: personId,
    people: [personId],
    families: [],
    groupingFamilies: []
  };
}

export function selectAncestry(treeData, personId) {
  const ancestry = traceDirectAncestry(treeData, personId);
  const includedPeople = new Set([
    personId,
    ...ancestry.directAncestorIds
  ]);
  const includedFamilyIds = new Set(ancestry.parentFamilyIds);
  const includedSiblingGroupIds = new Set();
  const focusPartnershipFamilyIds = new Set();
  const guardianPartnershipFamilyIds = new Set();
  const displayedSiblingIds = new Set();
  const guardianshipChildren = new Set([
    personId,
    ...ancestry.directAncestorIds
  ]);
  const primaryGuardianships = (treeData.guardianships ?? []).filter(
    (guardianship) => guardianshipChildren.has(guardianship.child)
  );
  const guardianships = [...primaryGuardianships];
  const caregivingPeerIds = new Set();
  for (const guardianship of primaryGuardianships) {
    for (const candidate of treeData.guardianships ?? []) {
      if (
        candidate.child === guardianship.child ||
        !samePeople(candidate.guardians, guardianship.guardians)
      ) {
        continue;
      }
      if (!guardianships.some((item) => item.id === candidate.id)) {
        guardianships.push(candidate);
      }
      if (!includedPeople.has(candidate.child)) {
        includedPeople.add(candidate.child);
        caregivingPeerIds.add(candidate.child);
      }
    }
  }
  const guardianLineageIds = new Set();

  for (const family of treeData.families) {
    if (includedFamilyIds.has(family.id)) {
      for (const siblingId of family.children) {
        includedPeople.add(siblingId);
        displayedSiblingIds.add(siblingId);
      }
    }
  }

  for (const group of treeData.siblingGroups ?? []) {
    if (
      group.children.some(
        (id) => id === personId || ancestry.directAncestorIds.has(id)
      )
    ) {
      includedSiblingGroupIds.add(group.id);
      for (const siblingId of group.children) {
        includedPeople.add(siblingId);
        displayedSiblingIds.add(siblingId);
      }
    }
  }

  for (const family of treeData.families) {
    if (
      includedFamilyIds.has(family.id) ||
      family.partners.length !== 2 ||
      !family.partners.some((partnerId) => displayedSiblingIds.has(partnerId))
    ) {
      continue;
    }
    includedFamilyIds.add(family.id);
    focusPartnershipFamilyIds.add(family.id);
    for (const partnerId of family.partners) {
      includedPeople.add(partnerId);
    }
  }

  for (const family of treeData.families) {
    if (
      family.partners.length === 2 &&
      family.partners.includes(personId)
    ) {
      includedFamilyIds.add(family.id);
      focusPartnershipFamilyIds.add(family.id);
      for (const partnerId of family.partners) {
        includedPeople.add(partnerId);
      }
    }
  }

  for (const guardianship of guardianships) {
    for (const guardianId of guardianship.guardians) {
      includedPeople.add(guardianId);
    }
    const guardianFamily = treeData.families.find(
      (family) =>
        family.partners.length === guardianship.guardians.length &&
        family.partners.every((partnerId) =>
          guardianship.guardians.includes(partnerId)
        )
    );
    if (guardianFamily) {
      includedFamilyIds.add(guardianFamily.id);
      guardianPartnershipFamilyIds.add(guardianFamily.id);
    }
    for (const group of treeData.siblingGroups ?? []) {
      for (const guardianId of guardianship.guardians) {
        if (group.children.includes(guardianId)) {
          guardianLineageIds.add(guardianId);
        }
      }
    }
  }

  const spouseGroupingLineageIds = new Set([
    ...displayedSiblingIds,
    ...guardianLineageIds
  ]);

  return {
    ...treeData,
    focusPersonId: personId,
    directAncestorIds: [...ancestry.directAncestorIds],
    directAncestorPaths: Object.fromEntries(ancestry.directAncestorPaths),
    guardianships,
    caregivingPeerIds: [...caregivingPeerIds],
    spouseGroupingLineageIds: [...spouseGroupingLineageIds],
    groupLineageSpouses: spouseGroupingLineageIds.size > 0,
    people: treeData.people.filter((id) => includedPeople.has(id)),
    families: treeData.families
      .filter((family) => includedFamilyIds.has(family.id))
      .map((family) => ({
        ...family,
        children:
          focusPartnershipFamilyIds.has(family.id) ||
          guardianPartnershipFamilyIds.has(family.id)
          ? []
          : family.children.filter((id) => includedPeople.has(id))
      })),
    groupingFamilies: [
      ...treeData.families
        .filter((family) => includedFamilyIds.has(family.id))
        .map((family) => ({
          ...family,
          children:
            focusPartnershipFamilyIds.has(family.id) ||
            guardianPartnershipFamilyIds.has(family.id)
            ? []
            : family.children.filter((id) => includedPeople.has(id))
        })),
      ...(treeData.siblingGroups ?? []).filter((group) =>
        includedSiblingGroupIds.has(group.id)
      )
    ]
  };
}

function samePeople(left, right) {
  return (
    left.length === right.length &&
    left.every((personId) => right.includes(personId))
  );
}

export function selectPaternalAncestry(treeData, personId) {
  return selectSingleParentAncestry(treeData, personId, 0, "paternal");
}

export function selectMaternalAncestry(treeData, personId) {
  return selectSingleParentAncestry(treeData, personId, 1, "maternal");
}

function selectSingleParentAncestry(
  treeData,
  personId,
  parentIndex,
  branchName
) {
  const parentFamily = treeData.families.find((family) =>
    family.children.includes(personId)
  );
  const selectedParentId = parentFamily?.partners[parentIndex];

  if (!parentFamily || !selectedParentId) {
    throw new Error(
      `Cannot generate ${branchName} ancestry for "${personId}" without a modeled ${branchName} parent`
    );
  }

  const branchTree = selectAncestry(treeData, selectedParentId);
  const excludedParentId = parentFamily.partners[parentIndex === 0 ? 1 : 0];
  const pathPrefix = String(parentIndex);
  const directAncestorPaths = {
    [selectedParentId]: pathPrefix,
    ...Object.fromEntries(
      Object.entries(branchTree.directAncestorPaths).map(
        ([ancestorId, ancestorPath]) => [
          ancestorId,
          `${pathPrefix}${ancestorPath}`
        ]
      )
    )
  };
  const branchConnection = {
    id: `${parentFamily.id} ${branchName}`,
    partners: [selectedParentId],
    children: [personId]
  };
  const keepPerson = (id) => id !== excludedParentId;
  const keepFamily = (family) => family.id !== parentFamily.id;

  return {
    ...branchTree,
    focusPersonId: personId,
    directAncestorIds: [
      selectedParentId,
      ...branchTree.directAncestorIds
    ],
    directAncestorPaths,
    people: treeData.people.filter(
      (id) =>
        id === personId ||
        (keepPerson(id) && branchTree.people.includes(id))
    ),
    families: [
      ...branchTree.families.filter(keepFamily),
      branchConnection
    ],
    groupingFamilies: [
      ...(branchTree.groupingFamilies ?? branchTree.families).filter(
        keepFamily
      ),
      branchConnection
    ]
  };
}

export function selectStrictAncestry(treeData, personId) {
  const ancestry = traceDirectAncestry(treeData, personId);
  const includedPeople = new Set([
    personId,
    ...ancestry.directAncestorIds
  ]);

  return {
    ...treeData,
    focusPersonId: personId,
    directAncestorIds: [...ancestry.directAncestorIds],
    directAncestorPaths: Object.fromEntries(ancestry.directAncestorPaths),
    people: treeData.people.filter((id) => includedPeople.has(id)),
    families: treeData.families
      .filter((family) => ancestry.parentFamilyIds.has(family.id))
      .map((family) => ({
        ...family,
        children: family.children.filter((id) =>
          ancestry.lineageChildrenByFamily.get(family.id)?.has(id)
        )
      }))
  };
}

export function selectDescendants(treeData, personId) {
  const descendants = traceDirectDescendants(treeData, personId);
  const bloodLineage = new Set([
    personId,
    ...descendants.directDescendantIds
  ]);
  const caregivingDescendantIds = new Set();
  const guardianships = [];
  const caregivingFamilyIds = new Set();
  const pendingCaregivers = [...bloodLineage];
  const processedCaregivers = new Set();

  while (pendingCaregivers.length > 0) {
    const caregiverId = pendingCaregivers.shift();
    if (processedCaregivers.has(caregiverId)) {
      continue;
    }
    processedCaregivers.add(caregiverId);

    for (const guardianship of treeData.guardianships ?? []) {
      if (!guardianship.guardians.includes(caregiverId)) {
        continue;
      }
      if (!guardianships.some((item) => item.id === guardianship.id)) {
        guardianships.push(guardianship);
      }
      const branch = traceDirectDescendants(treeData, guardianship.child);
      for (const familyId of branch.descendantFamilyIds) {
        caregivingFamilyIds.add(familyId);
      }
      for (const descendantId of [
        guardianship.child,
        ...branch.directDescendantIds
      ]) {
        if (!bloodLineage.has(descendantId)) {
          caregivingDescendantIds.add(descendantId);
        }
        pendingCaregivers.push(descendantId);
      }
    }
  }

  const descendantLineage = new Set([
    ...bloodLineage,
    ...caregivingDescendantIds
  ]);
  const includedPeople = new Set(descendantLineage);
  const spouseIds = new Set();
  const includedFamilyIds = new Set([
    ...descendants.descendantFamilyIds,
    ...caregivingFamilyIds
  ]);
  const groupingFamilyIds = new Set(includedFamilyIds);

  for (const family of treeData.families) {
    if (
      !family.partners.some((partnerId) =>
        descendantLineage.has(partnerId)
      )
    ) {
      continue;
    }
    includedFamilyIds.add(family.id);
    for (const partnerId of family.partners) {
      includedPeople.add(partnerId);
      if (!descendantLineage.has(partnerId)) {
        spouseIds.add(partnerId);
      }
    }
  }

  const families = treeData.families
    .filter((family) => includedFamilyIds.has(family.id))
    .map((family) => ({
      ...family,
      children: family.children.filter((id) => includedPeople.has(id))
    }));
  const orderedPeople = orderPeopleWithPartners(
    treeData.people,
    includedPeople,
    families,
    descendantLineage,
    personId
  );

  return {
    ...treeData,
    focusPersonId: personId,
    directDescendantIds: [...descendants.directDescendantIds],
    caregivingDescendantIds: [...caregivingDescendantIds],
    guardianships,
    spouseIds: [...spouseIds],
    spouseGroupingLineageIds: [...descendantLineage],
    groupLineageSpouses: true,
    displayOrderPaths: Object.fromEntries(
      orderedPeople.map((id, index) => [id, String(index).padStart(6, "0")])
    ),
    people: orderedPeople,
    families,
    groupingFamilies: treeData.families
      .filter((family) => groupingFamilyIds.has(family.id))
      .map((family) => ({
        ...family,
        children: family.children.filter((id) => includedPeople.has(id))
      }))
  };
}

function orderPeopleWithPartners(
  people,
  includedPeople,
  families,
  lineagePeople,
  focusPersonId
) {
  const ordered = [];
  const added = new Set();
  const prioritizedPeople = [
    focusPersonId,
    ...people.filter((personId) => personId !== focusPersonId)
  ];

  for (const personId of prioritizedPeople) {
    if (
      !includedPeople.has(personId) ||
      !lineagePeople.has(personId) ||
      added.has(personId)
    ) {
      continue;
    }
    ordered.push(personId);
    added.add(personId);
    for (const family of families) {
      if (
        family.partners.length !== 2 ||
        !family.partners.includes(personId)
      ) {
        continue;
      }
      const partnerId = family.partners.find((id) => id !== personId);
      if (includedPeople.has(partnerId) && !added.has(partnerId)) {
        ordered.push(partnerId);
        added.add(partnerId);
      }
    }
  }

  for (const personId of people) {
    if (includedPeople.has(personId) && !added.has(personId)) {
      ordered.push(personId);
      added.add(personId);
    }
  }

  return ordered;
}

export function selectBloodRelatives(treeData, personId) {
  const ancestry = traceDirectAncestry(treeData, personId);
  const bloodPeople = new Set([
    personId,
    ...ancestry.directAncestorIds
  ]);
  const includedPeople = new Set(bloodPeople);
  const spouseIds = new Set();
  const includedFamilyIds = new Set();
  const includedSiblingGroupIds = new Set();
  const pending = [...bloodPeople];
  const processed = new Set();

  while (pending.length > 0) {
    const bloodPersonId = pending.shift();
    if (processed.has(bloodPersonId)) {
      continue;
    }
    processed.add(bloodPersonId);

    for (const group of treeData.siblingGroups ?? []) {
      if (!group.children.includes(bloodPersonId)) {
        continue;
      }
      includedSiblingGroupIds.add(group.id);
      for (const siblingId of group.children) {
        includedPeople.add(siblingId);
        if (!bloodPeople.has(siblingId)) {
          bloodPeople.add(siblingId);
          pending.push(siblingId);
        }
      }
    }

    for (const family of treeData.families) {
      if (!family.partners.includes(bloodPersonId)) {
        continue;
      }
      includedFamilyIds.add(family.id);
      for (const partnerId of family.partners) {
        includedPeople.add(partnerId);
        if (!bloodPeople.has(partnerId)) {
          spouseIds.add(partnerId);
        }
      }
      for (const childId of family.children) {
        includedPeople.add(childId);
        if (!bloodPeople.has(childId)) {
          bloodPeople.add(childId);
          pending.push(childId);
        }
      }
    }
  }

  return {
    ...treeData,
    focusPersonId: personId,
    directAncestorIds: [...ancestry.directAncestorIds],
    directAncestorPaths: Object.fromEntries(ancestry.directAncestorPaths),
    bloodRelativeIds: [...bloodPeople],
    spouseIds: [...spouseIds].filter((id) => !bloodPeople.has(id)),
    spouseGroupingLineageIds: [...bloodPeople],
    groupLineageSpouses: true,
    deriveFamilyStatus: false,
    people: treeData.people.filter((id) => includedPeople.has(id)),
    families: treeData.families.filter((family) =>
      includedFamilyIds.has(family.id)
    ),
    groupingFamilies: [
      ...treeData.families.filter((family) =>
        includedFamilyIds.has(family.id)
      ),
      ...(treeData.siblingGroups ?? []).filter((group) =>
        includedSiblingGroupIds.has(group.id)
      )
    ]
  };
}

function traceDirectDescendants(treeData, personId) {
  if (!treeData.people.includes(personId)) {
    throw new Error(`Unknown descendants person "${personId}"`);
  }

  const descendantFamilyIds = new Set();
  const directDescendantIds = new Set();
  const pending = [personId];
  const processed = new Set();

  while (pending.length > 0) {
    const parentId = pending.shift();
    if (processed.has(parentId)) {
      continue;
    }
    processed.add(parentId);

    for (const family of treeData.families) {
      if (!family.partners.includes(parentId) || family.children.length === 0) {
        continue;
      }
      descendantFamilyIds.add(family.id);
      for (const childId of family.children) {
        if (!directDescendantIds.has(childId)) {
          directDescendantIds.add(childId);
          pending.push(childId);
        }
      }
    }
  }

  return { descendantFamilyIds, directDescendantIds };
}

function traceDirectAncestry(treeData, personId) {
  if (!treeData.people.includes(personId)) {
    throw new Error(`Unknown ancestry person "${personId}"`);
  }

  const parentFamilyIds = new Set();
  const lineageChildrenByFamily = new Map();
  const directAncestorIds = new Set();
  const directAncestorPaths = new Map();
  const pending = [{ personId, path: "" }];

  while (pending.length > 0) {
    const { personId: childId, path: childPath } = pending.shift();
    for (const family of treeData.families) {
      if (!family.children.includes(childId)) {
        continue;
      }
      parentFamilyIds.add(family.id);
      const lineageChildren =
        lineageChildrenByFamily.get(family.id) ?? new Set();
      lineageChildren.add(childId);
      lineageChildrenByFamily.set(family.id, lineageChildren);

      for (const [parentIndex, parentId] of family.partners.entries()) {
        if (!directAncestorIds.has(parentId)) {
          directAncestorIds.add(parentId);
          const parentPath = `${childPath}${parentIndex}`;
          directAncestorPaths.set(parentId, parentPath);
          pending.push({ personId: parentId, path: parentPath });
        }
      }
    }
  }

  return {
    parentFamilyIds,
    lineageChildrenByFamily,
    directAncestorIds,
    directAncestorPaths
  };
}

export function calculateLevels(treeData) {
  const levels = new Map(treeData.people.map((personId) => [personId, 0]));
  const maxPasses = Math.max(1, treeData.people.length ** 2);

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    for (const family of treeData.families) {
      const parentLevel = Math.max(
        ...family.partners.map((personId) => levels.get(personId))
      );
      for (const partner of family.partners) {
        if (levels.get(partner) < parentLevel) {
          levels.set(partner, parentLevel);
          changed = true;
        }
      }
      if (family.children.length > 0) {
        const requiredParentLevel =
          Math.max(
            ...family.children.map((personId) => levels.get(personId))
          ) - 1;
        for (const partner of family.partners) {
          if (levels.get(partner) < requiredParentLevel) {
            levels.set(partner, requiredParentLevel);
            changed = true;
          }
        }
      }
      for (const child of family.children) {
        const childLevel =
          Math.max(...family.partners.map((personId) => levels.get(personId))) +
          1;
        if (levels.get(child) < childLevel) {
          levels.set(child, childLevel);
          changed = true;
        }
      }
    }
    for (const group of treeData.siblingGroups ?? []) {
      const includedSiblings = group.children.filter((personId) =>
        levels.has(personId)
      );
      if (includedSiblings.length < 2) {
        continue;
      }
      const siblingLevel = Math.max(
        ...includedSiblings.map((personId) => levels.get(personId))
      );
      for (const siblingId of includedSiblings) {
        if (levels.get(siblingId) < siblingLevel) {
          levels.set(siblingId, siblingLevel);
          changed = true;
        }
      }
    }
    if (!changed) {
      return levels;
    }
  }

  throw new Error(
    "Family relationships contain a generation cycle that cannot be laid out"
  );
}

export function calculateViewLevels(treeData) {
  const levels = calculateLevels(treeData);
  const focusLevel = levels.get(treeData.focusPersonId);
  if (focusLevel === undefined) {
    return levels;
  }
  for (const personId of treeData.caregivingPeerIds ?? []) {
    if (levels.has(personId)) {
      levels.set(personId, focusLevel);
    }
  }
  return levels;
}
