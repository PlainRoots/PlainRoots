import {
  selectAncestry,
  selectBloodRelatives,
  selectDescendants,
  selectFullTree,
  selectMaternalAncestry,
  selectPaternalAncestry,
  selectPerson,
  selectStrictAncestry
} from "./tree-layout.mjs";

export const views = [
  {
    id: "full",
    nameKey: "fullViewName",
    descriptionKey: "fullViewDescription",
    requiresPerson: false,
    titleKey: "treeTitle",
    htmlStem: "index",
    pngStem: "family-tree",
    selectTree: selectFullTree
  },
  {
    id: "person",
    nameKey: "personViewName",
    descriptionKey: "personViewDescription",
    requiresPerson: true,
    titleKey: "personTreeTitle",
    htmlStem: "index.person",
    pngStem: "family-tree.person",
    selectTree: selectPerson
  },
  {
    id: "ancestry",
    nameKey: "ancestryViewName",
    descriptionKey: "ancestryViewDescription",
    requiresPerson: true,
    titleKey: "ancestryTreeTitle",
    htmlStem: "index.ancestry",
    pngStem: "family-tree.ancestry",
    selectTree: selectAncestry
  },
  {
    id: "ancestry-maternal",
    nameKey: "maternalAncestryViewName",
    descriptionKey: "maternalAncestryViewDescription",
    requiresPerson: true,
    titleKey: "maternalAncestryTreeTitle",
    htmlStem: "index.ancestry-maternal",
    pngStem: "family-tree.ancestry-maternal",
    selectTree: selectMaternalAncestry
  },
  {
    id: "ancestry-paternal",
    nameKey: "paternalAncestryViewName",
    descriptionKey: "paternalAncestryViewDescription",
    requiresPerson: true,
    titleKey: "paternalAncestryTreeTitle",
    htmlStem: "index.ancestry-paternal",
    pngStem: "family-tree.ancestry-paternal",
    selectTree: selectPaternalAncestry
  },
  {
    id: "ancestry-strict",
    nameKey: "strictAncestryViewName",
    descriptionKey: "strictAncestryViewDescription",
    requiresPerson: true,
    titleKey: "strictAncestryTreeTitle",
    htmlStem: "index.ancestry-strict",
    pngStem: "family-tree.ancestry-strict",
    selectTree: selectStrictAncestry
  },
  {
    id: "descendants",
    nameKey: "descendantsViewName",
    descriptionKey: "descendantsViewDescription",
    requiresPerson: true,
    titleKey: "descendantsTreeTitle",
    htmlStem: "index.descendants",
    pngStem: "family-tree.descendants",
    selectTree: selectDescendants
  },
  {
    id: "blood-relatives",
    nameKey: "bloodRelativesViewName",
    descriptionKey: "bloodRelativesViewDescription",
    requiresPerson: true,
    titleKey: "bloodRelativesTreeTitle",
    htmlStem: "index.blood-relatives",
    pngStem: "family-tree.blood-relatives",
    selectTree: selectBloodRelatives
  }
];

export function getView(viewId) {
  const view = views.find((candidate) => candidate.id === viewId);
  if (!view) {
    throw new Error(
      `Unknown view "${viewId}". Available views: ${views.map(({ id }) => id).join(", ")}`
    );
  }
  return view;
}

export function parseViewArguments(args) {
  const legacyPersonId = argumentValue(args, "--ancestors");
  const view = getView(
    argumentValue(args, "--view") ?? (legacyPersonId ? "ancestry" : "full")
  );
  const personId = argumentValue(args, "--person") ?? legacyPersonId;
  const highlightMissing = args.includes("--highlight-missing");

  if (view.requiresPerson && !personId) {
    throw new Error(`View "${view.id}" requires --person <person-id>`);
  }
  if (!view.requiresPerson && personId) {
    throw new Error(`View "${view.id}" does not accept --person`);
  }

  return { view, personId, highlightMissing };
}

export function selectViewTree(view, treeData, personId) {
  return {
    ...view.selectTree(treeData, personId),
    hideFamilyStatusForVisibleParents: true
  };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  const value = index === -1 ? null : args[index + 1];
  return !value || value.startsWith("--") ? null : value;
}
