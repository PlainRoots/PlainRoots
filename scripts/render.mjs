import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { calculateLevels } from "./tree-layout.mjs";
import { parseViewArguments, selectViewTree } from "./views.mjs";
import {
  CANONICAL_LOCALE_ID,
  loadLocale,
  localeSuffix
} from "./locales.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const localeId = argumentValue("--locale") ?? CANONICAL_LOCALE_ID;
const { view, personId, highlightMissing } = parseViewArguments(
  process.argv.slice(2)
);
const localizedSuffix = localeSuffix(localeId);
const modeSuffix = highlightMissing ? ".highlight-missing" : "";
const locale = await loadLocale(projectRoot, localeId);
const styles = await readFile(path.join(projectRoot, "styles.css"), "utf8");
const layout = {
  cardWidth: cssPixelValue(styles, "--person-card-width"),
  cardHeight: cssPixelValue(styles, "--person-card-height"),
  generationGap: cssPixelValue(styles, "--generation-vertical-gap"),
  itemGap: cssPixelValue(styles, "--generation-item-gap")
};

const generateArguments = [
  path.join(projectRoot, "scripts", "generate.mjs"),
  "--view",
  view.id,
  "--locale",
  localeId
];
if (personId) {
  generateArguments.push("--person", personId);
}
if (highlightMissing) {
  generateArguments.push("--highlight-missing");
}
await run(process.execPath, generateArguments);

const browser = await findBrowser();
const outputStem = view.requiresPerson
  ? `${personId}.${view.id}`
  : view.pngStem;
const outputLocaleSuffix = view.requiresPerson
  ? `.${localeId}`
  : localizedSuffix;
const outputPath = path.join(
  projectRoot,
  `${outputStem}${modeSuffix}${outputLocaleSuffix}.png`
);
const previewDate = new Intl.DateTimeFormat(locale.languageTag, {
  dateStyle: "long"
}).format(new Date());
const pageUrl = new URL(
  pathToFileURL(
    path.join(
      projectRoot,
      `${view.htmlStem}${modeSuffix}${localizedSuffix}.html`
    )
  ).href
);
pageUrl.searchParams.set("previewDate", previewDate);
const completeTree = JSON.parse(
  await readFile(path.join(projectRoot, "tree.json"), "utf8")
);
const tree = selectViewTree(view, completeTree, personId);
const viewport = calculateViewport(tree, layout);

await run(browser, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--allow-file-access-from-files",
  `--window-size=${viewport.width},${viewport.height}`,
  `--screenshot=${outputPath}`,
  pageUrl.href
]);

console.log(`Rendered ${outputPath}`);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function calculateViewport(treeData, layoutData) {
  const levels = calculateLevels(treeData);
  const generationCount = Math.max(...levels.values()) + 1;
  const groupingFamilies = treeData.groupingFamilies ?? treeData.families;
  const visibleSiblingGroupIds = new Set(
    groupingFamilies
      .filter((family) =>
        Array.from({ length: generationCount }, (_, level) => level).some(
          (level) =>
            family.children.filter(
              (personId) => levels.get(personId) === level
            ).length >= 2
        )
      )
      .map((family) => family.id)
  );
  let widestRow = 0;

  for (let level = 0; level < generationCount; level += 1) {
    const people = treeData.people.filter(
      (personId) => levels.get(personId) === level
    );
    const inlineCouples = treeData.families.filter(
      (family) =>
        family.partners.length === 2 &&
        family.children.length === 0 &&
        family.partners.every((personId) => levels.get(personId) === level)
    ).length;
    const siblingGroups =
      visibleSiblingGroupIds.size >= 2
        ? groupingFamilies.filter(
            (family) =>
              family.children.filter(
                (personId) => levels.get(personId) === level
              ).length >= 2
          ).length
        : 0;
    const tokenCount = people.length + inlineCouples;
    const rowWidth =
      people.length * layoutData.cardWidth +
      inlineCouples * 112 +
      siblingGroups * 50 +
      Math.max(0, tokenCount - 1) * layoutData.itemGap;
    widestRow = Math.max(widestRow, rowWidth);
  }

  const generationChromeHeight = 102;
  const pageChromeHeight = 335;
  return {
    width: Math.max(1800, widestRow + 220),
    height: Math.ceil(
      Math.max(
        900,
        generationCount * (layoutData.cardHeight + generationChromeHeight) +
          (generationCount - 1) * layoutData.generationGap +
          pageChromeHeight
      )
    )
  };
}

function cssPixelValue(css, propertyName) {
  const match = css.match(
    new RegExp(`${propertyName}:\\s*(\\d+(?:\\.\\d+)?)px`)
  );
  if (!match) {
    throw new Error(`styles.css is missing pixel value ${propertyName}`);
  }
  return Number(match[1]);
}

async function findBrowser() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known browser location.
    }
  }
  throw new Error("Could not find Microsoft Edge or Google Chrome");
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
